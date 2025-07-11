import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProject, addChapter, createStory } from '../services/storyService';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FiX, FiZap, FiBook, FiEdit3, FiArrowRight, FiPlus } from 'react-icons/fi';
import Modal from '../components/ui/Modal';
import RequireAuthModal from '../components/ui/RequireAuthModal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const genres = ['Any', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Adventure', 'Thriller', 'Historical', 'Contemporary'];
const tones = ['Any', 'Serious', 'Humorous', 'Dramatic', 'Inspiring', 'Dark', 'Lighthearted', 'Mysterious', 'Romantic', 'Epic'];
const lengths = ['Short', 'Medium', 'Long'];
const examplePrompts = [
  'A detective wakes up with no memory of the last 24 hours.',
  'Describe a world where dreams are real and reality is a dream.',
  'A robot learns to write poetry.',
  'A forbidden romance between rivals in a magical academy.',
  'The last human on Earth receives a mysterious message.'
];

const aiPromptExamples = [
  'A detective wakes up with no memory in a city where no one can lie.',
  'A dragon who wants to be a poet, not a fighter.',
  'A romance between two rival AI assistants.',
  'A spaceship crew discovers a planet where time runs backward.',
  'A child finds a door to another world in their school library.'
];

const NewStory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Metadata and project state
  const [meta, setMeta] = useState<{ title: string; genre: string; description: string; coverImage: string; status: 'Draft' | 'Editing' | 'Completed'; }>({ title: '', genre: '', description: '', coverImage: '', status: 'Draft' });
  const [projectId, setProjectId] = useState<string | null>(null);
  // Generator state
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Any');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [story, setStory] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [saving, setSaving] = useState(false);
  // Add dedicated state for each input
  const [titleInput, setTitleInput] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [coverImageInput, setCoverImageInput] = useState('');
  const [statusInput, setStatusInput] = useState<'Draft' | 'Editing' | 'Completed'>('Draft');
  const [metaComplete, setMetaComplete] = useState(false);
  const [genre, setGenre] = useState('Any');
  const [chapters, setChapters] = useState(1);
  // Remove metaComplete and Story Info form, move title input to generator form
  const [title, setTitle] = useState('');
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (typeof e.detail === 'string') setPrompt(e.detail);
    };
    window.addEventListener('use-prompt-template', handler as EventListener);
    return () => window.removeEventListener('use-prompt-template', handler as EventListener);
  }, []);

  // When modal opens, initialize input states from meta (only once)
  useEffect(() => {
    setTitleInput(meta.title);
    setGenreInput(meta.genre);
    setDescriptionInput(meta.description);
    setCoverImageInput(meta.coverImage);
    setStatusInput(meta.status);
  }, []);

  // Handle metadata form submit: create project immediately
  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput || !genreInput || !descriptionInput) {
      setError('Please fill in all required fields');
      return;
    }
    if (!user) return;
    setLoading(true);
    setError('');
    const updatedMeta = {
      title: titleInput,
      genre: genreInput,
      description: descriptionInput,
      coverImage: coverImageInput,
      status: statusInput,
    };
    try {
      const newProjectId = await createProject(user.uid, updatedMeta);
      setMeta(updatedMeta);
      setProjectId(newProjectId);
      setPrompt(descriptionInput);
    } catch (err) {
      setError('Could not create project. Please try again.');
    }
    setLoading(false);
  };

  // Handle story generation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    setStory('');
    try {
      console.log('Starting story generation...');
      // Fetch the .txt file from n8n as a blob
      const response = await fetch("https://n8nromeo123987.app.n8n.cloud/webhook/ultimate-agentic-novel", {
      method: "POST",
      headers: {
      "Content-Type": "application/json",
      },
      body: JSON.stringify({
      title,                 
      genre,                 
      tone,                  
      prompt,               
      chapters                
    }),
  });
      if (!response.ok) {
        console.error('Failed to generate story from n8n.');
        throw new Error("Failed to generate story from n8n.");
      }
      const blob = await response.blob();

      // Read the content from the blob
      const storyText = await blob.text();     // ✅ Read as text
      setStory(storyText);                     // ✅ Update UI

      // Trigger file download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.trim().replace(/\s+/g, "_") || "story"}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);


      // setStory(storyText);
      // Save the story as a new project/chapter in Firestore
      if (!user) {
        console.warn('User not authenticated, showing auth modal.');
        setShowAuthModal(true);
        return;
      }
      // Create a new project
      const newProjectId = await createProject(user.uid, {
        title,
        genre,
        description: prompt,
        coverImage: '',
        status: 'Draft',
      });
      // Add the story as the first chapter
      await addChapter(user.uid, newProjectId, {
        title,
        content: storyText,
        chapterNumber: 1,
      });
      // Create the story document in Firestore for StoryView with the same ID as the project
      try {
        await setDoc(doc(db, 'stories', newProjectId), {
          title,
          content: storyText,
          authorId: user.uid,
          authorName: user.displayName || '',
          genre,
          tone,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        console.log('Successfully created story document in Firestore with ID:', newProjectId);
      } catch (firestoreError) {
        console.error('Error creating story document in Firestore:', firestoreError);
        setError('Failed to create story document in Firestore.');
        setLoading(false);
        return;
      }
      // Add a small delay to ensure Firestore propagation
      await new Promise(res => setTimeout(res, 500));
      console.log('Navigating to /story-view/' + newProjectId);
      // Redirect to Story View (Story Editor)
      navigate(`/story-view/${newProjectId}`);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || 'Story generation failed');
      console.error('Error during story generation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save as chapter to the project
  const handleSaveAsProject = async () => {
    if (!user || !projectId) return;
    setSaving(true);
    try {
      await addChapter(user.uid, projectId, {
        title: meta.title,
        content: story,
        chapterNumber: 1,
      });
      setShowResultModal(false);
      navigate(`/story-editor/${projectId}`);
    } catch (err) {
      setError('Could not save story. Please try again.');
    }
    setSaving(false);
  };

  // Cancel handler
  const handleCancel = () => {
      navigate('/dashboard');
  };

  // Example usage in a handler:
  const handleCreateStory = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // ... rest of the create story logic ...
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
                  {aiPromptExamples.map((ex, i) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Chapters
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    value={chapters}
                    onChange={e => setChapters(Number(e.target.value))}
                  />
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
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    Generating Story...
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

        {/* Result Modal */}
        <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="Your Generated Story">
          <div className="flex flex-col gap-4 h-full max-h-[80vh] w-full max-w-4xl mx-auto">
            {/* Story Metadata */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Title:</span>
                  <p className="text-slate-600 dark:text-slate-300">{title}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Genre:</span>
                  <p className="text-slate-600 dark:text-slate-300">{genre}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Tone:</span>
                  <p className="text-slate-600 dark:text-slate-300">{tone}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Chapters:</span>
                  <p className="text-slate-600 dark:text-slate-300">{chapters}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Prompt:</span>
                  <p className="text-slate-600 dark:text-slate-300 truncate">{prompt}</p>
                </div>
              </div>
            </Card>

            {/* Story Content */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 overflow-y-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="whitespace-pre-line text-slate-700 dark:text-slate-200 leading-relaxed">
                  {story}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowResultModal(false)}
                className="px-6 py-2"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAsProject}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving ? 'Saving...' : (
                  <div className="flex items-center gap-2">
                    <FiPlus className="w-4 h-4" />
                    Save & Edit
                  </div>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
      <RequireAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default NewStory;
 