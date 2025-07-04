import React, { useState, useEffect } from 'react';
import { generateStory } from '../services/storyService';
import Modal from './ui/Modal';

const genres = ['Any', 'Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Adventure'];

const tones = ['Any', 'Serious', 'Humorous', 'Dramatic', 'Inspiring', 'Dark', 'Lighthearted'];

const lengths = [
  'Short',
  'Medium',
  'Long',
];

const promptExamples = [
  'A detective wakes up with no memory in a city where no one can lie.',
  'A dragon who wants to be a poet, not a fighter.',
  'A romance between two rival AI assistants.',
  'A spaceship crew discovers a planet where time runs backward.',
  'A child finds a door to another world in their school library.'
];

const StoryGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Any');
  const [tone, setTone] = useState('Any');
  const [length, setLength] = useState(lengths[0]);
  const [setting, setSetting] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [story, setStory] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [chapters, setChapters] = useState(1);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (typeof e.detail === 'string') setPrompt(e.detail);
    };
    window.addEventListener('use-prompt-template', handler as EventListener);
    return () => window.removeEventListener('use-prompt-template', handler as EventListener);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStory('');
    try {
      const fullPrompt = `Title: ${prompt}\nGenre: ${genre}\nTone: ${tone}\nChapters: ${chapters}`;
      const response = await generateStory({ prompt: fullPrompt, genre, tone });
      setStory(response.story || '');
      setShowResultModal(true);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Story generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch min-h-0 w-full mt-2 sm:mt-4 max-w-3xl mx-auto">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col gap-6 transition-colors duration-300 border border-blue-100 dark:border-blue-900 w-full max-w-xl mx-auto px-2 sm:px-4 py-4 sm:py-6 max-h-[90vh] h-full overflow-y-auto md:max-w-md"
        aria-label="Story Generator"
        style={{ minHeight: '350px' }}
      >
        <label className="font-medium text-blue-700 dark:text-orange-300">Prompt</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {promptExamples.map((ex, i) => (
            <button
              key={i}
              type="button"
              className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-orange-200 hover:bg-blue-200 dark:hover:bg-blue-800 text-xs font-medium shadow transition-all duration-200"
              onClick={() => setPrompt(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-300"
          placeholder="Describe your story idea or select a prompt example..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          required
        />
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
        {error && <div className="text-red-600 bg-red-50 dark:bg-red-900/40 rounded-lg px-4 py-2 font-medium text-center">{error}</div>}
      </form>
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

// Typing effect component
const TypingEffect: React.FC<{ text: string }> = ({ text }) => {
  const [displayed, setDisplayed] = useState('');
  React.useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [text]);
  return <p className="whitespace-pre-line text-gray-900 dark:text-gray-100 text-base leading-relaxed font-mono transition-all duration-300">{displayed}</p>;
};

export default StoryGenerator; 