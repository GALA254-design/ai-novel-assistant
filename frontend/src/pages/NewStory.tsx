import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProject, addChapter } from '../services/storyService';
import { FiX } from 'react-icons/fi';
import Modal from '../components/ui/Modal';

const genres = ['Any', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Adventure'];
const tones = ['Any', 'Serious', 'Humorous', 'Dramatic', 'Inspiring', 'Dark', 'Lighthearted'];
const lengths = ['Short', 'Medium', 'Long'];
const examplePrompts = [
  'A detective wakes up with no memory of the last 24 hours.',
  'Describe a world where dreams are real and reality is a dream.',
  'A robot learns to write poetry.',
  'A forbidden romance between rivals in a magical academy.',
  'The last human on Earth receives a mysterious message.'
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
    setLoading(true);
    setError('');
    setStory('');
    try {
      // Combine all fields into a single prompt
      const fullPrompt = `Title: ${titleInput || meta.title}\nGenre: ${genre || genreInput || meta.genre}\nTone: ${tone}\nChapters: ${chapters}\nDescription: ${descriptionInput || meta.description}\nPrompt: ${prompt}`;
      const response = await import('../services/storyService').then(m => m.generateStory({ prompt: fullPrompt, genre, tone, chapters }));
      setStory(response.story || '');
      setShowResultModal(true);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Story generation failed');
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
      navigate(`/story/${projectId}`);
    } catch (err) {
      setError('Could not save story. Please try again.');
    }
    setSaving(false);
  };

  // Cancel handler
  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826] flex flex-col items-center justify-center p-4 animate-fadeIn relative">
      {/* Exit Icon */}
      <button
        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 shadow hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-200"
        aria-label="Exit New Story"
        onClick={handleCancel}
      >
        <FiX size={28} className="text-blue-700 dark:text-orange-300" />
      </button>
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 relative">
        {/* Inline Metadata Form */}
        {!metaComplete && (
          <form
            onSubmit={e => { e.preventDefault(); setMetaComplete(true); }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col gap-4 border border-blue-100 dark:border-blue-900 w-full px-4 py-6 animate-fadeIn"
          >
            <h2 className="text-2xl font-bold text-blue-700 dark:text-orange-300 mb-2">Story Info</h2>
            <input
              type="text"
              className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow"
              placeholder="Title (required)"
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              required
            />
            <input
              type="text"
              className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow"
              placeholder="Genre (optional)"
              value={genreInput}
              onChange={e => setGenreInput(e.target.value)}
            />
            <textarea
              className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow min-h-[60px]"
              placeholder="Description (optional)"
              value={descriptionInput}
              onChange={e => setDescriptionInput(e.target.value)}
            />
            <input
              type="text"
              className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow"
              placeholder="Cover Image URL (optional)"
              value={coverImageInput}
              onChange={e => setCoverImageInput(e.target.value)}
            />
            <select
              className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow"
              value={statusInput}
              onChange={e => setStatusInput(e.target.value as 'Draft' | 'Editing' | 'Completed')}
            >
              <option value="Draft">Draft</option>
              <option value="Editing">Editing</option>
              <option value="Completed">Completed</option>
            </select>
            <button
              type="submit"
              className="mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white shadow-xl text-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Continue to Generator
            </button>
          </form>
        )}
        {/* Story Generator Form */}
        {metaComplete && (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col gap-6 border border-blue-100 dark:border-blue-900 w-full px-4 py-6 animate-fadeIn"
            aria-label="Story Generator"
            style={{ minHeight: '350px' }}
          >
            <h2 className="text-2xl font-bold text-blue-700 dark:text-orange-300 mb-2">AI Story Generator</h2>
            <label className="font-medium text-blue-700 dark:text-orange-300">Prompt</label>
            <input
              type="text"
              className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-300"
              placeholder="Describe your story idea or select a prompt example..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-2 mb-2">
              {examplePrompts.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-orange-200 hover:bg-blue-200 dark:hover:bg-blue-800 text-sm"
                  onClick={() => setPrompt(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block font-medium text-blue-700 dark:text-orange-300 mb-1">Genre</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400"
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                >
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block font-medium text-blue-700 dark:text-orange-300 mb-1">Tone</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400"
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                >
                  {tones.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block font-medium text-blue-700 dark:text-orange-300 mb-1">Chapters</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400"
                  value={chapters}
                  onChange={e => setChapters(Number(e.target.value))}
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white shadow-xl text-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
            {error && <div className="text-red-600 bg-red-50 dark:bg-red-900/40 rounded-lg px-4 py-2 font-medium text-center animate-fadeIn">{error}</div>}
          </form>
        )}
      </div>
      {/* Result Modal */}
      <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="Generated Story">
        <div className="flex flex-col gap-2 h-full max-h-[80vh] w-full max-w-2xl mx-auto">
          <div className="bg-white/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 mb-2 text-sm text-blue-700 dark:text-orange-200 font-medium shadow">
            <div><span className="font-semibold">Prompt:</span> {prompt}</div>
            <div><span className="font-semibold">Genre:</span> {genre}</div>
            <div><span className="font-semibold">Tone:</span> {tone}</div>
            <div><span className="font-semibold">Chapters:</span> {chapters}</div>
          </div>
          <div className="whitespace-pre-line bg-blue-50 dark:bg-blue-950/60 rounded-lg px-4 py-4 text-lg text-blue-900 dark:text-blue-100 shadow-inner max-h-[60vh] overflow-y-auto border border-blue-200 dark:border-blue-800 flex-1">
            {story}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NewStory;
 