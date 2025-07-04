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
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
      <div className="w-full mx-auto p-4 md:p-8 md:max-w-6xl">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#232946]/80 backdrop-blur-md border-b border-blue-100 dark:border-blue-900 flex items-center justify-between px-4 py-2 shadow">
          <h2 className="text-2xl font-bold text-blue-700 dark:text-orange-300">Dashboard</h2>
          <Button variant="primary" icon={<FiPlus />} onClick={() => navigate('/new-story')}>New Story</Button>
        </div>
        <div className="flex flex-col md:flex-row gap-12 mt-4">
          {/* Left: Main content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Upload Story Card */}
            <UploadStoryCard key={uploadCardKey} onUpload={handleUpload} />
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="flex items-center gap-4 p-4">
                <FiBookOpen className="w-8 h-8 text-blue-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">{totalStories}</div>
                  <div className="text-xs text-gray-500">Stories</div>
                </div>
              </Card>
              <Card className="flex items-center gap-4 p-4">
                <FiBarChart2 className="w-8 h-8 text-blue-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">{completedStories}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </Card>
              <Card className="flex items-center gap-4 p-4">
                <FiZap className="w-8 h-8 text-blue-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">{aiGeneratedStories}</div>
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
                          <DataTable
                            columns={columns}
                            data={getFilteredStories(tab.status).map((story) => ({
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
                                    className="p-2 rounded bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center shadow border border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                                    title="Delete"
                                    aria-label="Delete"
                                    onClick={() => { setSelected(story); setShowDelete(true); }}
                                  >
                                    <FiTrash2 size={22} />
                                  </button>
                                </div>
                              ),
                            }))}
                            onBatchDelete={handleBatchDelete}
                          />
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
              <Button variant="secondary" className="w-full mb-2" onClick={handleExportAll}>Export All</Button>
              <Button variant="secondary" className="w-full" onClick={handleDeleteSelected}>Delete Selected</Button>
            </Card>
            <Card className="p-4">
              <h4 className="font-bold mb-2">Recent Activity</h4>
              <ul className="space-y-2 text-blue-900 dark:text-blue-100">
                {recentActivity.length === 0 ? (
                  <li className="text-sm text-gray-400">No recent activity.</li>
                ) : (
                  recentActivity.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className={`inline-block w-2 h-2 rounded-full ${item.type === 'upload' ? 'bg-blue-400 dark:bg-orange-400' : item.type === 'edit' ? 'bg-green-400 dark:bg-green-400' : 'bg-orange-400 dark:bg-blue-400'}`}></span>
                      <span>{item.text}</span>
                      <span className="ml-auto text-xs text-blue-400 dark:text-blue-300">{item.time}</span>
                    </li>
                  ))
                )}
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
          isOpen={showBatchDeleteConfirm}
          onClose={() => setShowBatchDeleteConfirm(false)}
          title="Delete Selected Stories?"
        >
          <p className="mb-4 text-blue-900 dark:text-blue-100">Are you sure you want to delete the selected stories? This action cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={confirmBatchDelete} disabled={loading}>Delete</Button>
            <Button variant="secondary" onClick={() => setShowBatchDeleteConfirm(false)}>Cancel</Button>
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
            <div>
              <label className="block text-blue-700 dark:text-orange-300 font-semibold mb-1">Story Content</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 min-h-[120px]"
                value={uploadMeta.content}
                onChange={e => setUploadMeta({ ...uploadMeta, content: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="primary" type="submit" disabled={loading}>Save Story</Button>
              <Button variant="secondary" type="button" onClick={() => { setShowMetaModal(false); setPendingUpload(null); }}>Cancel</Button>
            </div>
          </form>
        </Modal>
        <Modal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export All Stories">
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Choose format:</label>
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100">
                <option value="txt">TXT</option>
                <option value="docx">DOCX</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Export as:</label>
              <select value={exportMode} onChange={e => setExportMode(e.target.value as any)} className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-orange-700 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100">
                <option value="zip">ZIP (all stories in one archive)</option>
                <option value="file">File by file (download each)</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="primary" onClick={doExportAll}>Export</Button>
              <Button variant="secondary" onClick={() => setExportModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard; 