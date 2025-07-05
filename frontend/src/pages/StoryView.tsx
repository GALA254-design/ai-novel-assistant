import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { getUserProjects, getChapters, Project, Chapter, Story, updateStory, updateProject, updateChapter, getUserStories, addChapter } from '../services/storyService';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '../components/ui/Toast';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { FiArrowLeft, FiEdit, FiSave, FiDownload, FiFileText, FiFile, FiZap, FiEdit3, FiBookOpen, FiChevronLeft, FiChevronRight, FiPlus, FiBook } from 'react-icons/fi';
import Modal from '../components/ui/Modal';

const StoryView: React.FC = () => {
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const { showToast } = useToast();
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [chapterEditMode, setChapterEditMode] = useState(false);
  const [chapterForm, setChapterForm] = useState<{ title: string; content: string }>({ title: '', content: '' });
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);
  const [aiContinuing, setAiContinuing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (user && projectId) {
      setLoading(true);
      getUserProjects(user.uid).then(projects => {
        const found = projects.find(p => p.id === projectId);
        setProject(found || null);
        if (found) setForm(found);
        setLoading(false);
      });
      getChapters(user.uid, projectId).then(chs => {
        setChapters(chs);
        console.log('Fetched chapters:', chs);
        if (chs.length > 0) {
          setCurrentChapterIndex(0);
          setChapterForm({ title: chs[0].title, content: chs[0].content });
        }
      });
      (async () => {
        const storyDoc = await getDoc(doc(db, 'stories', projectId));
        if (storyDoc.exists()) {
          const storyData = { id: storyDoc.id, ...storyDoc.data() } as Story;
          setStory(storyData);
          setForm(storyData);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    if (chapters.length > 0 && currentChapterIndex >= 0 && currentChapterIndex < chapters.length) {
      setChapterForm({
        title: chapters[currentChapterIndex].title,
        content: chapters[currentChapterIndex].content,
      });
    }
  }, [currentChapterIndex, chapters]);

  // Auto-save functionality
  useEffect(() => {
    if (form.title || chapters.length > 0) {
      setAutoSaving(true);
      const timer = setTimeout(async () => {
        try {
          if (story && (form.title || chapters.length > 0)) {
            // Combine all chapters into main story content
            const combinedContent = chapters.map(chapter => 
              `${chapter.title}\n\n${chapter.content}`
            ).join('\n\n');

            await updateStory(story.id!, {
              title: form.title,
              content: combinedContent,
              genre: form.genre,
              tone: form.tone,
            });

            // Save chapters silently
            for (let i = 0; i < chapters.length; i++) {
              const chapter = chapters[i];
              if (chapter.id) {
                await updateChapter(user.uid, projectId!, chapter.id, {
                  title: chapter.title,
                  content: chapter.content,
                  chapterNumber: chapter.chapterNumber,
                });
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
  }, [form, chapters, story, user, projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add separate handler for chapter editing
  const handleChapterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setChapterForm({ ...chapterForm, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      if (story) {
        // Combine all chapters into main story content
        const combinedContent = chapters.map(chapter => 
          `${chapter.title}\n\n${chapter.content}`
        ).join('\n\n');

        await updateStory(story.id!, {
          title: form.title,
          content: combinedContent, // Save combined chapters as main content
          genre: form.genre,
          tone: form.tone,
        });
        setStory({ ...story, ...form, content: combinedContent });
        showToast('Novel updated successfully!', 'success');
        navigate('/dashboard', { state: { refresh: true } });
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
      setEditMode(false);
    } catch (err) {
      showToast('Failed to update. Please try again.', 'error');
    }
  };

  const handleCancel = () => {
    if (story) setForm(story);
    else if (project) setForm(project);
    setEditMode(false);
  };

  // Chapter navigation
  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      const newIndex = currentChapterIndex - 1;
      setCurrentChapterIndex(newIndex);
      setChapterEditMode(false);
      // Update chapterForm with the new chapter's data
      if (chapters[newIndex]) {
        setChapterForm({
          title: chapters[newIndex].title,
          content: chapters[newIndex].content,
        });
      }
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      const newIndex = currentChapterIndex + 1;
      setCurrentChapterIndex(newIndex);
      setChapterEditMode(false);
      // Update chapterForm with the new chapter's data
      if (chapters[newIndex]) {
        setChapterForm({
          title: chapters[newIndex].title,
          content: chapters[newIndex].content,
        });
      }
    }
  };

  // Function to enter edit mode for current chapter
  const handleEditChapter = () => {
    const currentChapter = chapters[currentChapterIndex];
    if (currentChapter) {
      setChapterForm({
        title: currentChapter.title,
        content: currentChapter.content,
      });
      setChapterEditMode(true);
    }
  };

  const handleChapterSave = async () => {
    if (!user || !projectId || chapters.length === 0) return;
    const chapter = chapters[currentChapterIndex];
    
    try {
      await updateChapter(user.uid, projectId, chapter.id, {
        title: chapterForm.title,
        content: chapterForm.content,
        chapterNumber: chapter.chapterNumber,
      });
      
      const updatedChapters = [...chapters];
      updatedChapters[currentChapterIndex] = { ...chapter, ...chapterForm };
      setChapters(updatedChapters);
      setChapterEditMode(false);
      
      // Also update the main story content with combined chapters
      if (story) {
        const combinedContent = updatedChapters.map(ch => 
          `${ch.title}\n\n${ch.content}`
        ).join('\n\n');
        
        await updateStory(story.id!, {
          content: combinedContent,
        });
      }
      
      showToast('Chapter saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving chapter:', error);
      showToast('Failed to save chapter. Please try again.', 'error');
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
    // Initialize chapterForm with the new chapter's data
    setChapterForm({
      title: newChapter.title,
      content: newChapter.content,
    });
    setShowChapterModal(false);
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
        title: story?.title || 'Untitled Novel',
        genre: story?.genre || 'General',
        tone: story?.tone || 'Neutral',
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
        title: story?.title || 'Untitled Novel',
        genre: story?.genre || 'General',
        tone: story?.tone || 'Neutral',
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

  if (loading) return <Loader />;

  if (story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
        <div className="w-full mx-auto p-2 sm:p-8 max-w-full">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 via-white to-indigo-100 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 backdrop-blur-md border-b border-blue-100 dark:border-blue-900 flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-3 sm:py-4 shadow-xl rounded-b-2xl mb-4 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                aria-label="Go back to Dashboard"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-3 tracking-tight">Novel View</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
              {autoSaving && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 dark:text-orange-400">
                  <Loader size={14} />
                  <span className="hidden sm:inline">Auto-saving...</span>
                  <span className="sm:hidden">Saving...</span>
                </div>
              )}
              {lastSaved && !autoSaving && (
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span className="hidden sm:inline">Last saved: {lastSaved.toLocaleTimeString()}</span>
                  <span className="sm:hidden">Saved</span>
                </div>
              )}
              <Button 
                variant="secondary" 
                onClick={() => {
                  const doc = new Document({
                    sections: [
                      {
                        properties: {},
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun(story.title || ''),
                            ],
                            heading: 'Heading1',
                          }),
                          new Paragraph(story.content || ''),
                        ],
                      },
                    ],
                  });
                  Packer.toBlob(doc).then(blob => {
                    saveAs(blob, `${story.title || 'story'}.docx`);
                  });
                }}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <FiFileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export as DOCX</span>
                <span className="sm:hidden">DOCX</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  const doc = new jsPDF();
                  doc.setFontSize(16);
                  doc.text(story.title || '', 10, 20);
                  doc.setFontSize(12);
                  const splitText = doc.splitTextToSize(story.content || '', 180);
                  doc.text(splitText, 10, 30);
                  doc.save(`${story.title || 'story'}.pdf`);
                }}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <FiDownload className="w-4 h-4" />
                <span className="hidden sm:inline">Export as PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>
          </div>

          {/* Story Specifications */}
          <Card className="mb-6 p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
            <h3 className="text-xl font-bold text-blue-700 dark:text-orange-300 mb-4">Story Specifications</h3>
            {editMode ? (
              <div className="space-y-3 sm:space-y-4">
                <input
                  name="title"
                  value={form.title || ''}
                  onChange={handleChange}
                  placeholder="Novel Title..."
                  className="w-full text-lg sm:text-xl font-bold bg-transparent outline-none border-b-2 border-blue-200 dark:border-orange-700 px-2 py-2"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-transparent outline-none border border-blue-200 dark:border-orange-700 text-blue-500 dark:text-orange-200 font-semibold text-sm sm:text-base"
                    name="genre"
                    value={form.genre || ''}
                    onChange={handleChange}
                    placeholder="Genre..."
                  />
                  <input
                    className="w-full px-3 py-2 rounded-lg bg-transparent outline-none border border-blue-200 dark:border-orange-700 text-blue-500 dark:text-orange-200 font-semibold text-sm sm:text-base"
                    name="tone"
                    value={form.tone || ''}
                    onChange={handleChange}
                    placeholder="Tone..."
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
                    <FiSave className="w-4 h-4" />
                    Save
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2">{story.title}</h2>
                  <div className="text-blue-500 dark:text-orange-200 mb-4 font-semibold">{story.genre} &middot; {story.tone}</div>
                </div>
                <Button variant="primary" onClick={() => setEditMode(true)} className="flex items-center gap-2">
                  <FiEdit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            )}
          </Card>

          {/* Chapter Navigation */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-3 sm:p-4 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto mb-3 sm:mb-0">
              <Button
                variant="secondary"
                onClick={handlePrevChapter}
                disabled={currentChapterIndex === 0}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous Chapter</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              <div className="flex items-center gap-2">
                <FiBook className="w-4 h-4 text-blue-600 dark:text-orange-400" />
                <span className="font-semibold text-blue-900 dark:text-blue-100 text-xs sm:text-sm">
                  {chapters.length > 0 ? chapters[currentChapterIndex]?.title : 'No Chapters'}
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={handleNextChapter}
                disabled={currentChapterIndex === chapters.length - 1}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next Chapter</span>
                <span className="sm:hidden">Next</span>
                <FiChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowChapterModal(true)}
              className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Add Chapter
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 mt-4">
            {/* Left: Chapter content - wider on mobile */}
            <div className="lg:w-3/4 flex-1 min-w-0">
              {chapters.length > 0 ? (
                <div className="w-full max-w-none lg:max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-0 my-4 sm:my-8 animate-fadeIn">
                  {chapterEditMode ? (
                    <div className="flex flex-col gap-4 sm:gap-6">
                      <input
                        name="title"
                        value={chapterForm.title || ''}
                        onChange={handleChapterChange}
                        placeholder="CHAPTER 1: CHAPTER TITLE"
                        className="w-full text-lg sm:text-xl lg:text-2xl font-bold bg-transparent outline-none px-4 sm:px-6 pt-6 sm:pt-8 pb-2 rounded-t-2xl"
                        autoFocus
                        required
                      />
                      <textarea
                        name="content"
                        value={chapterForm.content || ''}
                        onChange={handleChapterChange}
                        placeholder="Write your chapter content here..."
                        className="w-full min-h-[50vh] sm:min-h-[60vh] bg-transparent outline-none resize-none px-4 sm:px-6 pb-6 sm:pb-8 text-base sm:text-lg lg:text-xl leading-relaxed font-medium rounded-b-2xl"
                        style={{ fontFamily: 'serif', boxShadow: 'none', border: 'none' }}
                        required
                      />
                      <div className="flex flex-col sm:flex-row gap-2 px-4 sm:px-6 pb-4 sm:pb-6">
                        <Button variant="primary" onClick={handleChapterSave} className="flex items-center gap-2">
                          <FiSave className="w-4 h-4" />
                          Save Chapter
                        </Button>
                        <Button variant="secondary" onClick={() => setChapterEditMode(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-orange-300 mb-2">
                            {chapters[currentChapterIndex]?.title}
                          </h2>
                        </div>
                        <Button variant="primary" onClick={handleEditChapter} className="flex items-center gap-2 w-full sm:w-auto">
                          <FiEdit className="w-4 h-4" />
                          Edit Chapter
                        </Button>
                      </div>
                      <div className="prose prose-blue dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-line">
                        {chapters[currentChapterIndex]?.content}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-700 dark:text-orange-300 mb-4">No Chapters Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Start writing your novel by adding the first chapter.</p>
                  <Button variant="primary" onClick={() => setShowChapterModal(true)} className="flex items-center gap-2">
                    <FiPlus className="w-4 h-4" />
                    Add First Chapter
                  </Button>
                </div>
              )}
            </div>
            {/* Right: AI Tools and Stats - full width on mobile */}
            <div className="lg:w-1/4 w-full flex-shrink-0 flex flex-col gap-4 sm:gap-6 lg:sticky lg:top-20 lg:self-start min-w-0">
              {/* AI Tools */}
              <Card className="p-3 sm:p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
                <h4 className="font-bold mb-3 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">AI Tools</h4>
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    variant="secondary"
                    onClick={handleAiRefine}
                    disabled={aiRefining || !chapters[currentChapterIndex]?.content}
                    className="w-full flex items-center gap-2 text-sm"
                  >
                    {aiRefining ? <Loader size={14} /> : <FiZap className="w-4 h-4" />}
                    {aiRefining ? 'Refining...' : 'Refine Chapter'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleAiContinue}
                    disabled={aiContinuing || !chapters[currentChapterIndex]?.content}
                    className="w-full flex items-center gap-2 text-sm"
                  >
                    {aiContinuing ? <Loader size={14} /> : <FiEdit3 className="w-4 h-4" />}
                    {aiContinuing ? 'Continuing...' : 'Continue Chapter'}
                  </Button>
                </div>
              </Card>

              <Card className="p-3 sm:p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
                <h4 className="font-bold mb-2 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">Chapter Stats</h4>
                <div className="space-y-2 text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                  <div className="flex justify-between">
                    <span>Words:</span>
                    <span className="font-semibold">
                      {chapters[currentChapterIndex]?.content ? chapters[currentChapterIndex].content.trim().split(/\s+/).length : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span className="font-semibold">
                      {chapters[currentChapterIndex]?.content ? chapters[currentChapterIndex].content.length : 0}
                    </span>
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

              <Card className="p-3 sm:p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
                <h4 className="font-bold mb-2 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">Chapter List</h4>
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {chapters.map((chapter, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentChapterIndex(index);
                        setChapterEditMode(false);
                        // Update chapterForm with the selected chapter's data
                        setChapterForm({
                          title: chapter.title,
                          content: chapter.content,
                        });
                      }}
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
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn">
      {/* Back button */}
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
        {/* Project info */}
        <Card className="mb-6 p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <div className="flex gap-6">
            {project?.coverImage && (
              <img src={project.coverImage} alt="Cover" className="w-32 h-44 object-cover rounded-xl shadow-lg" />
            )}
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-4">
                  <input
                    className="w-full text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2 bg-white/80 dark:bg-blue-950/80 border border-blue-200 dark:border-orange-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                    name="title"
                    value={form.title || ''}
                    onChange={handleChange}
                    placeholder="Project title..."
                  />
                  <div className="flex gap-4">
                    <input
                      className="flex-1 px-4 py-2 rounded-xl border border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80 text-blue-500 dark:text-orange-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                      name="genre"
                      value={form.genre || ''}
                      onChange={handleChange}
                      placeholder="Genre..."
                    />
                    <input
                      className="flex-1 px-4 py-2 rounded-xl border border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80 text-blue-500 dark:text-orange-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                      name="status"
                      value={form.status || ''}
                      onChange={handleChange}
                      placeholder="Status..."
                    />
                  </div>
                  <textarea
                    className="w-full px-4 py-2 rounded-xl border border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200 resize-y"
                    name="description"
                    value={form.description || ''}
                    onChange={handleChange}
                    placeholder="Project description..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
                      <FiSave className="w-4 h-4" />
                      Save
                    </Button>
                    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2">{project?.title}</h2>
                      <div className="text-blue-500 dark:text-orange-200 mb-2 font-semibold">{project?.genre} &middot; {project?.status}</div>
                      <div className="text-gray-700 dark:text-gray-200">{project?.description}</div>
                    </div>
                    <Button variant="primary" onClick={() => { setEditMode(true); setChapterEditMode(true); }} className="flex items-center gap-2">
                      <FiEdit className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StoryView; 