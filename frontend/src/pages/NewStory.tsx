import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProject, addChapter, createStory } from '../services/storyService';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, firebase } from '../firebase';
import { ref, onValue, off, remove, set } from 'firebase/database';
import { FiX, FiZap, FiBook, FiEdit3, FiArrowRight, FiPlus } from 'react-icons/fi';
import Modal from '../components/ui/Modal';
import RequireAuthModal from '../components/ui/RequireAuthModal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const genres = ['Any', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Adventure', 'Thriller', 'Historical', 'Contemporary'];
const tones = ['Any', 'Serious', 'Humorous', 'Dramatic', 'Inspiring', 'Dark', 'Lighthearted', 'Mysterious', 'Romantic', 'Epic'];

const aiPromptExamples = [
  'A detective wakes up with no memory in a city where no one can lie.',
  'A dragon who wants to be a poet, not a fighter.',
  'A romance between two rival AI assistants.',
  'A spaceship crew discovers a planet where time runs backward.',
  'A child finds a door to another world in their school library.'
];

// Shuffle utility
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const NewStory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Any');
  const [tone, setTone] = useState('Any');
  const [chapters, setChapters] = useState<string | number>(1);
  const [words, setWords] = useState<string | number>(1000);
  const [wordWarning, setWordWarning] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingLog, setLoadingLog] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pendingStory, setPendingStory] = useState('');
  const [shuffledExamples, setShuffledExamples] = useState<string[]>([]);
  
  // Monitoring state
  const [checkingInterval, setCheckingInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setShuffledExamples(shuffleArray(aiPromptExamples).slice(0, 5));
    
    // Check for existing running execution on page load
    if (user?.uid) {
      checkForRunningExecution();
    }
    
    return () => {
      // Clean up intervals and timeouts
      if (checkingInterval) clearInterval(checkingInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (typeof e.detail === 'string') setPrompt(e.detail);
    };
    window.addEventListener('use-prompt-template', handler as EventListener);
    return () => window.removeEventListener('use-prompt-template', handler as EventListener);
  }, []);

  const checkForRunningExecution = async () => {
    if (!user?.uid) return;
    
    const runningExecutionRef = ref(firebase.database(), `runningExecution/${user.uid}`);
    
    try {
      onValue(runningExecutionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLoadingLog('Found existing story generation. Retrieving...');
          
          // If content exists, show it
          if (data.content) {
            setLoadingLog('Story generation completed!');
            setPendingStory(data.content);
            setShowPreviewModal(true);
            
            // Clean up the realtime record
            remove(runningExecutionRef);
          } else {
            // Generation still in progress
            setLoadingLog('Story generation in progress...');
            setLoading(true);
            startMonitoring();
          }
        }
      }, { onlyOnce: true });
    } catch (error) {
      console.error('Error checking for running execution:', error);
    }
  };

  const startMonitoring = () => {
    if (!user?.uid) return;
    
    const runningExecutionRef = ref(firebase.database(), `runningExecution/${user.uid}`);
    
    // Set a 15-minute timeout
    const timeout = setTimeout(() => {
      if (checkingInterval) clearInterval(checkingInterval);
      setLoading(false);
      setLoadingLog('');
      setError('Story generation timed out after 15 minutes');
    }, 15 * 60 * 1000);
    setTimeoutId(timeout);
    
    // Check every 5 seconds
    const interval = setInterval(() => {
      onValue(runningExecutionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          if (data.content) {
            // We have content!
            clearInterval(interval);
            clearTimeout(timeout);
            setCheckingInterval(null);
            setTimeoutId(null);
            
            setLoadingLog('Story generation completed!');
            setPendingStory(data.content);
            setShowPreviewModal(true);
            setLoading(false);
            
            // Clean up the realtime record
            remove(runningExecutionRef);
          } else {
            // Update loading log if available
            if (data.status) {
              setLoadingLog(data.status);
            }
          }
        } else {
          // No data found (maybe deleted or failed)
          clearInterval(interval);
          clearTimeout(timeout);
          setCheckingInterval(null);
          setTimeoutId(null);
          setLoading(false);
          setLoadingLog('');
          setError('Story generation failed - no data received');
        }
      }, { onlyOnce: true });
    }, 5000);
    
    setCheckingInterval(interval);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !prompt.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setLoadingLog('Initiating story generation...');
    setError('');

    try {
      // Create the execution request in Firebase Realtime Database
      const runningExecutionRef = ref(firebase.database(), `runningExecution/${user.uid}`);
      
      const executionData = {
        title,
        genre,
        tone,
        prompt,
        userId: user.uid,
        userEmail: user.email,
        chapters: typeof chapters === 'number' ? chapters : parseInt(chapters as string) || 1,
        words: typeof words === 'number' ? words : parseInt(words as string) || 1000,
        timestamp: Date.now(),
        status: 'Initializing story generation...'
      };
      
      // Write to Realtime Database to trigger the cloud function
      await set(runningExecutionRef, executionData);
      
      setLoadingLog('Story generation request submitted. Waiting for AI...');
      
      // Start monitoring for completion
      startMonitoring();
      
    } catch (error) {
      console.error('Error starting story generation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start story generation');
      setLoading(false);
      setLoadingLog('');
    }
  };

  const handleSavePreviewStory = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setLoading(true);
    setLoadingLog('Saving story to your library...');
    
    try {
      const storyData = {
        title,
        content: pendingStory,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        genre,
        tone,
        prompt,
        chapters: typeof chapters === 'number' ? chapters : parseInt(chapters as string) || 1,
        words: typeof words === 'number' ? words : parseInt(words as string) || 1000,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const storyId = await createStory(storyData);
      setLoadingLog('Story saved successfully!');
      
      setTimeout(() => {
        setShowPreviewModal(false);
        setLoading(false);
        setLoadingLog('');
        navigate(`/story-view/${storyId}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error saving story:', error);
      setError(error instanceof Error ? error.message : 'Failed to save story');
      setLoading(false);
      setLoadingLog('');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Exit Icon */}
        <button
          className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 p-2 sm:p-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-white dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200"
          aria-label="Exit New Story"
          onClick={handleCancel}
        >
          <FiX size={20} className="text-slate-600 dark:text-slate-300 sm:w-6 sm:h-6" />
        </button>

        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8 relative z-10">
          {/* Mobile-Optimized Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                <FiZap size={24} className="text-white sm:w-8 sm:h-8" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              Create Your Story
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-4">
              Let AI help you bring your creative vision to life. Describe your story idea and watch the magic happen.
            </p>
          </div>

          {/* Mobile-Optimized Main Form Card */}
          <Card className="p-4 sm:p-6 lg:p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Title Section */}
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <FiBook className="inline mr-2" />
                  Story Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your story title..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Prompt Section */}
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <FiEdit3 className="inline mr-2" />
                  Story Prompt
                </label>
                
                {/* Mobile-Optimized Quick Prompts */}
                <div className="flex flex-wrap gap-2">
                  {shuffledExamples.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      className="px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800 dark:hover:to-purple-800 text-xs sm:text-sm font-medium shadow-sm transition-all duration-200 border border-blue-200 dark:border-blue-700"
                      onClick={() => setPrompt(ex)}
                    >
                      {ex.length > 30 ? ex.substring(0, 30) + '...' : ex}
                    </button>
                  ))}
                </div>

                <textarea
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base"
                  rows={3}
                  placeholder="Describe your story idea in detail... What happens? Who are the characters? What's the setting?"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  required
                />
              </div>

              {/* Mobile-Optimized Story Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Genre
                  </label>
                  <select
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                  >
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Tone
                  </label>
                  <select
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                  >
                    {tones.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Chapters
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    value={chapters === 0 ? '' : chapters}
                    onChange={e => {
                      const valStr = e.target.value;
                      if (valStr === '') {
                        setChapters('');
                      } else {
                        const val = Number(valStr);
                        setChapters(val);
                      }
                    }}
                    onBlur={e => {
                      const val = Number(e.target.value);
                      if (!val || val < 1) setChapters(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Words
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={300000}
                    step={1000}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    value={words === 0 ? '' : words}
                    onChange={e => {
                      let valStr = e.target.value.replace(/^0+(?!$)/, '');
                      if (valStr === '') {
                        setWords('');
                        setWordWarning('');
                        return;
                      }
                      const val = Number(valStr);
                      setWords(val);
                      if (val < 100) setWordWarning('This is very short! Consider at least 100 words for a meaningful story.');
                      else if (val > 200000) setWordWarning('This is very long! Consider keeping stories under 200,000 words for best results.');
                      else setWordWarning('');
                    }}
                  />
                  {wordWarning && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{wordWarning}</div>
                  )}
                </div>
              </div>

              {/* Mobile-Optimized Generate Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-2 w-full justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      Generating Story...
                    </div>
                    {loadingLog && (
                      <span className="text-xs text-white/90 mt-1 w-full text-center">{loadingLog}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FiZap className="w-4 h-4 sm:w-5 sm:h-5" />
                    Generate Story
                  </div>
                )}
              </Button>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-red-700 dark:text-red-300 font-medium text-center text-sm sm:text-base">
                  {error}
                </div>
              )}
            </form>
          </Card>

          {/* Mobile-Optimized Tips Section */}
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3 sm:mb-4 flex items-center gap-2">
              <FiZap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              Writing Tips
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium">🎯 Be Specific</p>
                <p>Include character names, settings, and key plot points for better results.</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium">🌟 Set the Mood</p>
                <p>Choose the right tone to match your story's emotional atmosphere.</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium">📚 Consider Length</p>
                <p>More chapters mean longer, more detailed stories.</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium">✨ Get Creative</p>
                <p>Don't be afraid to experiment with unusual combinations and ideas.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Auth Modal */}
      <RequireAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Your Generated Story">
        <div className="flex flex-col gap-4 h-full max-h-[80vh] w-full max-w-4xl mx-auto">
          {/* Story Content */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 overflow-y-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="whitespace-pre-line text-slate-700 dark:text-slate-200 leading-relaxed">
                {pendingStory}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowPreviewModal(false)}
              className="px-6 py-2"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePreviewStory}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {loadingLog || 'Saving...'}
                </div>
              ) : (
                'Save to Library'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NewStory;
