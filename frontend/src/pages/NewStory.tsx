import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiX, FiZap, FiBook, FiEdit3, FiClock, FiAlertCircle } from 'react-icons/fi';
import Modal from '../components/ui/Modal';
import RequireAuthModal from '../components/ui/RequireAuthModal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import { getDatabase, ref, onValue, get } from 'firebase/database';

const genres = ['Any', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Adventure', 'Thriller', 'Historical', 'Contemporary'];
const tones = ['Any', 'Serious', 'Humorous', 'Dramatic', 'Inspiring', 'Dark', 'Lighthearted', 'Mysterious', 'Romantic', 'Epic'];
const examplePrompts = [
  'A detective wakes up with no memory in a city where no one can lie.',
  'A dragon who wants to be a poet, not a fighter.',
  'A romance between two rival AI assistants.',
  'A spaceship crew discovers a planet where time runs backward.',
  'A child finds a door to another world in their school library.'
];

const MAX_WAIT_TIME = 7 * 60 * 1000; // 7 minutes in milliseconds
const CHECK_INTERVAL = 5000; // Check every 5 seconds

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
  const userId = user?.uid;
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Any');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [story, setStory] = useState('');
  const [title, setTitle] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingLog, setLoadingLog] = useState('');
  const [shuffledExamples, setShuffledExamples] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pendingStory, setPendingStory] = useState('');
  const [genre, setGenre] = useState('Any');
  const [chapters, setChapters] = useState<string | number>(1);
  const [words, setWords] = useState<string | number>(1000);
  const [wordWarning, setWordWarning] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(MAX_WAIT_TIME);

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setShuffledExamples(shuffleArray(examplePrompts).slice(0, 5));
  }, []);

  useEffect(() => {
    if (!userId) {
      setShowAuthModal(true);
    }
  }, [userId]);

  const startCheckingForStory = () => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError('');
    setStory('');
    setTimeElapsed(0);
    setEstimatedTimeLeft(MAX_WAIT_TIME);
    setLoadingLog('Starting story generation...');

    const db = getDatabase();
    const execRef = ref(db, `/runningExecution/${userId}`);

    // Set timeout for maximum wait time
    timeoutRef.current = setTimeout(() => {
      stopChecking();
      setError('Story generation is taking longer than expected. Please check back later.');
      toast.error('Maximum generation time reached');
    }, MAX_WAIT_TIME);

    // Check immediately first
    checkForStory(execRef);

    // Then set up interval for periodic checking
    checkIntervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + CHECK_INTERVAL;
        setEstimatedTimeLeft(MAX_WAIT_TIME - newTime);
        return newTime;
      });
      checkForStory(execRef);
    }, CHECK_INTERVAL);
  };

  const checkForStory = async (execRef: any) => {
    try {
      const snapshot = await get(execRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.story) {
          stopChecking();
          setPendingStory(data.story);
          setShowPreviewModal(true);
          toast.success('Your story is ready!');
        } else {
          setLoadingLog(`Generating... (${Math.floor(timeElapsed / 1000)}s elapsed)`);
        }
      } else {
        setLoadingLog(`Waiting for story to start... (${Math.floor(timeElapsed / 1000)}s)`);
      }
    } catch (err) {
      console.error('Error checking story:', err);
      setLoadingLog('Error checking status. Trying again...');
    }
  };

  const stopChecking = () => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !prompt.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    startCheckingForStory();
  };

  const handleCancel = () => {
    stopChecking();
    navigate('/dashboard');
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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
              Story generation may take up to 7 minutes. We'll check continuously for your completed story.
            </p>
          </div>

          <Card className="p-4 sm:p-6 lg:p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                  disabled={loading}
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <FiEdit3 className="inline mr-2" />
                  Story Prompt
                </label>
                
                <div className="flex flex-wrap gap-2">
                  {shuffledExamples.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      className="px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800 dark:hover:to-purple-800 text-xs sm:text-sm font-medium shadow-sm transition-all duration-200 border border-blue-200 dark:border-blue-700"
                      onClick={() => setPrompt(ex)}
                      disabled={loading}
                    >
                      {ex.length > 30 ? ex.substring(0, 30) + '...' : ex}
                    </button>
                  ))}
                </div>

                <textarea
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base"
                  rows={3}
                  placeholder="Describe your story idea in detail..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Genre
                  </label>
                  <select
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                  {wordWarning && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{wordWarning}</div>
                  )}
                </div>
              </div>

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
                    <div className="flex items-center gap-2 text-xs text-white/90">
                      <FiClock className="w-3 h-3" />
                      {formatTime(timeElapsed)} elapsed (max {formatTime(MAX_WAIT_TIME)})
                    </div>
                    <span className="text-xs text-white/90 w-full text-center">{loadingLog}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FiZap className="w-4 h-4 sm:w-5 sm:h-5" />
                    Generate Story
                  </div>
                )}
              </Button>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-red-700 dark:text-red-300 font-medium text-center text-sm sm:text-base">
                  <FiAlertCircle className="flex-shrink-0" />
                  {error}
                </div>
              )}
            </form>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3 sm:mb-4 flex items-center gap-2">
              <FiZap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              What to Expect
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium">⏳ Generation Time</p>
                <p>Complex stories may take up to 7 minutes to generate.</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium">🔄 Automatic Checking</p>
                <p>We'll continuously check for your completed story.</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium">📝 Quality Matters</p>
                <p>Longer generation time often means higher quality output.</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium">🔔 Notifications</p>
                <p>You'll be notified immediately when your story is ready.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <RequireAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Your Generated Story">
        <div className="flex flex-col gap-4 h-full max-h-[80vh] w-full max-w-4xl mx-auto">
          <div className="prose prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800 p-4 rounded-lg overflow-y-auto">
            <div className="whitespace-pre-line text-slate-700 dark:text-slate-200 leading-relaxed">
              {pendingStory}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="primary" 
              onClick={() => {
                setShowPreviewModal(false);
                navigate('/dashboard');
              }} 
              className="px-6 py-2"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NewStory;
