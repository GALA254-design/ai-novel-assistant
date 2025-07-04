import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import { HiOutlineBold, HiOutlineItalic, HiOutlineUnderline, HiOutlineSparkles } from 'react-icons/hi2';
import { FiFileText, FiDownload, FiZap, FiPlus } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProject, updateChapter, getChapters, createStory } from '../services/storyService';
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
  const [form, setForm] = useState({ title: '', content: '', genre: '', tone: '' });
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'txt' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { projectId } = useParams();
  const [chapters, setChapters] = useState<any[]>([]);
  const [chapterId, setChapterId] = useState<string | null>(null);

  // Add ref for textarea
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Fetch chapters on load
  useEffect(() => {
    if (user && projectId) {
      getChapters(user.uid, projectId).then(chaps => {
        setChapters(chaps);
        if (chaps.length > 0) setChapterId(chaps[0].id);
      });
    }
  }, [user, projectId]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit (simulate save)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && form.title && form.content) {
      await createStory({
        title: form.title,
        content: form.content,
        genre: form.genre,
        tone: form.tone,
        authorId: user.uid,
        authorName: user.displayName || '',
      });
    setShowModal(true);
    }
  };

  // Handle export (simulate)
  const handleExport = (type: 'pdf' | 'txt') => {
    if (type === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(form.title || '', 10, 20);
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(form.content || '', 180);
      doc.text(splitText, 10, 30);
      doc.save(`${form.title || 'story'}.pdf`);
    } else if (type === 'txt') {
      const blob = new Blob([form.content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${form.title || 'story'}.txt`);
    }
  };

  // Simulate loading/generation
  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  // Formatting helpers
  const applyFormat = (tag: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const [start, end] = [textarea.selectionStart, textarea.selectionEnd];
    let before = form.content.slice(0, start);
    let selected = form.content.slice(start, end);
    let after = form.content.slice(end);
    let open = '', close = '';
    if (tag === 'bold') { open = '**'; close = '**'; }
    if (tag === 'italic') { open = '*'; close = '*'; }
    if (tag === 'underline') { open = '<u>'; close = '</u>'; }
    // If already wrapped, unwrap
    if (selected.startsWith(open) && selected.endsWith(close)) {
      selected = selected.slice(open.length, selected.length - close.length);
    } else {
      selected = open + selected + close;
    }
    const newContent = before + selected + after;
    setForm(f => ({ ...f, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + open.length, end + open.length);
    }, 0);
  };

  // Refine with n8n
  const handleRefine = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://n8nromeo123987.app.n8n.cloud/webhook-test/ultimate-agentic-novel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Refine this story for me', story: form.content }),
      });
      const blob = await response.blob();
      const refined = await blob.text();
      setForm(f => ({ ...f, content: refined }));
    } catch {}
    setLoading(false);
  };

  // Word and character count
  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  const charCount = form.content.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
      <div className="w-full mx-auto p-4 md:p-8 md:max-w-6xl">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#232946]/80 backdrop-blur-md border-b border-blue-100 dark:border-blue-900 flex items-center justify-between px-4 py-2 shadow">
          <h2 className="text-2xl font-bold text-blue-700 dark:text-orange-300">Story Editor</h2>
          <Button variant="primary" icon={<FiPlus />}>New Story</Button>
        </div>
        <div className="flex flex-col md:flex-row gap-12 mt-4">
          {/* Left: Editor with tabs */}
          <div className="md:w-3/4 flex-1 min-w-0">
            <Card className="p-0 overflow-hidden w-full">
                <form className="flex flex-col gap-6 p-4 sm:p-6" onSubmit={handleSubmit}>
                  <Input
                    label="Title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                  placeholder="Enter story title"
                  required
                />
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">Genre</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400"
                    value={genreOptions.includes(form.genre) ? form.genre : 'Other'}
                    onChange={e => {
                      const value = e.target.value;
                      setForm(f => ({ ...f, genre: value === 'Other' ? '' : value }));
                    }}
                    required
                  >
                    <option value="" disabled>Select genre</option>
                    {genreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {(!genreOptions.includes(form.genre) || form.genre === '') && (
                    <input
                      type="text"
                      className="w-full mt-2 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100"
                      placeholder="Enter custom genre"
                      value={form.genre}
                      onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">Tone</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400"
                    value={toneOptions.includes(form.tone) ? form.tone : 'Other'}
                    onChange={e => {
                      const value = e.target.value;
                      setForm(f => ({ ...f, tone: value === 'Other' ? '' : value }));
                    }}
                    required
                  >
                    <option value="" disabled>Select tone</option>
                    {toneOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {(!toneOptions.includes(form.tone) || form.tone === '') && (
                    <input
                      type="text"
                      className="w-full mt-2 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100"
                      placeholder="Enter custom tone"
                      value={form.tone}
                      onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}
                    required
                  />
                  )}
                </div>
                  {/* Toolbar */}
                  <div className="flex gap-2 mb-2 items-center">
                    <button type="button" className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 shadow transition-all duration-200" aria-label="Bold" title="Bold (Ctrl+B)" onClick={() => applyFormat('bold')}><HiOutlineBold className="w-5 h-5" /></button>
                    <button type="button" className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 shadow transition-all duration-200" aria-label="Italic" title="Italic (Ctrl+I)" onClick={() => applyFormat('italic')}><HiOutlineItalic className="w-5 h-5" /></button>
                    <button type="button" className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 shadow transition-all duration-200" aria-label="Underline" title="Underline (Ctrl+U)" onClick={() => applyFormat('underline')}><HiOutlineUnderline className="w-5 h-5" /></button>
                    <span className="mx-2 h-6 border-l border-blue-200 dark:border-blue-800" />
                    <button type="button" className="p-2 rounded-xl bg-gradient-to-r from-pink-400 to-orange-400 text-white hover:from-pink-500 hover:to-orange-500 shadow transition-all duration-200" aria-label="Refine with AI" title="Refine with AI" onClick={handleRefine}><HiOutlineSparkles className="w-5 h-5" /></button>
                  </div>
                  {/* Editor area */}
                  <div className="relative">
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200 pl-1">Content</label>
                    <textarea
                      ref={textareaRef}
                      name="content"
                      value={form.content}
                      onChange={handleChange}
                      placeholder="Write your story here..."
                      className="w-full min-h-[180px] px-4 py-3 rounded-xl shadow border border-blue-100 dark:border-blue-800 bg-white/80 dark:bg-blue-950/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-300"
                      required
                    />
                    {/* Shimmer/placeholder animation for loading/generation */}
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-100/80 via-blue-200/80 to-blue-100/80 dark:from-blue-900/80 dark:via-blue-800/80 dark:to-blue-900/80 rounded-xl animate-pulse z-10">
                        <span className="text-blue-600 dark:text-blue-200 font-semibold text-lg">Generating...</span>
                      </div>
                    )}
                  </div>
                  {/* Word/Char Count */}
                  <div className="flex justify-end gap-4 text-sm text-blue-500 dark:text-orange-300 font-mono">
                    <span><FiFileText className="inline-block mr-1" />{wordCount} words</span>
                    <span><FiFileText className="inline-block mr-1" />{charCount} chars</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <Button variant="secondary" onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'}>
                      {exporting === 'pdf' ? <Loader size={16} className="inline-block mr-2" /> : <FiDownload className="inline-block mr-2" />}
                      Export as PDF
                    </Button>
                    <Button variant="secondary" onClick={() => handleExport('txt')} disabled={exporting === 'txt'}>
                      {exporting === 'txt' ? <Loader size={16} className="inline-block mr-2" /> : <FiDownload className="inline-block mr-2" />}
                      Export as TXT
                    </Button>
                  </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary">
                    Save Story
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setForm({ title: '', content: '', genre: '', tone: '' })}>
                    Clear
                  </Button>
                </div>
                </form>
            </Card>
          </div>
          {/* Right: Panels */}
          <div className="md:w-1/4 w-full flex-shrink-0 flex flex-col gap-6 sticky top-20 self-start min-w-0">
            <Card className="p-4">
              <h4 className="font-bold mb-2">Prompt Templates</h4>
              <ul className="space-y-2">
                {promptTemplates.map((prompt, i) => (
                  <li key={i}>
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg bg-blue-100/70 dark:bg-blue-900/70 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-100 font-medium transition-all duration-200"
                      onClick={() => setForm(f => ({ ...f, content: f.content + (f.content ? '\n' : '') + prompt }))}
                      type="button"
                    >
                      {prompt}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-4">
              <h4 className="font-bold mb-2">Recent Stories</h4>
              <ul className="space-y-2 text-blue-900 dark:text-blue-100">
                <li>AI Dreams</li>
                <li>The Lost City</li>
                <li>Midnight Library</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Story Saved!">
        <p className="mb-4 text-blue-900 dark:text-blue-100">Your story has been saved (simulated).</p>
        <Button variant="primary" onClick={() => setShowModal(false)}>
          Close
        </Button>
      </Modal>
    </div>
  );
};

export default StoryEditor; 