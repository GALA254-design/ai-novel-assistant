import React, { useState, useEffect } from 'react';
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
  const [storyForm, setStoryForm] = useState({ title: '', genre: '', tone: '', description: '' });
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
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Add ref for textarea
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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
  const handleStoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  const handleExport = async (type: 'pdf' | 'txt') => {
    if (!storyForm.title || chapters.length === 0) {
      alert('Please add content before exporting.');
      return;
    }

    setExporting(type);
    try {
      const fullContent = chapters.map(chapter => 
        `${chapter.title}\n\n${chapter.content}`
      ).join('\n\n');

      if (type === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(storyForm.title || '', 10, 20);
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(fullContent || '', 180);
        doc.text(splitText, 10, 30);
        doc.save(`${storyForm.title || 'story'}.pdf`);
      } else if (type === 'txt') {
        const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${storyForm.title || 'story'}.txt`);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(null);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
      <div className="w-full mx-auto p-2 sm:p-8 max-w-full">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 via-white to-indigo-100 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 backdrop-blur-md border-b border-blue-100 dark:border-blue-900 flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-3 sm:py-4 shadow-xl rounded-b-2xl mb-4 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handleBack}
              className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              aria-label="Go back to Dashboard"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-3 tracking-tight">Novel Editor</h2>
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
              onClick={() => handleExport('txt')}
              disabled={exporting === 'txt'}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              {exporting === 'txt' ? <Loader size={14} /> : <FiFileText className="w-4 h-4" />}
              <span className="hidden sm:inline">Export TXT</span>
              <span className="sm:hidden">TXT</span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleExport('pdf')}
              disabled={exporting === 'pdf'}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              {exporting === 'pdf' ? <Loader size={14} /> : <FiDownload className="w-4 h-4" />}
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>

        {/* Story Specifications */}
        <Card className="mb-4 sm:mb-6 p-4 sm:p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-blue-700 dark:text-orange-300 mb-3 sm:mb-4">Story Specifications</h3>
          <div className="space-y-3 sm:space-y-4">
            <input
              name="title"
              value={storyForm.title}
              onChange={handleStoryChange}
              placeholder="Novel Title..."
              className="w-full text-lg sm:text-xl font-bold bg-transparent outline-none border-b-2 border-blue-200 dark:border-orange-700 px-2 py-2"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <input
                className="w-full px-3 py-2 rounded-lg bg-transparent outline-none border border-blue-200 dark:border-orange-700 text-blue-500 dark:text-orange-200 font-semibold text-sm sm:text-base"
                name="genre"
                value={storyForm.genre}
                onChange={handleStoryChange}
                placeholder="Genre..."
                list="genre-options"
              />
              <datalist id="genre-options">
                {genreOptions.map(option => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <input
                className="w-full px-3 py-2 rounded-lg bg-transparent outline-none border border-blue-200 dark:border-orange-700 text-blue-500 dark:text-orange-200 font-semibold text-sm sm:text-base"
                name="tone"
                value={storyForm.tone}
                onChange={handleStoryChange}
                placeholder="Tone..."
                list="tone-options"
              />
              <datalist id="tone-options">
                {toneOptions.map(option => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <textarea
              name="description"
              value={storyForm.description}
              onChange={handleStoryChange}
              placeholder="Story description..."
              className="w-full px-3 py-2 rounded-lg bg-transparent outline-none border border-blue-200 dark:border-orange-700 text-gray-700 dark:text-gray-200 resize-none text-sm sm:text-base"
              rows={3}
            />
          </div>
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
                {currentChapter?.title || 'No Chapter'}
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
          {/* Left: Chapter Editor - wider on mobile */}
          <div className="lg:w-3/4 flex-1 min-w-0">
            <div className="w-full max-w-none lg:max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-0 my-4 sm:my-8 animate-fadeIn">
              <div className="flex flex-col gap-4 sm:gap-6">
                <input
                  name="title"
                  value={currentChapter?.title || ''}
                  onChange={handleChapterChange}
                  placeholder="CHAPTER 1: CHAPTER TITLE"
                  className="w-full text-lg sm:text-xl lg:text-2xl font-bold bg-transparent outline-none px-4 sm:px-6 pt-6 sm:pt-8 pb-2 rounded-t-2xl"
                  autoFocus
                  required
                />
                <textarea
                  ref={textareaRef}
                  name="content"
                  value={currentChapter?.content || ''}
                  onChange={handleChapterChange}
                  placeholder="Write your chapter content here..."
                  className="w-full min-h-[50vh] sm:min-h-[60vh] bg-transparent outline-none resize-none px-4 sm:px-6 pb-6 sm:pb-8 text-base sm:text-lg lg:text-xl leading-relaxed font-medium rounded-b-2xl"
                  style={{ fontFamily: 'serif', boxShadow: 'none', border: 'none' }}
                  required
                />
              </div>
            </div>
          </div>
          {/* Right: Panels - full width on mobile */}
          <div className="lg:w-1/4 w-full flex-shrink-0 flex flex-col gap-4 sm:gap-6 lg:sticky lg:top-20 lg:self-start min-w-0">
            {/* AI Tools */}
            <Card className="p-3 sm:p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
              <h4 className="font-bold mb-3 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">AI Tools</h4>
              <div className="space-y-2 sm:space-y-3">
                <Button
                  variant="secondary"
                  onClick={handleAiRefine}
                  disabled={aiRefining || !currentChapter?.content}
                  className="w-full flex items-center gap-2 text-sm"
                >
                  {aiRefining ? <Loader size={14} /> : <FiZap className="w-4 h-4" />}
                  {aiRefining ? 'Refining...' : 'Refine Chapter'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleAiContinue}
                  disabled={aiContinuing || !currentChapter?.content}
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

            <Card className="p-3 sm:p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl">
              <h4 className="font-bold mb-2 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent text-sm sm:text-base">Chapter List</h4>
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
    </div>
  );
};

export default StoryEditor; 