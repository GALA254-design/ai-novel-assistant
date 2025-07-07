import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import { useToast } from '../components/ui/Toast';
import { HiOutlineBold, HiOutlineItalic, HiOutlineUnderline } from 'react-icons/hi2';
import { FiFileText, FiDownload, FiZap, FiPlus, FiArrowLeft, FiSave, FiEye, FiEdit3, FiBookOpen, FiChevronLeft, FiChevronRight, FiBook } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateStory, createStory, getUserStories, addChapter, updateChapter, getChapters } from '../services/storyService';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

const promptTemplates = [
  'Write a dramatic opening scene.',
  'Describe a futuristic city in vivid detail.',
  'Create a dialogue between two rivals.',
  'Summarize the story so far in one paragraph.',
];

const genreOptions = [
  'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 'Nonfiction', 'Other'
];
const toneOptions = [
  'Serious', 'Humorous', 'Dramatic', 'Light', 'Dark', 'Other'
];

// Enhanced StoryEditor page with Card, Input, Button, and Modal
const StoryEditor: React.FC = () => {
  const [storyForm, setStoryForm] = useState({ title: '', genre: '', tone: '', description: '', content: '' });
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);
  const [aiContinuing, setAiContinuing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'txt' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [documentViewMode, setDocumentViewMode] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Add ref for textarea
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Function to split content into pages (1800 chars per page)
  const splitContentIntoPages = (content: string): string[] => {
    const charsPerPage = 1800;
    const pages: string[] = [];
    let currentPage = '';
    let charCount = 0;
    
    const lines = content.split('\n');
    
    for (const line of lines) {
      const lineLength = line.length + 1; // +1 for newline
      
      if (charCount + lineLength > charsPerPage && currentPage.trim()) {
        // Current page is full, start new page
        pages.push(currentPage.trim());
        currentPage = line + '\n';
        charCount = lineLength;
      } else {
        // Add line to current page
        currentPage += line + '\n';
        charCount += lineLength;
      }
    }
    
    // Add the last page if it has content
    if (currentPage.trim()) {
      pages.push(currentPage.trim());
    }
    
    return pages.length > 0 ? pages : [''];
  };

  // Get combined content from chapters
  const getCombinedContent = (): string => {
    return chapters.map(chapter => `${chapter.title}\n\n${chapter.content}`).join('\n\n');
  };

  // Memoized page calculations to prevent infinite re-renders
  const pages = useMemo(() => {
    return splitContentIntoPages(getCombinedContent());
  }, [chapters]);

  // Update totalPages when pages change
  useEffect(() => {
    setTotalPages(pages.length);
    // Reset current page if it's out of bounds
    if (currentPage > pages.length && pages.length > 0) {
      setCurrentPage(1);
    }
  }, [pages.length, currentPage, pages]);

  // Get current page content
  const getCurrentPageContent = (): string => {
    return pages[currentPage - 1] || '';
  };

  // Function to handle page navigation
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Function to update content when editing a specific page
  const handlePageContentChange = (newPageContent: string) => {
    const updatedPages = [...pages];
    updatedPages[currentPage - 1] = newPageContent;
    const updatedContent = updatedPages.join('\n\n');
    
    // Parse the combined content back into chapters
    const chapterRegex = /CHAPTER\s+\d+[:\s]+([^\n]+)/gi;
    const chapterMatches = [...updatedContent.matchAll(chapterRegex)];
    
    if (chapterMatches.length > 0) {
      const newChapters = [];
      let lastIndex = 0;
      
      for (let i = 0; i < chapterMatches.length; i++) {
        const match = chapterMatches[i];
        const chapterTitle = match[0];
        const chapterStart = match.index!;
        
        // Get content from last chapter end to this chapter start
        const chapterContent = updatedContent.substring(lastIndex, chapterStart).trim();
        
        if (i > 0) {
          // Update previous chapter content
          newChapters[i - 1].content = chapterContent;
        }
        
        // Add new chapter
        newChapters.push({
          id: chapters[i]?.id || null,
          title: chapterTitle,
          content: '',
          chapterNumber: i + 1,
        });
        
        lastIndex = chapterStart + chapterTitle.length;
      }
      
      // Add content for the last chapter
      const lastChapterContent = updatedContent.substring(lastIndex).trim();
      if (newChapters.length > 0) {
        newChapters[newChapters.length - 1].content = lastChapterContent;
      }
      
      setChapters(newChapters);
    } else {
      // No chapters detected, update the first chapter
      if (chapters.length > 0) {
        const updatedChapters = [...chapters];
        updatedChapters[0] = {
          ...updatedChapters[0],
          content: updatedContent
        };
        setChapters(updatedChapters);
      }
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (storyForm.title || chapters.length > 0) {
      setAutoSaving(true);
      const timer = setTimeout(async () => {
        try {
          // Only save if we have a storyId or projectId
          if (storyId || projectId) {
            // Combine all chapters into main story content
            const combinedContent = chapters.map(chapter => 
              `${chapter.title}\n\n${chapter.content}`
            ).join('\n\n');

            // Save story metadata silently
            if (storyId) {
              await updateStory(storyId, {
                title: storyForm.title,
                content: combinedContent,
                genre: storyForm.genre,
                tone: storyForm.tone,
              });
            } else if (projectId) {
              // Create new story if none exists
              const newStoryId = await createStory({
                title: storyForm.title,
                content: combinedContent,
                genre: storyForm.genre,
                tone: storyForm.tone,
                authorId: user.uid,
                authorName: user.displayName || '',
              });
              setStoryId(newStoryId);
            }

            // Save chapters silently
            for (let i = 0; i < chapters.length; i++) {
              const chapter = chapters[i];
              if (chapter.id) {
                await updateChapter(user.uid, storyId || projectId!, chapter.id, {
                  title: chapter.title,
                  content: chapter.content,
                  chapterNumber: chapter.chapterNumber,
                });
              } else {
                const newChapterId = await addChapter(user.uid, storyId || projectId!, {
                  title: chapter.title,
                  content: chapter.content,
                  chapterNumber: chapter.chapterNumber,
                });
                // Update the chapter with the new ID
                const updatedChapters = [...chapters];
                updatedChapters[i] = { ...chapter, id: newChapterId };
                setChapters(updatedChapters);
              }
            }
          }
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save error:', error);
        } finally {
          setAutoSaving(false);
        }
      }, 3000); // Auto-save every 3 seconds
      return () => clearTimeout(timer);
    }
  }, [storyForm, chapters, storyId, projectId, user]);

  // Fetch chapters on load
  useEffect(() => {
    if (user && projectId) {
      getChapters(user.uid, projectId).then(chaps => {
        setChapters(chaps);
        if (chaps.length === 0) {
          // Create first chapter if none exist
          const firstChapter = {
            id: null,
            title: 'CHAPTER 1: THE BEGINNING',
            content: '',
            chapterNumber: 1,
          };
          setChapters([firstChapter]);
          setCurrentChapterIndex(0);
        } else {
          setCurrentChapterIndex(0);
        }
      });
    }
  }, [user, projectId]);

  // Handle story form changes
  const handleStoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setStoryForm({ ...storyForm, [e.target.name]: e.target.value });
  };

  // Handle chapter changes
  const handleChapterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updatedChapters = [...chapters];
    updatedChapters[currentChapterIndex] = {
      ...updatedChapters[currentChapterIndex],
      [e.target.name]: e.target.value
    };
    setChapters(updatedChapters);
  };

  // Handle export functionality
  const handleExport = (format: string) => {
    if (!storyForm.title || chapters.length === 0) {
      showToast('Please add content before exporting.', 'error');
      return;
    }

    const fullContent = chapters.map(chapter => 
      `${chapter.title}\n\n${chapter.content}`
    ).join('\n\n');
    const title = storyForm.title || 'Untitled Story';
    
    switch (format) {
      case 'pdf':
        // Create PDF using browser print functionality
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
                <div class="content">${fullContent.replace(/\n/g, '<br>')}</div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        break;
        
      case 'txt':
        // Download as text file
        const blob = new Blob([fullContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
        
      case 'docx':
        // For DOCX, we'll use a simple approach - download as HTML that can be opened in Word
        const htmlContent = `
          <html>
            <head>
              <title>${title}</title>
              <meta charset="utf-8">
            </head>
            <body>
              <h1>${title}</h1>
              <div>${fullContent.replace(/\n/g, '<br>')}</div>
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
    
    setShowExportModal(false);
    showToast(`Story exported as ${format.toUpperCase()} successfully!`, 'success');
  };

  // AI Refinement for current chapter
  const handleAiRefine = async () => {
    const currentChapter = chapters[currentChapterIndex];
    if (!currentChapter?.content) {
      alert('Please add content to the current chapter before refining.');
      return;
    }

    setAiRefining(true);
    try {
      // Collect comprehensive story information for better AI prompts
      const storyInfo = {
        title: storyForm.title || 'Untitled Novel',
        genre: storyForm.genre || 'General',
        tone: storyForm.tone || 'Neutral',
        totalChapters: chapters.length,
        currentChapter: currentChapterIndex + 1,
        chapterTitle: currentChapter.title,
        chapterContent: currentChapter.content,
        previousChapters: chapters.slice(0, currentChapterIndex).map(ch => ({
          title: ch.title,
          content: ch.content
        })),
        prompt: 'Refine and improve this chapter, making it more engaging and polished while maintaining consistency with the story\'s genre, tone, and previous chapters.'
      };

      const response = await fetch('https://n8nromeo123987.app.n8n.cloud/webhook-test/ultimate-agentic-novel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyInfo),
      });
      const blob = await response.blob();
      const refined = await blob.text();
      
      const updatedChapters = [...chapters];
      updatedChapters[currentChapterIndex] = {
        ...updatedChapters[currentChapterIndex],
        content: refined
      };
      setChapters(updatedChapters);
      showToast('Chapter refined successfully!', 'success');
    } catch (error) {
      console.error('Error refining chapter:', error);
      showToast('Failed to refine chapter. Please try again.', 'error');
    } finally {
      setAiRefining(false);
    }
  };

  // AI Continue current chapter
  const handleAiContinue = async () => {
    const currentChapter = chapters[currentChapterIndex];
    if (!currentChapter?.content) {
      alert('Please add content to the current chapter before continuing.');
      return;
    }

    setAiContinuing(true);
    try {
      // Collect comprehensive story information for better AI prompts
      const storyInfo = {
        title: storyForm.title || 'Untitled Novel',
        genre: storyForm.genre || 'General',
        tone: storyForm.tone || 'Neutral',
        totalChapters: chapters.length,
        currentChapter: currentChapterIndex + 1,
        chapterTitle: currentChapter.title,
        chapterContent: currentChapter.content,
        previousChapters: chapters.slice(0, currentChapterIndex).map(ch => ({
          title: ch.title,
          content: ch.content
        })),
        prompt: 'Continue this chapter naturally, adding the next part that flows seamlessly from the current content while maintaining the story\'s genre, tone, and narrative style.'
      };

      const response = await fetch('https://n8nromeo123987.app.n8n.cloud/webhook-test/ultimate-agentic-novel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyInfo),
      });
      const blob = await response.blob();
      const continued = await blob.text();
      
      const updatedChapters = [...chapters];
      updatedChapters[currentChapterIndex] = {
        ...updatedChapters[currentChapterIndex],
        content: currentChapter.content + '\n\n' + continued
      };
      setChapters(updatedChapters);
      showToast('Chapter continued successfully!', 'success');
    } catch (error) {
      console.error('Error continuing chapter:', error);
      showToast('Failed to continue chapter. Please try again.', 'error');
    } finally {
      setAiContinuing(false);
    }
  };

  // Chapter navigation
  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  // Add new chapter
  const handleAddChapter = () => {
    const newChapter = {
      id: null,
      title: `CHAPTER ${chapters.length + 1}: NEW CHAPTER`,
      content: '',
      chapterNumber: chapters.length + 1,
    };
    setChapters([...chapters, newChapter]);
    setCurrentChapterIndex(chapters.length);
    setShowChapterModal(false);
  };

  // Formatting helpers
  const applyFormat = (tag: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const [start, end] = [textarea.selectionStart, textarea.selectionEnd];
    let before = chapters[currentChapterIndex]?.content?.slice(0, start) || '';
    let selected = chapters[currentChapterIndex]?.content?.slice(start, end) || '';
    let after = chapters[currentChapterIndex]?.content?.slice(end) || '';
    let open = '', close = '';
    if (tag === 'bold') { open = '**'; close = '**'; }
    if (tag === 'italic') { open = '*'; close = '*'; }
    if (tag === 'underline') { open = '<u>'; close = '</u>'; }
    
    if (selected.startsWith(open) && selected.endsWith(close)) {
      selected = selected.slice(open.length, selected.length - close.length);
    } else {
      selected = open + selected + close;
    }
    
    const newContent = before + selected + after;
    const updatedChapters = [...chapters];
    updatedChapters[currentChapterIndex] = {
      ...updatedChapters[currentChapterIndex],
      content: newContent
    };
    setChapters(updatedChapters);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + open.length, end + open.length);
    }, 0);
  };

  // Word and character count for current chapter
  const currentChapter = chapters[currentChapterIndex];
  const wordCount = currentChapter?.content?.trim() ? currentChapter.content.trim().split(/\s+/).length : 0;
  const charCount = currentChapter?.content?.length || 0;

  const handleBack = () => {
    navigate('/dashboard');
  };

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
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Story Editor</h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm lg:text-base font-medium">Edit and refine your story</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl"
            >
              Export
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleBack}
              className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl"
            >
              Back
            </Button>
          </div>
        </div>

        {/* Mobile-First Layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-full">
          {/* Main Content - Full width on mobile */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6 w-full max-w-full order-2 lg:order-1">
            {/* Story Specifications */}
            <Card className="p-4 sm:p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={storyForm.title}
                    onChange={handleStoryChange}
                    placeholder="Story title"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    required
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Genre</label>
                  <select
                    name="genre"
                    value={storyForm.genre}
                    onChange={handleStoryChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="">Select genre</option>
                    {genreOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Tone</label>
                  <select
                    name="tone"
                    value={storyForm.tone}
                    onChange={handleStoryChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="">Select tone</option>
                    {toneOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">View Mode</label>
                  <div className="flex gap-2">
                    <Button
                      variant={documentViewMode ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setDocumentViewMode(true)}
                      className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl"
                    >
                      Document
                    </Button>
                    <Button
                      variant={!documentViewMode ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setDocumentViewMode(false)}
                      className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl"
                    >
                      Editor
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Document View Mode */}
            {documentViewMode && (
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Document Header */}
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <div className="text-center">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {storyForm.title || 'Untitled Story'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {storyForm.genre && `Genre: ${storyForm.genre}`} {storyForm.tone && `• Tone: ${storyForm.tone}`}
                    </p>
                  </div>
                </div>
                
                {/* Document Content */}
                <div className="relative p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-300px)]">
                  {/* Document Content Editor */}
                  <textarea
                    key={`page-${currentPage}-${pages.length}`}
                    name="content"
                    value={getCurrentPageContent()}
                    onChange={(e) => handlePageContentChange(e.target.value)}
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
            )}

            {/* Editor View Mode */}
            {!documentViewMode && (
              <div className="space-y-4 sm:space-y-6">
                {/* Chapter Navigation */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="secondary"
                      onClick={handlePrevChapter}
                      disabled={currentChapterIndex <= 0}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                    >
                      <FiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Chapter {currentChapterIndex + 1} of {chapters.length}
                    </span>
                    <Button
                      variant="secondary"
                      onClick={handleNextChapter}
                      disabled={currentChapterIndex >= chapters.length - 1}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowChapterModal(true)}
                    className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl"
                  >
                    Add Chapter
                  </Button>
                </div>

                {/* Chapter Editor */}
                {currentChapter && (
                  <Card className="p-4 sm:p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
                    <div className="space-y-4 sm:space-y-6">
                      <input
                        type="text"
                        name="title"
                        value={currentChapter.title}
                        onChange={handleChapterChange}
                        placeholder="Chapter title"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base font-semibold"
                        required
                      />
                    <textarea
                      name="content"
                        value={currentChapter.content}
                        onChange={handleChapterChange}
                        placeholder="Write your chapter content here..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base min-h-[300px]"
                      required
                    />
                    </div>
                  </Card>
                )}
                      </div>
                    )}
                  </div>

          {/* Mobile-Optimized Sidebar - Full width on mobile, sidebar on desktop */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4 sm:gap-6 order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start min-w-0 max-w-full">
            {/* AI Tools */}
            <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
              <h4 className="font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">AI Tools</h4>
              <div className="space-y-2 sm:space-y-3">
                <Button
                  variant="secondary"
                  onClick={handleAiRefine}
                  disabled={aiRefining || !currentChapter?.content}
                  className="w-full flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-3 rounded-xl"
                >
                  {aiRefining ? <Loader size={12} className="sm:w-3.5 sm:h-3.5" /> : <FiZap className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {aiRefining ? 'Refining...' : 'Refine Chapter'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleAiContinue}
                  disabled={aiContinuing || !currentChapter?.content}
                  className="w-full flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-3 rounded-xl"
                >
                  {aiContinuing ? <Loader size={12} className="sm:w-3.5 sm:h-3.5" /> : <FiEdit3 className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {aiContinuing ? 'Continuing...' : 'Continue Chapter'}
                </Button>
              </div>
            </Card>

            {/* Chapter Stats */}
            <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
              <h4 className="font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">Chapter Stats</h4>
              <div className="space-y-2 text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                <div className="flex justify-between">
                  <span>Words:</span>
                  <span className="font-semibold">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Characters:</span>
                  <span className="font-semibold">{charCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chapters:</span>
                  <span className="font-semibold">{chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className="font-semibold">{currentChapterIndex + 1}</span>
                  </div>
                  </div>
            </Card>

            {/* Chapter List */}
            <Card className="p-4 sm:p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
              <h4 className="font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">Chapter List</h4>
              <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                {chapters.map((chapter, index) => (
                    <button
                    key={index}
                    onClick={() => setCurrentChapterIndex(index)}
                    className={`w-full text-left px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-xs sm:text-sm ${
                      index === currentChapterIndex
                        ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
                        : 'bg-blue-100/70 dark:bg-blue-900/70 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100'
                    }`}
                  >
                    <div className="font-semibold truncate">{chapter.title}</div>
                    <div className="text-xs opacity-75">
                      {chapter.content ? `${chapter.content.length} chars` : 'Empty'}
                    </div>
                    </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Chapter Modal */}
      <Modal isOpen={showChapterModal} onClose={() => setShowChapterModal(false)} title="Add New Chapter">
        <div className="space-y-4">
          <p className="text-blue-900 dark:text-blue-100">
            Create a new chapter for your novel. You can edit the title and content later.
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleAddChapter}>
              Create Chapter
            </Button>
            <Button variant="secondary" onClick={() => setShowChapterModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Export Modal */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Story">
        <div className="space-y-4">
          <p className="text-blue-900 dark:text-blue-100">
            Choose the format you'd like to export your story in:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StoryEditor; 