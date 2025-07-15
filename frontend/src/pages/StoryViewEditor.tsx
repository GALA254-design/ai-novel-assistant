import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { getUserProjects, getChapters, Project, Chapter, Story, updateStory, updateProject, updateChapter, getUserStories, addChapter, deleteChapter } from '../services/storyService';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '../components/ui/Toast';
import { FiArrowLeft, FiEdit, FiSave, FiDownload, FiFileText, FiPlus, FiTrash2, FiChevronUp, FiChevronDown, FiBookOpen, FiEye, FiEyeOff, FiChevronLeft, FiChevronRight, FiZap, FiEdit3 } from 'react-icons/fi';
import Modal from '../components/ui/Modal';

const StoryViewEditor: React.FC = () => {
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showStoryContent, setShowStoryContent] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);
  const [aiContinuing, setAiContinuing] = useState(false);

  useEffect(() => {
    if (user && projectId) {
      setLoading(true);
      getUserProjects(user.uid).then(projects => {
        const found = projects.find(p => p.id === projectId);
        setProject(found || null);
        if (found) setForm(found);
        setLoading(false);
      });
      getChapters(user.uid, projectId).then(async (chs) => {
        setChapters(chs);
        console.log('Fetched chapters:', chs);
        
        // Auto-detect chapters from story content if no chapters exist
        if (chs.length === 0 && story?.content) {
          const detectedChapters = detectChaptersFromContent(story.content);
          if (detectedChapters.length > 0) {
            setChapters(detectedChapters);
            // Save detected chapters to Firebase
            for (const chapter of detectedChapters) {
              await addChapter(user.uid, projectId, chapter);
            }
          }
        }
      });
      (async () => {
        const storyDoc = await getDoc(doc(db, 'stories', projectId));
        if (storyDoc.exists()) {
          const storyData = { id: storyDoc.id, ...storyDoc.data() } as Story;
          setStory(storyData);
          setForm(storyData);
          console.log('DEBUG: Loaded story content length:', (form.content || '').length);
          console.log('DEBUG: Loaded story content preview:', (form.content || '').slice(0, 200));
        }
      })();
    } else {
      setLoading(false);
    }
  }, [user, projectId]);

  // Debug: Log content length and preview after form.content changes
  useEffect(() => {
    console.log('DEBUG: form.content length at render:', (form.content || '').length);
    console.log('DEBUG: form.content preview:', (form.content || '').slice(0, 200));
  }, [form.content]);

  // Function to detect chapters from story content
  const detectChaptersFromContent = (content: string): Chapter[] => {
    const lines = content.split('\n');
    const chapters: Chapter[] = [];
    let currentChapter: Chapter | null = null;
    let chapterContent: string[] = [];
    let chapterNumber = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect chapter headings (various patterns)
      if (trimmedLine.match(/^(CHAPTER|Chapter)\s+\d+/i) || 
          trimmedLine.match(/^Chapter\s+\d+:/i) ||
          trimmedLine.match(/^CHAPTER\s+\d+:/i) ||
          trimmedLine.match(/^\d+\.\s+[A-Z]/) ||
          trimmedLine.match(/^[A-Z][A-Z\s]+$/)) {
        
        // Save previous chapter if exists
        if (currentChapter) {
          currentChapter.content = chapterContent.join('\n').trim();
          chapters.push(currentChapter);
        }
        
        // Start new chapter
        currentChapter = {
          id: null,
          title: trimmedLine,
          content: '',
          chapterNumber: chapterNumber++
        };
        chapterContent = [];
      } else if (currentChapter) {
        // Add line to current chapter content
        chapterContent.push(line);
      }
    }
    
    // Add the last chapter
    if (currentChapter) {
      currentChapter.content = chapterContent.join('\n').trim();
      chapters.push(currentChapter);
    }
    
    return chapters;
  };

  // --- ROBUST CHARACTER-BASED PAGINATION FIX ---
  const splitContentIntoPagesWithBounds = (content: string): { text: string, start: number, end: number }[] => {
    const charsPerPage = 1800;
    const pages: { text: string, start: number, end: number }[] = [];
    let start = 0;
    while (start < content.length) {
      const end = Math.min(start + charsPerPage, content.length);
      pages.push({
        text: content.slice(start, end),
        start,
        end
      });
      start = end;
    }
    return pages.length > 0 ? pages : [{ text: '', start: 0, end: 0 }];
  };

  // State for page bounds
  const [pageBounds, setPageBounds] = useState<{ text: string, start: number, end: number }[]>([]);

  // Update page bounds and totalPages when content changes
  useEffect(() => {
    const bounds = splitContentIntoPagesWithBounds(form.content || '');
    setPageBounds(bounds);
    setTotalPages(bounds.length);
    // Reset currentPage if out of bounds
    if (currentPage > bounds.length) setCurrentPage(1);
    // Debug output:
    console.log('DEBUG: Page bounds:', bounds);
    console.log('DEBUG: Total pages:', bounds.length);
    console.log('DEBUG: Content length:', (form.content || '').length);
    // eslint-disable-next-line
  }, [form.content]);

  // Get current page content
  const getCurrentPageContent = (): string => {
    return pageBounds[currentPage - 1]?.text || '';
  };

  // Update only the edited page's slice in the full content
  const handlePageContentChange = (newPageContent: string) => {
    if (!pageBounds[currentPage - 1]) return;
    const { start, end } = pageBounds[currentPage - 1];
    const before = (form.content || '').slice(0, start);
    const after = (form.content || '').slice(end);
    // Ensure newPageContent ends with a newline for consistency
    const newContent = before + newPageContent + after;
    setForm({ ...form, content: newContent });
  };
  // --- ROBUST CHARACTER-BASED PAGINATION FIX END ---

  // Function to handle page navigation
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Merge all chapters into main story content
  const handleMergeChaptersToStory = async () => {
    if (!story || !user || !projectId) return;
    
    try {
      const combinedContent = chapters.map(chapter => 
        `${chapter.title}\n\n${chapter.content}`
      ).join('\n\n');
      
      await updateStory(story.id!, {
        content: combinedContent,
      });
      
      setForm({ ...form, content: combinedContent });
      showToast('Chapters merged into story content!', 'success');
      console.log('DEBUG: Merged content length:', (form.content || '').length);
      console.log('DEBUG: Merged content preview:', (form.content || '').slice(0, 200));
    } catch (error) {
      console.error('Error merging chapters:', error);
      showToast('Failed to merge chapters. Please try again.', 'error');
    }
  };

  // Debounced auto-save functionality
  const debouncedAutoSave = useCallback(async () => {
    if (!story || !user || !projectId) return;
    
    setAutoSaving(true);
    try {
      // Save story metadata
      await updateStory(story.id!, {
        title: form.title,
        content: form.content,
        genre: form.genre,
        tone: form.tone,
      });

      // Save chapters
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        if (chapter.id) {
          await updateChapter(user.uid, projectId, chapter.id, {
            title: chapter.title,
            content: chapter.content,
            chapterNumber: chapter.chapterNumber,
          });
        }
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [story, form, chapters, user, projectId]);

  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (form.title || form.content || chapters.length > 0) {
      autoSaveTimeoutRef.current = setTimeout(debouncedAutoSave, 800);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [form, chapters, debouncedAutoSave]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (story) {
        // Save the combined content from the single editor
        const combinedContent = form.content;
        
        // Auto-detect chapters from the content only when saving
        const detectedChapters = detectChaptersFromContent(combinedContent);
        
        // Save story content
        await updateStory(story.id!, {
          title: form.title,
          content: combinedContent,
          genre: form.genre,
          tone: form.tone,
        });
        setStory({ ...story, ...form, content: combinedContent });
        console.log('DEBUG: Saved story content length:', (form.content || '').length);
        console.log('DEBUG: Saved story content preview:', (form.content || '').slice(0, 200));
        
        // Save detected chapters to Firebase only when saving
        if (detectedChapters.length > 0) {
          // Clear existing chapters and save new ones
          for (const chapter of chapters) {
            if (chapter.id) {
              await deleteChapter(user.uid, projectId!, chapter.id);
            }
          }
          
          for (const chapter of detectedChapters) {
            await addChapter(user.uid, projectId!, chapter);
          }
          setChapters(detectedChapters);
        }
        
        showToast('Story saved successfully!', 'success');
        setEditMode(false);
      } else if (project) {
        await updateProject(user.uid, project.id!, {
          title: form.title,
          genre: form.genre,
          description: form.description,
          status: form.status,
        });
        setProject({ ...project, ...form });
        showToast('Project updated!', 'success');
        setEditMode(false);
      }
    } catch (err) {
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm(story);
  };

  // AI Refinement for current page content
  const handleAiRefine = async () => {
    const currentContent = getCurrentPageContent();
    if (!currentContent) {
      showToast('Please add content to the current page before refining.', 'error');
      return;
    }

    setAiRefining(true);
    try {
      // Collect comprehensive story information for better AI prompts
      const storyInfo = {
        title: form.title || 'Untitled Novel',
        genre: form.genre || 'General',
        tone: form.tone || 'Neutral',
        totalPages: totalPages,
        currentPage: currentPage,
        pageContent: currentContent,
        prompt: 'Refine and improve this page content, making it more engaging and polished while maintaining consistency with the story\'s genre, tone, and overall narrative.'
      };

      const response = await fetch('https://n8nromeo123987.app.n8n.cloud/webhook-test/ultimate-agentic-novel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyInfo),
      });
      const blob = await response.blob();
      const refined = await blob.text();
      
      // Update the current page content
      handlePageContentChange(refined);
      showToast('Page content refined successfully!', 'success');
    } catch (error) {
      console.error('Error refining content:', error);
      showToast('Failed to refine content. Please try again.', 'error');
    } finally {
      setAiRefining(false);
    }
  };

  // AI Continuation for current page content
  const handleAiContinue = async () => {
    const currentContent = getCurrentPageContent();
    if (!currentContent) {
      showToast('Please add content to the current page before continuing.', 'error');
      return;
    }

    setAiContinuing(true);
    try {
      // Collect comprehensive story information for better AI prompts
      const storyInfo = {
        title: form.title || 'Untitled Novel',
        genre: form.genre || 'General',
        tone: form.tone || 'Neutral',
        totalPages: totalPages,
        currentPage: currentPage,
        pageContent: currentContent,
        prompt: 'Continue this page content naturally, maintaining the story\'s flow, genre, tone, and narrative style. Add engaging content that follows logically from what has been written.'
      };

      const response = await fetch('https://n8nromeo123987.app.n8n.cloud/webhook-test/ultimate-agentic-novel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyInfo),
      });
      const blob = await response.blob();
      const continued = await blob.text();
      
      // Update the current page content
      handlePageContentChange(currentContent + '\n\n' + continued);
      showToast('Page content continued successfully!', 'success');
    } catch (error) {
      console.error('Error continuing content:', error);
      showToast('Failed to continue content. Please try again.', 'error');
    } finally {
      setAiContinuing(false);
    }
  };

  const handleExport = (format: string) => {
    let title = form.title && form.title.trim() ? form.title : 'Untitled Story';
    let content = form.content || '';
    if (!form.title || !form.title.trim()) {
      showToast('No title provided. Exporting as "Untitled Story".', 'warning');
    }
    if (!form.content || !form.content.trim()) {
      showToast('No content provided. Exporting empty story.', 'warning');
    }
    switch (format) {
      case 'pdf': {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>${title}</title>
                <style>
                  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 1in; }
                  h1 { text-align: center; margin-bottom: 2em; }
                  .content { text-align: justify; }
                </style>
              </head>
              <body>
                <h1>${title}</h1>
                <div class="content">${content.replace(/\n/g, '<br>')}</div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        break;
      }
      case 'txt': {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
      }
      case 'docx': {
        const htmlContent = `
          <html>
            <head>
              <title>${title}</title>
              <meta charset="utf-8">
            </head>
            <body>
              <h1>${title}</h1>
              <div>${content.replace(/\n/g, '<br>')}</div>
            </body>
          </html>
        `;
        const docxBlob = new Blob([htmlContent], { type: 'text/html' });
        const docxUrl = URL.createObjectURL(docxBlob);
        const docxA = document.createElement('a');
        docxA.href = docxUrl;
        docxA.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(docxA);
        docxA.click();
        document.body.removeChild(docxA);
        URL.revokeObjectURL(docxUrl);
        break;
    }
    }
    setShowExportModal(false);
    showToast(`Story exported as ${format.toUpperCase()} successfully!`, 'success');
  };

  if (loading) return <Loader />;

  if (story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="w-full max-w-full mx-auto p-3 sm:p-6 lg:p-8">
          {/* Mobile-Optimized Header */}
          <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-6 shadow-xl rounded-2xl mb-4 sm:mb-8 w-full max-w-full">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 via-indigo-500 to-indigo-700 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center justify-center">
                <FiBookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1 sm:flex-none">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Story View & Edit</h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm lg:text-base font-medium">Read and edit your story</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl"
              >
                Back
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowExportModal(true)}
                className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl"
              >
                Export
              </Button>
            </div>
          </div>

          {/* Mobile-First Layout */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-full">
            {/* Main Content - Full width on mobile */}
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-6 w-full max-w-full order-2 lg:order-1">
              {/* Story Specifications */}
              <Card className="p-4 sm:p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={form.title || ''}
                      onChange={handleChange}
                      placeholder="Story title"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Genre</label>
                    <input
                      type="text"
                      name="genre"
                      value={form.genre || ''}
                      onChange={handleChange}
                      placeholder="Genre"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Tone</label>
                    <input
                      type="text"
                      name="tone"
                      value={form.tone || ''}
                      onChange={handleChange}
                      placeholder="Tone"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </Card>

              {/* Document View */}
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Document Header */}
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <div className="text-center">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {form.title || 'Untitled Story'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {form.genre && `Genre: ${form.genre}`} {form.tone && `• Tone: ${form.tone}`}
                    </p>
                  </div>
                </div>
                
                {/* Document Content */}
                <div className="relative p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-300px)]">
                  {/* Document Content Editor */}
                  <textarea
                    key={`page-${currentPage}-${pageBounds.length}`}
                    name="content"
                    value={getCurrentPageContent()}
                    onChange={e => handlePageContentChange(e.target.value)}
                    placeholder="Write your story content here... Use chapter headings like 'CHAPTER 1: Title' to create chapters automatically."
                    className="w-full h-full bg-transparent outline-none resize-none text-gray-900 dark:text-gray-100 leading-relaxed"
                    style={{ 
                      fontFamily: 'Times New Roman, serif',
                      fontSize: '12pt',
                      lineHeight: '1.6',
                      textAlign: 'justify',
                      border: 'none',
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                      minHeight: 'calc(100vh - 300px)',
                      overflow: 'hidden',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                    required
                  />
                  
                  {/* Page Number */}
                  <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
                
                {/* Mobile-Optimized Page Navigation Controls */}
                <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-2 sm:gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl p-2 sm:p-3 shadow-xl">
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  >
                    <FiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 px-2 sm:px-4">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile-Optimized Sidebar - Full width on mobile, sidebar on desktop */}
            <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4 sm:gap-6 order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start min-w-0 max-w-full">
              {/* AI Tools */}
              {/* Removed AI Tools card */}

              {/* Story Stats */}
              <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
                <h4 className="font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">Story Stats</h4>
                <div className="space-y-2 text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                  <div className="flex justify-between">
                    <span>Words:</span>
                    <span className="font-semibold">{form.content ? form.content.split(' ').length : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span className="font-semibold">{form.content ? form.content.length : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pages:</span>
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chapters:</span>
                    <span className="font-semibold">{chapters.length}</span>
                  </div>
                </div>
              </Card>

              {/* Chapter List */}
              <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
                <h4 className="font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">Chapter List</h4>
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {chapters.map((chapter, index) => (
                    <div
                      key={index}
                      className="w-full text-left px-2 sm:px-3 py-2 rounded-lg bg-blue-100/70 dark:bg-blue-900/70 text-blue-900 dark:text-blue-100 text-xs sm:text-sm"
                    >
                      <div className="font-semibold truncate">{chapter.title}</div>
                      <div className="text-xs opacity-75">
                        {chapter.content ? `${chapter.content.length} chars` : 'Empty'}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
        {/* Export Modal */}
        <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Story">
          <div className="space-y-4">
            <p className="text-blue-900 dark:text-blue-100">
              Choose the format you'd like to export your story in:
            </p>
            <Button
              variant="secondary"
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2"
            >
              <FiFileText className="w-4 h-4" />
              PDF Document
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('txt')}
              className="flex items-center gap-2"
            >
              <FiFileText className="w-4 h-4" />
              Text File (.txt)
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('docx')}
              className="flex items-center gap-2"
            >
              <FiFileText className="w-4 h-4" />
              Word Document (.docx)
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              Print
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn">
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Go back to Dashboard"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <Card className="mb-6 p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <div className="flex gap-6">
            {project?.coverImage && (
              <img src={project.coverImage} alt="Cover" className="w-32 h-44 object-cover rounded-xl shadow-lg" />
            )}
            <div className="flex-1">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2">{project?.title}</h2>
                    <div className="text-blue-500 dark:text-orange-200 mb-2 font-semibold">{project?.genre} &middot; {project?.status}</div>
                    <div className="text-gray-700 dark:text-gray-200">{project?.description}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StoryViewEditor; 