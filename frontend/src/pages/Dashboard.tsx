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
import Input from '../components/ui/Input';
import { FiPlus, FiBarChart2, FiZap, FiBookOpen, FiEye, FiEyeOff, FiTrash2, FiSearch, FiDownload, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { createStory, getUserStories, Story, deleteStory, createProject, getUserProjects, Project, deleteProject } from '../services/storyService';
import UploadStoryCard from '../components/ui/UploadStoryCard';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

const tabLabels = [
  { label: 'All Stories', status: 'all' },
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
  const { user, loading: authLoading } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Story | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const { showToast } = useToast();
  const [preview, setPreview] = useState<Story | null>(null);
  // For upload flow
  const [pendingUpload, setPendingUpload] = useState<{ text: string; file: File } | null>(null);
  const [uploadMeta, setUploadMeta] = useState({ title: '', genre: '', tone: '', content: '' });
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchDeleteIndexes, setBatchDeleteIndexes] = useState<number[]>([]);
  const [uploadCardKey, setUploadCardKey] = useState(0);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'docx' | 'pdf' | 'txt'>('txt');
  const [exportMode, setExportMode] = useState<'zip' | 'file'>('zip');
  const [recentActivity, setRecentActivity] = useState<{ type: 'upload' | 'edit' | 'delete'; text: string; time: string }[]>([]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FiBookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
    addActivity('delete', `Deleted "${selected.title}"`);
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
    setUploadMeta({ title: file.name.replace(/\.(pdf|txt|docx)$/i, ''), genre: '', tone: '', content: text });
    setShowMetaModal(true);
  };

  // Save story after user enters meta
  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingUpload) return;
    setLoading(true);
    await createStory({
      title: uploadMeta.title,
      content: uploadMeta.content,
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
    setUploadMeta({ title: '', genre: '', tone: '', content: '' });
    setUploadCardKey(k => k + 1);
    addActivity('upload', `Uploaded "${uploadMeta.title}"`);
    showToast('Story uploaded!', 'success');
  };

  // Add this function inside Dashboard component
  const handleBatchDelete = async (selectedIndexes: number[]) => {
    setBatchDeleteIndexes(selectedIndexes);
    setShowBatchDeleteConfirm(true);
  };

  const confirmBatchDelete = async () => {
    if (!user) return;
    setLoading(true);
    const toDelete = getFilteredStories('all').filter((_, i) => batchDeleteIndexes.includes(i));
    for (const story of toDelete) {
      await deleteStory(story.id);
      addActivity('delete', `Deleted "${story.title}"`);
    }
    const updated = await getUserStories(user.uid);
    setStories(updated);
    setLoading(false);
    setShowBatchDeleteConfirm(false);
    setBatchDeleteIndexes([]);
    showToast('Selected stories deleted', 'success');
  };

  // Calculate stats from stories
  const totalStories = stories.length;
  const completedStories = stories.filter(s => (s as any).status?.toLowerCase() === 'completed').length;
  const aiGeneratedStories = stories.filter(s => s.authorName?.toLowerCase().includes('ai')).length;

  const handleExportAll = () => {
    setExportModalOpen(true);
  };

  const doExportAll = async () => {
    if (stories.length === 0) return;
    if (exportMode === 'zip') {
      const zip = new JSZip();
      for (const story of stories) {
        let blob;
        let filename = `${story.title || 'story'}`;
        if (exportFormat === 'txt') {
          blob = new Blob([story.content], { type: 'text/plain;charset=utf-8' });
          filename += '.txt';
        } else if (exportFormat === 'docx') {
          const doc = new Document({
            sections: [
              {
                properties: {},
                children: [
                  new Paragraph({
                    children: [new TextRun(story.title || '')],
                    heading: 'Heading1',
                  }),
                  new Paragraph(story.content || ''),
                ],
              },
            ],
          });
          blob = await Packer.toBlob(doc);
          filename += '.docx';
        } else if (exportFormat === 'pdf') {
          const doc = new jsPDF();
          doc.setFontSize(16);
          doc.text(story.title || '', 10, 20);
          doc.setFontSize(12);
          const splitText = doc.splitTextToSize(story.content || '', 180);
          doc.text(splitText, 10, 30);
          blob = doc.output('blob');
          filename += '.pdf';
        }
        zip.file(filename, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `stories_export.${exportFormat}.zip`);
    } else {
      for (const story of stories) {
        let blob;
        let filename = `${story.title || 'story'}`;
        if (exportFormat === 'txt') {
          blob = new Blob([story.content], { type: 'text/plain;charset=utf-8' });
          filename += '.txt';
        } else if (exportFormat === 'docx') {
          const doc = new Document({
            sections: [
              {
                properties: {},
                children: [
                  new Paragraph({
                    children: [new TextRun(story.title || '')],
                    heading: 'Heading1',
                  }),
                  new Paragraph(story.content || ''),
                ],
              },
            ],
          });
          blob = await Packer.toBlob(doc);
          filename += '.docx';
        } else if (exportFormat === 'pdf') {
          const doc = new jsPDF();
          doc.setFontSize(16);
          doc.text(story.title || '', 10, 20);
          doc.setFontSize(12);
          const splitText = doc.splitTextToSize(story.content || '', 180);
          doc.text(splitText, 10, 30);
          blob = doc.output('blob');
          filename += '.pdf';
        }
        saveAs(blob, filename);
      }
    }
    setExportModalOpen(false);
  };

  const handleDeleteSelected = async () => {
    if (!user) return;
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selectedIndexes = stories.map((_, i) => i).filter(i => (checkboxes[i + 1] as HTMLInputElement)?.checked);
    const toDelete = getFilteredStories('all').filter((_, i) => selectedIndexes.includes(i));
    for (const story of toDelete) {
      await deleteStory(story.id);
    }
    const updated = await getUserStories(user.uid);
    setStories(updated);
    showToast('Selected stories deleted', 'success');
  };

  const addActivity = (type: 'upload' | 'edit' | 'delete', text: string) => {
    setRecentActivity(prev => [
      { type, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...prev.slice(0, 19)
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full max-w-full overflow-x-auto">
      <div className="w-full max-w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Premium Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-8 py-4 shadow-xl rounded-2xl mb-6 sm:mb-10 w-full max-w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 via-indigo-500 to-indigo-700 rounded-3xl shadow-2xl flex items-center justify-center">
              <FiBookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Dashboard</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium">Manage your creative stories</p>
            </div>
          </div>
          <Button 
            variant="primary" 
            size="lg"
            icon={<FiPlus />} 
            onClick={() => navigate('/new-story')}
            className="shadow-lg hover:shadow-2xl transition-all duration-200 w-full sm:w-auto text-lg font-bold px-8 py-3"
          >
            New Story
          </Button>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 w-full max-w-full">
          {/* Left: Main content */}
          <div className="flex-1 min-w-0 space-y-6 sm:space-y-8 w-full max-w-full">
            {/* Upload Story Card */}
            <UploadStoryCard key={uploadCardKey} onUpload={handleUpload} />
            
            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-8 mb-6 sm:mb-8">
              <Card className="group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-50/80 to-indigo-100/80 dark:from-blue-900/40 dark:to-indigo-900/40 border-0 max-w-xs w-full mx-auto" variant="elevated" hover>
                <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FiBookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-base sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{totalStories}</div>
                    <div className="text-xs sm:text-base text-slate-600 dark:text-slate-400 font-medium">Total Stories</div>
                  </div>
                </div>
              </Card>
              <Card className="group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-50/80 to-emerald-100/80 dark:from-green-900/40 dark:to-emerald-900/40 border-0 max-w-xs w-full mx-auto" variant="elevated" hover>
                <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FiBarChart2 className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-base sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{completedStories}</div>
                    <div className="text-xs sm:text-base text-slate-600 dark:text-slate-400 font-medium">Completed</div>
                  </div>
                </div>
              </Card>
              <Card className="group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-50/80 to-pink-100/80 dark:from-purple-900/40 dark:to-pink-900/40 border-0 max-w-xs w-full mx-auto" variant="elevated" hover>
                <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FiZap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-base sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{aiGeneratedStories}</div>
                    <div className="text-xs sm:text-base text-slate-600 dark:text-slate-400 font-medium">AI Generated</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Stories Table */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 sm:mb-6">
                <div className="relative w-full sm:w-80 lg:w-96">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search stories by title, genre, or tone..."
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                    aria-label="Search stories"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <DataTable
                columns={columns}
                data={getFilteredStories('all').map((story) => ({
                  ...story,
                  updatedAt: <span className="text-blue-600 dark:text-blue-400 font-mono text-xs sm:text-sm">{story.updatedAt?.toDate ? story.updatedAt.toDate().toLocaleString() : ''}</span>,
                  actions: null,
                  onView: () => navigate(`/story/${story.id}`),
                  onPreview: () => setPreview(story),
                  onDelete: () => { setSelected(story); setShowDelete(true); },
                }))}
                onBatchDelete={handleBatchDelete}
              />
            </div>
          </div>

          {/* Right: Quick Actions & Recent Activity */}
          <div className="w-full xl:w-72 2xl:w-80 flex-shrink-0 flex flex-col gap-4 sm:gap-6 xl:sticky xl:top-24 xl:self-start min-w-0 max-w-full">
            <Card className="p-5 sm:p-7 bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 border-0 rounded-2xl shadow-xl" variant="elevated">
              <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 flex items-center gap-2 tracking-tight">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-600 shadow mr-2">
                  <FiZap className="w-5 h-5 text-white" />
                </span>
                Quick Actions
              </h4>
              <div className="space-y-2 sm:space-y-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  icon={<FiDownload />}
                  onClick={handleExportAll}
                  className="w-full justify-start shadow-sm hover:shadow-md transition-all duration-200 text-sm font-bold py-3 rounded-xl"
                >
                  Export All Stories
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  icon={<FiTrash2 />}
                  onClick={handleDeleteSelected}
                  className="w-full justify-start shadow-sm hover:shadow-md transition-all duration-200 text-sm font-bold py-3 rounded-xl"
                >
                  Delete Selected
                </Button>
              </div>
            </Card>
            
            <Card className="p-5 sm:p-7 bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 border-0 rounded-2xl shadow-xl" variant="elevated">
              <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 flex items-center gap-2 tracking-tight">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-600 shadow mr-2">
                  <FiClock className="w-5 h-5 text-white" />
                </span>
                Recent Activity
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm text-center py-4">
                    No recent activity.
                  </div>
                ) : (
                  recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                        item.type === 'upload' ? 'bg-blue-500' : 
                        item.type === 'edit' ? 'bg-green-500' : 
                        'bg-red-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium truncate">
                          {item.text}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Premium Modals */}
        <Modal
          isOpen={!!selected && showDelete}
          onClose={() => setShowDelete(false)}
          title="Delete Story?"
          size="sm"
        >
          <div className="space-y-6 p-2">
            <p className="text-slate-700 dark:text-slate-300 text-base font-semibold">
              Are you sure you want to delete "{selected?.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="secondary" className="rounded-xl px-6 py-2 font-bold" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="rounded-xl px-6 py-2 font-bold" onClick={handleDeleteStory}>
                Delete Story
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showBatchDeleteConfirm}
          onClose={() => setShowBatchDeleteConfirm(false)}
          title="Delete Selected Stories?"
          size="sm"
        >
          <div className="space-y-6 p-2">
            <p className="text-slate-700 dark:text-slate-300 text-base font-semibold">
              Are you sure you want to delete {batchDeleteIndexes.length} selected stories? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="secondary" className="rounded-xl px-6 py-2 font-bold" onClick={() => setShowBatchDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="rounded-xl px-6 py-2 font-bold" onClick={confirmBatchDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={!!preview}
          onClose={() => setPreview(null)}
          title={preview?.title ? `Preview: ${preview.title}` : 'Preview'}
          size="lg"
        >
          <div className="space-y-6 p-2">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>By {preview?.authorName}</span>
              <span>•</span>
              <span>Last updated: {preview?.updatedAt?.toDate ? preview.updatedAt.toDate().toLocaleString() : ''}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-900 dark:via-slate-900 dark:to-indigo-950 rounded-2xl p-6 max-h-96 overflow-y-auto border border-blue-100 dark:border-blue-800 shadow-inner">
              <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed">
                {preview?.content}
              </div>
            </div>
          </div>
        </Modal>

        {/* Story Meta Modal */}
        <Modal
          isOpen={showMetaModal}
          onClose={() => { setShowMetaModal(false); setPendingUpload(null); }}
          title="Enter Story Details"
          size="lg"
        >
          <form onSubmit={handleMetaSubmit} className="space-y-8 p-2">
            <Input
              label="Story Title"
              name="title"
              value={uploadMeta.title}
              onChange={e => setUploadMeta({ ...uploadMeta, title: e.target.value })}
              placeholder="Enter a compelling title"
              required
              className="rounded-xl py-3 px-4 text-lg font-semibold"
            />
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Genre</label>
              <select
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
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
                <Input
                  label="Custom Genre"
                  value={uploadMeta.genre}
                  onChange={e => setUploadMeta({ ...uploadMeta, genre: e.target.value })}
                  placeholder="Enter custom genre"
                  required
                  className="rounded-xl py-3 px-4 text-lg font-semibold mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Tone</label>
              <select
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
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
                <Input
                  label="Custom Tone"
                  value={uploadMeta.tone}
                  onChange={e => setUploadMeta({ ...uploadMeta, tone: e.target.value })}
                  placeholder="Enter custom tone"
                  required
                  className="rounded-xl py-3 px-4 text-lg font-semibold mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Story Content</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-lg font-semibold"
                value={uploadMeta.content}
                onChange={e => setUploadMeta({ ...uploadMeta, content: e.target.value })}
                placeholder="Your story content..."
                required
              />
            </div>
            <div className="flex gap-4 justify-end pt-4">
              <Button variant="secondary" className="rounded-xl px-6 py-2 font-bold" onClick={() => { setShowMetaModal(false); setPendingUpload(null); }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading} className="rounded-xl px-6 py-2 font-bold">
                {loading ? 'Saving...' : 'Save Story'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Export Modal */}
        <Modal 
          isOpen={exportModalOpen} 
          onClose={() => setExportModalOpen(false)} 
          title="Export All Stories"
          size="md"
        >
          <div className="space-y-8 p-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Export Format</label>
              <select 
                value={exportFormat} 
                onChange={e => setExportFormat(e.target.value as any)} 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
              >
                <option value="txt">Plain Text (TXT)</option>
                <option value="docx">Microsoft Word (DOCX)</option>
                <option value="pdf">PDF Document</option>
              </select>
            </div>
            
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Export Method</label>
              <select 
                value={exportMode} 
                onChange={e => setExportMode(e.target.value as any)} 
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
              >
                <option value="zip">ZIP Archive (all stories)</option>
                <option value="file">Individual Files</option>
              </select>
            </div>
            
            <div className="flex gap-4 justify-end pt-4">
              <Button variant="secondary" className="rounded-xl px-6 py-2 font-bold" onClick={() => setExportModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="rounded-xl px-6 py-2 font-bold" onClick={doExportAll}>
                Export Stories
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard; 