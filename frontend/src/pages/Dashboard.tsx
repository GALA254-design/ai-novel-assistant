import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Dropdown, { DropdownItem } from '../components/ui/Dropdown';
import Avatar from '../components/ui/Avatar';
import { DataTable } from '../components/ui/DataTable';
import { useToast } from '../components/ui/Toast';
import Loader from '../components/ui/Loader';
import FileUpload from '../components/ui/FileUpload';
import StoryGenerator from '../components/StoryGenerator';
import Tabs from '../components/ui/Tabs';
import { FiPlus, FiBarChart2, FiZap, FiBookOpen, FiEye, FiEyeOff, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { createStory, getUserStories, Story, deleteStory, createProject, getUserProjects, Project, deleteProject } from '../services/storyService';
import UploadStoryCard from '../components/ui/UploadStoryCard';
import { useNavigate } from 'react-router-dom';

const tabLabels = [
  { label: 'All Stories', status: 'all' },
];

const recentActivity = [
  { type: 'upload', text: 'Uploaded "AI Dreams.txt"', time: '2 min ago' },
  { type: 'edit', text: 'Edited "The Lost City"', time: '10 min ago' },
  { type: 'upload', text: 'Uploaded "Midnight Library.md"', time: '1 hour ago' },
];

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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Story | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const { showToast } = useToast();
  const [preview, setPreview] = useState<Story | null>(null);
  // For upload flow
  const [pendingUpload, setPendingUpload] = useState<{ text: string; file: File } | null>(null);
  const [uploadMeta, setUploadMeta] = useState({ title: '', genre: '', tone: '' });
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setLoading(true);
      getUserStories(user.uid).then(stories => {
        setStories(stories);
        setLoading(false);
      });
    }
  }, [user]);

  // Memoize filtered stories for performance
  const getFilteredStories = useMemo(() => (status: string) =>
    stories.filter(story => {
      const q = search.toLowerCase();
      return (
        story.title.toLowerCase().includes(q) ||
        (story.genre?.toLowerCase() ?? '').includes(q) ||
        (story.tone?.toLowerCase() ?? '').includes(q)
      );
    }), [search, stories]);

  // Handle delete
  const handleDeleteStory = async () => {
    setShowDelete(false);
    if (!user || !selected?.id) return;
    setLoading(true);
    await deleteStory(selected.id);
    const updated = await getUserStories(user.uid);
    setStories(updated);
    setLoading(false);
    showToast('Story deleted', 'success');
  };

  // DataTable columns
  const columns = [
    { label: 'Title', key: 'title' },
    { label: 'Genre', key: 'genre' },
    { label: 'Tone', key: 'tone' },
    { label: 'Last Updated', key: 'updatedAt' },
    { label: 'Actions', key: 'actions' },
  ];

  // Handle upload from UploadStoryCard
  const handleUpload = async (text: string, file: File) => {
    setPendingUpload({ text, file });
    setUploadMeta({ title: file.name.replace(/\.(pdf|txt)$/i, ''), genre: '', tone: '' });
    setShowMetaModal(true);
  };

  // Save story after user enters meta
  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingUpload) return;
    setLoading(true);
    await createStory({
      title: uploadMeta.title,
      content: pendingUpload.text,
      genre: uploadMeta.genre,
      tone: uploadMeta.tone,
      authorId: user.uid,
      authorName: user.displayName || '',
    });
    const updated = await getUserStories(user.uid);
    setStories(updated);
    setLoading(false);
    setShowMetaModal(false);
    setPendingUpload(null);
    setUploadMeta({ title: '', genre: '', tone: '' });
    showToast('Story uploaded!', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
      <div className="w-full mx-auto p-4 md:p-8 md:max-w-6xl">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#232946]/80 backdrop-blur-md border-b border-blue-100 dark:border-blue-900 flex items-center justify-between px-4 py-2 shadow">
          <h2 className="text-2xl font-bold text-blue-700 dark:text-orange-300">Dashboard</h2>
          <Button variant="primary" icon={<span className="mr-1">+</span>} onClick={() => navigate('/new-story')}>New Story</Button>
        </div>
        <div className="flex flex-col md:flex-row gap-12 mt-4">
          {/* Left: Main content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Upload Story Card */}
            <UploadStoryCard onUpload={handleUpload} />
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="flex items-center gap-4 p-4">
                <FiBookOpen className="w-8 h-8 text-blue-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-gray-500">Stories</div>
                </div>
              </Card>
              <Card className="flex items-center gap-4 p-4">
                <FiBarChart2 className="w-8 h-8 text-blue-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </Card>
              <Card className="flex items-center gap-4 p-4">
                <FiZap className="w-8 h-8 text-blue-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-xs text-gray-500">AI Generated</div>
                </div>
              </Card>
            </div>
            {/* Stories table and actions */}
            <Card className="p-6 bg-white/90 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-900 shadow-xl animate-fadeIn">
              <Tabs
                tabs={tabLabels.map(tab => ({
                  label: tab.label,
                  content: (
                    <>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                        <input
                          type="text"
                          placeholder="Search stories..."
                          className="w-full sm:w-1/2 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-300"
                          aria-label="Search stories"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                        />
                      </div>
                      <Card className="p-0 overflow-hidden bg-white/95 dark:bg-blue-950/95 border-2 border-blue-200 dark:border-orange-700 shadow-2xl animate-fadeIn">
                        <div className="overflow-x-auto">
                          <DataTable columns={columns} data={getFilteredStories(tab.status).map((story) => ({
                            ...story,
                            updatedAt: <span className="text-blue-500 dark:text-blue-300 font-mono text-base">{story.updatedAt?.toDate ? story.updatedAt.toDate().toLocaleString() : ''}</span>,
                            actions: (
                              <div className="flex gap-2">
                                <button
                                  className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1"
                                  title="View"
                                  onClick={() => navigate(`/story/${story.id}`)}
                                >
                                  <FiEye /> View
                                </button>
                                <button
                                  className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1"
                                  title="Preview"
                                  onClick={() => setPreview(story)}
                                >
                                  <FiEyeOff /> Preview
                                </button>
                                <button
                                  className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-1"
                                  title="Delete"
                                  onClick={() => { setSelected(story); setShowDelete(true); }}
                                >
                                  <FiTrash2 /> Delete
                                </button>
                              </div>
                            ),
                          }))} />
                        </div>
                      </Card>
                    </>
                  )
                }))}
              />
            </Card>
          </div>
          {/* Right: Quick Actions & Recent Activity */}
          <div className="w-full md:w-1/4 flex-shrink-0 flex flex-col gap-6 sticky top-20 self-start min-w-0">
            <Card className="p-4">
              <h4 className="font-bold mb-2">Quick Actions</h4>
              <Button variant="primary" icon={<FiPlus />} className="w-full mb-2">New Story</Button>
              <Button variant="secondary" className="w-full mb-2">Export All</Button>
              <Button variant="secondary" className="w-full">Delete Selected</Button>
            </Card>
            <Card className="p-4">
              <h4 className="font-bold mb-2">Recent Activity</h4>
              <ul className="space-y-2 text-blue-900 dark:text-blue-100">
                {recentActivity.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full ${item.type === 'upload' ? 'bg-blue-400 dark:bg-orange-400' : 'bg-orange-400 dark:bg-blue-400'}`}></span>
                    <span>{item.text}</span>
                    <span className="ml-auto text-xs text-blue-400 dark:text-blue-300">{item.time}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
        {/* Modals */}
        <Modal
          isOpen={!!selected && showDelete}
          onClose={() => setShowDelete(false)}
          title="Delete Story?"
        >
          <p className="mb-4 text-blue-900 dark:text-blue-100">Are you sure you want to delete this story? This action cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={handleDeleteStory}>Delete</Button>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          </div>
        </Modal>
        <Modal
          isOpen={!!preview}
          onClose={() => setPreview(null)}
          title={preview?.title ? `Preview: ${preview.title}` : 'Preview'}
        >
          <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900 dark:to-blue-950 rounded-xl animate-fadeIn">
            <div className="mb-2 text-sm text-blue-500 dark:text-blue-300">By {preview?.authorName} &middot; Last updated: <span className="font-mono">{preview?.updatedAt?.toDate ? preview.updatedAt.toDate().toLocaleString() : ''}</span></div>
            <div className="prose prose-blue dark:prose-invert max-w-none text-base leading-relaxed text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-blue-950/80 rounded-lg p-4 shadow-inner animate-fadeIn">
              {preview?.content}
            </div>
          </div>
        </Modal>
        {/* Modal for entering story meta after upload */}
        <Modal
          isOpen={showMetaModal}
          onClose={() => { setShowMetaModal(false); setPendingUpload(null); }}
          title="Enter Story Details"
        >
          <form onSubmit={handleMetaSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-700 dark:text-orange-300 font-semibold mb-1">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100"
                value={uploadMeta.title}
                onChange={e => setUploadMeta({ ...uploadMeta, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-blue-700 dark:text-orange-300 font-semibold mb-1">Genre</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100"
                value={genreOptions.includes(uploadMeta.genre) ? uploadMeta.genre : 'Other'}
                onChange={e => {
                  const value = e.target.value;
                  setUploadMeta({ ...uploadMeta, genre: value === 'Other' ? '' : value });
                }}
                required
              >
                <option value="" disabled>Select genre</option>
                {genreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {(!genreOptions.includes(uploadMeta.genre) || uploadMeta.genre === '') && (
                <input
                  type="text"
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100"
                  placeholder="Enter custom genre"
                  value={uploadMeta.genre}
                  onChange={e => setUploadMeta({ ...uploadMeta, genre: e.target.value })}
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-blue-700 dark:text-orange-300 font-semibold mb-1">Tone</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100"
                value={toneOptions.includes(uploadMeta.tone) ? uploadMeta.tone : 'Other'}
                onChange={e => {
                  const value = e.target.value;
                  setUploadMeta({ ...uploadMeta, tone: value === 'Other' ? '' : value });
                }}
                required
              >
                <option value="" disabled>Select tone</option>
                {toneOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {(!toneOptions.includes(uploadMeta.tone) || uploadMeta.tone === '') && (
                <input
                  type="text"
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100"
                  placeholder="Enter custom tone"
                  value={uploadMeta.tone}
                  onChange={e => setUploadMeta({ ...uploadMeta, tone: e.target.value })}
                  required
                />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="primary" type="submit" disabled={loading}>Save Story</Button>
              <Button variant="secondary" type="button" onClick={() => { setShowMetaModal(false); setPendingUpload(null); }}>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard; 