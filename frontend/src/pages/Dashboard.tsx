import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { FiPlus, FiBarChart2, FiZap, FiBookOpen, FiEye, FiEyeOff, FiTrash2, FiSearch, FiDownload, FiClock, FiUpload, FiEdit2 } from 'react-icons/fi';
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

// Isolated Upload Form Component
const UploadForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; genre: string; tone: string; content: string }) => void;
  initialData: { title: string; genre: string; tone: string; content: string };
  loading: boolean;
}> = ({ isOpen, onClose, onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState(initialData);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter Story Details" size="lg">
      <form onSubmit={handleSubmit} className="space-y-8 p-2">
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Story Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter a compelling title"
            required
            className="w-full text-lg sm:text-xl font-bold bg-transparent outline-none border-b-2 border-blue-200 dark:border-orange-700 px-2 py-2"
            ref={titleInputRef}
          />
        </div>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Genre</label>
          <select
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
            value={genreOptions.includes(formData.genre) ? formData.genre : 'Other'}
            onChange={e => {
              const value = e.target.value;
              setFormData(prev => ({ ...prev, genre: value === 'Other' ? '' : value }));
            }}
            required
          >
            <option value="" disabled>Select genre</option>
            {genreOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {(!genreOptions.includes(formData.genre) || formData.genre === '') && (
            <Input
              label="Custom Genre"
              value={formData.genre}
              onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))}
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
            value={toneOptions.includes(formData.tone) ? formData.tone : 'Other'}
            onChange={e => {
              const value = e.target.value;
              setFormData(prev => ({ ...prev, tone: value === 'Other' ? '' : value }));
            }}
            required
          >
            <option value="" disabled>Select tone</option>
            {toneOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {(!toneOptions.includes(formData.tone) || formData.tone === '') && (
            <Input
              label="Custom Tone"
              value={formData.tone}
              onChange={e => setFormData(prev => ({ ...prev, tone: e.target.value }))}
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
            value={formData.content}
            onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Your story content..."
            required
          />
        </div>
        <div className="flex gap-4 justify-end pt-4">
          <Button variant="secondary" className="rounded-xl px-6 py-2 font-bold" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="rounded-xl px-6 py-2 font-bold">
            {loading ? 'Saving...' : 'Save Story'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

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
  const handleUpload = useCallback(async (text: string, file: File) => {
    setPendingUpload({ text, file });
    const initialData = { title: file.name.replace(/\.(pdf|txt|docx)$/i, ''), genre: '', tone: '', content: text };
    setUploadMeta(initialData);
    setShowMetaModal(true);
  }, []);

  // Save story after user enters meta
  const handleMetaSubmit = async (data: { title: string; genre: string; tone: string; content: string }) => {
    if (!user || !pendingUpload) return;
    setLoading(true);
    await createStory({
      title: data.title,
      content: data.content,
      genre: data.genre,
      tone: data.tone,
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
    addActivity('upload', `Uploaded "${data.title}"`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-full mx-auto p-3 sm:p-6 lg:p-8">
        {/* Dashboard Header with New Story Button (desktop only) */}
        <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 w-full">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Dashboard</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium">Manage your creative stories</p>
          </div>
          <Button 
            variant="primary" 
            size="lg"
            icon={<FiPlus />} 
            onClick={() => navigate('/new-story')}
            className="shadow-lg hover:shadow-2xl transition-all duration-200 w-full sm:w-auto text-base sm:text-lg font-bold px-6 sm:px-8 py-3 rounded-xl"
          >
            New Story
          </Button>
        </div>

        {/* Mobile Floating New Story Button (bottom bar) */}
        <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center sm:hidden pointer-events-none">
          <div className="w-full max-w-md px-4 pb-4 flex justify-center pointer-events-auto">
            <Button
              variant="primary"
              size="lg"
              icon={<FiPlus />}
              onClick={() => navigate('/new-story')}
              className="w-full py-4 text-lg font-bold rounded-2xl shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200"
              style={{ boxShadow: '0 8px 32px 0 rgba(31, 41, 55, 0.25)' }}
            >
              New Story
            </Button>
          </div>
        </div>

        {/* Dashboard Search Bar - Top, Prominent */}
        <div className="flex justify-center w-full mb-8">
          <div className="relative w-full max-w-2xl">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="text"
              placeholder="Search your stories by title, genre, or tone..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
                          aria-label="Search stories"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                        />
                      </div>
        </div>

        {search.trim() ? (
          // When searching, show table directly below search bar, de-emphasize analytics/upload
          <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/90 dark:bg-slate-900/90 p-4 sm:p-6">
                          <DataTable
                            columns={columns}
                data={getFilteredStories('all').map((story) => ({
                            ...story,
                  updatedAt: <span className="text-blue-600 dark:text-blue-400 font-mono text-xs sm:text-sm">{story.updatedAt?.toDate ? story.updatedAt.toDate().toLocaleString() : ''}</span>,
                  actions: null,
                  onView: () => navigate(`/story-editor/${story.id}`),
                  onPreview: () => setPreview(story),
                  onDelete: () => { setSelected(story); setShowDelete(true); },
                            }))}
                            onBatchDelete={handleBatchDelete}
                          />
            </div>
            {/* Optionally, show analytics/upload below in a collapsed or faded style */}
            <div className="opacity-60 pointer-events-none select-none">
              <UploadStoryCard key={uploadCardKey} onUpload={handleUpload} />
              {/* Removed the Total Stories card from main content area */}
            </div>
          </div>
        ) : (
          // Normal dashboard layout
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-full">
            {/* Main Content - Full width on mobile */}
            <div className="flex-1 min-w-0 space-y-4 sm:space-y-6 w-full max-w-full order-2 lg:order-1">
              <UploadStoryCard key={uploadCardKey} onUpload={handleUpload} />
              {/* Removed the Total Stories card from main content area */}
              <div className="mb-6 sm:mb-8">
                <div className="overflow-x-auto">
                  <DataTable
                    columns={columns}
                    data={getFilteredStories('all').map((story) => ({
                      ...story,
                      updatedAt: <span className="text-blue-600 dark:text-blue-400 font-mono text-xs sm:text-sm">{story.updatedAt?.toDate ? story.updatedAt.toDate().toLocaleString() : ''}</span>,
                      actions: null,
                      onView: () => navigate(`/story-editor/${story.id}`),
                      onPreview: () => setPreview(story),
                      onDelete: () => { setSelected(story); setShowDelete(true); },
                    }))}
                    onBatchDelete={handleBatchDelete}
                  />
                </div>
              </div>
            </div>

            {/* Mobile-Optimized Sidebar - Full width on mobile, sidebar on desktop */}
            <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4 sm:gap-6 order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start min-w-0 max-w-full">
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 border-0 rounded-2xl shadow-xl" variant="elevated">
                <h4 className="font-extrabold text-sm sm:text-base lg:text-lg text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 flex items-center gap-2 tracking-tight">
                  <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-600 shadow mr-2">
                    <FiZap className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </span>
                  Quick Actions
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <Button 
                    variant="outline" 
                    size="lg"
                    icon={<FiDownload />}
                    onClick={handleExportAll}
                    className="w-full justify-start shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-bold py-2 sm:py-3 rounded-xl"
                  >
                    Export All Stories
                  </Button>
                  {/* Removed Delete Selected button */}
                </div>
            </Card>
              
              {/* Recent Activity Card */}
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-blue-950 dark:via-slate-900 dark:to-indigo-950 border-0 rounded-2xl shadow-xl" variant="elevated">
                <h4 className="font-extrabold text-sm sm:text-base lg:text-lg text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 flex items-center gap-2 tracking-tight">
                  <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-600 shadow mr-2">
                    <FiClock className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </span>
                  Recent Activity
                </h4>
                <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto pr-1">
                {recentActivity.length === 0 ? (
                    <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm text-center py-4">
                      No recent activity.
                    </div>
                ) : (
                    recentActivity.slice(0, 10).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0
                          ${item.type === 'upload' ? 'bg-blue-500' : 
                          item.type === 'edit' ? 'bg-green-500' : 
                            'bg-red-500'} text-white`}>
                          {item.type === 'upload' ? <FiUpload className="w-4 h-4" /> :
                            item.type === 'edit' ? <FiEdit2 className="w-4 h-4" /> :
                            <FiTrash2 className="w-4 h-4" />}
                        </div>
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
            {/* Total Stories Card below Quick Actions */}
            <div className="w-full flex justify-center">
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50/90 via-blue-100/80 to-indigo-100/90 dark:from-blue-900/50 dark:via-blue-800/40 dark:to-indigo-900/50 border-0 w-full max-w-md min-h-[180px] sm:min-h-[220px] px-6 py-10 flex flex-col items-center justify-center transform hover:scale-105 hover:-translate-y-1 mt-4" variant="elevated" hover>
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-full shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500">
                    <FiBookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
                  </div>
                  <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-slate-100 leading-none mb-2">{totalStories}</div>
                  <div className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-semibold text-center">Total Stories</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        )}

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
        <UploadForm
          isOpen={showMetaModal}
          onClose={() => { setShowMetaModal(false); setPendingUpload(null); }}
          onSubmit={handleMetaSubmit}
          initialData={uploadMeta}
          loading={loading}
        />

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