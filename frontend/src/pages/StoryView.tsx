import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { getUserProjects, getChapters, Project, Chapter, Story, updateStory, updateProject, updateChapter } from '../services/storyService';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '../components/ui/Toast';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const StoryView: React.FC = () => {
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const { showToast } = useToast();
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [chapterEditMode, setChapterEditMode] = useState(false);
  const [chapterForm, setChapterForm] = useState<{ title: string; content: string }>({ title: '', content: '' });

  useEffect(() => {
    if (user && projectId) {
      setLoading(true);
      getUserProjects(user.uid).then(projects => {
        const found = projects.find(p => p.id === projectId);
        setProject(found || null);
        if (found) setForm(found);
        setLoading(false);
      });
      getChapters(user.uid, projectId).then(chs => {
        setChapters(chs);
        console.log('Fetched chapters:', chs);
        if (chs.length > 0) {
          setSelectedChapterIndex(0);
          setChapterForm({ title: chs[0].title, content: chs[0].content });
        }
      });
      (async () => {
        const storyDoc = await getDoc(doc(db, 'stories', projectId));
        if (storyDoc.exists()) {
          const storyData = { id: storyDoc.id, ...storyDoc.data() } as Story;
          setStory(storyData);
          setForm(storyData);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    if (chapters.length > 0 && selectedChapterIndex >= 0 && selectedChapterIndex < chapters.length) {
      setChapterForm({
        title: chapters[selectedChapterIndex].title,
        content: chapters[selectedChapterIndex].content,
      });
    }
  }, [selectedChapterIndex, chapters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      if (story) {
        await updateStory(story.id!, {
          title: form.title,
          genre: form.genre,
          tone: form.tone,
          content: form.content,
        });
        setStory({ ...story, ...form });
        showToast('Story updated!', 'success');
      } else if (project) {
        await updateProject(user.uid, project.id!, {
          title: form.title,
          genre: form.genre,
          description: form.description,
          status: form.status,
        });
        setProject({ ...project, ...form });
        showToast('Project updated!', 'success');
      }
      setEditMode(false);
    } catch (err) {
      showToast('Failed to update. Please try again.', 'error');
    }
  };

  const handleCancel = () => {
    if (story) setForm(story);
    else if (project) setForm(project);
    setEditMode(false);
  };

  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChapterIndex(Number(e.target.value));
    setChapterEditMode(false);
  };

  const handlePrevChapter = () => {
    setSelectedChapterIndex(i => Math.max(0, i - 1));
    setChapterEditMode(false);
  };
  const handleNextChapter = () => {
    setSelectedChapterIndex(i => Math.min(chapters.length - 1, i + 1));
    setChapterEditMode(false);
  };

  const handleChapterFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setChapterForm({ ...chapterForm, [e.target.name]: e.target.value });
  };

  const handleChapterSave = async () => {
    if (!user || !projectId || chapters.length === 0) return;
    const chapter = chapters[selectedChapterIndex];
    await updateChapter(user.uid, projectId, chapter.id, {
      title: chapterForm.title,
      content: chapterForm.content,
      chapterNumber: chapter.chapterNumber,
    });
    const updatedChapters = [...chapters];
    updatedChapters[selectedChapterIndex] = { ...chapter, ...chapterForm };
    setChapters(updatedChapters);
    setChapterEditMode(false);
    showToast('Chapter updated!', 'success');
  };

  if (loading) return <Loader />;
  if (!project && !story) return <div className="p-8 text-center text-red-600">Project or Story not found or you do not have access.</div>;

  if (story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826] p-4">
        <div className="w-full max-w-4xl mx-auto">
          <Button variant="secondary" onClick={() => navigate('/dashboard')} className="mb-4">&larr; Back to Dashboard</Button>
          <Card className="mb-6 p-6 flex flex-col gap-4">
            <div className="flex gap-2 mb-2">
              <Button variant="primary" onClick={() => {
                const blob = new Blob([story.content], { type: 'text/plain;charset=utf-8' });
                saveAs(blob, `${story.title || 'story'}.txt`);
              }}>Export TXT</Button>
              <Button variant="primary" onClick={() => {
                const doc = new Document({
                  sections: [
                    {
                      properties: {},
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun(story.title || ''),
                          ],
                          heading: 'Heading1',
                        }),
                        new Paragraph(story.content || ''),
                      ],
                    },
                  ],
                });
                Packer.toBlob(doc).then(blob => {
                  saveAs(blob, `${story.title || 'story'}.docx`);
                });
              }}>Export DOCX</Button>
              <Button variant="primary" onClick={() => {
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.text(story.title || '', 10, 20);
                doc.setFontSize(12);
                const splitText = doc.splitTextToSize(story.content || '', 180);
                doc.text(splitText, 10, 30);
                doc.save(`${story.title || 'story'}.pdf`);
              }}>Export PDF</Button>
            </div>
            {editMode ? (
              <>
                <input
                  className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2 bg-white dark:bg-blue-950 border border-blue-200 dark:border-orange-700 rounded px-2 py-1"
                  name="title"
                  value={form.title || ''}
                  onChange={handleChange}
                />
                <input
                  className="text-blue-500 dark:text-orange-200 mb-1 font-semibold bg-white dark:bg-blue-950 border border-blue-200 dark:border-orange-700 rounded px-2 py-1"
                  name="genre"
                  value={form.genre || ''}
                  onChange={handleChange}
                />
                <input
                  className="text-blue-500 dark:text-orange-200 mb-1 font-semibold bg-white dark:bg-blue-950 border border-blue-200 dark:border-orange-700 rounded px-2 py-1"
                  name="tone"
                  value={form.tone || ''}
                  onChange={handleChange}
                />
                <textarea
                  className="prose prose-blue dark:prose-invert max-w-none text-base leading-relaxed text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-blue-950/80 rounded-lg p-4 shadow-inner animate-fadeIn whitespace-pre-line border border-blue-200 dark:border-orange-700"
                  name="content"
                  value={form.content || ''}
                  onChange={handleChange}
                  rows={12}
                />
                <div className="flex gap-2 mt-2">
                  <Button variant="primary" onClick={handleSave}>Save</Button>
                  <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2">{story.title}</h2>
                  <Button variant="primary" onClick={() => setEditMode(true)}>Edit</Button>
                </div>
                <div className="text-blue-500 dark:text-orange-200 mb-1 font-semibold">{story.genre} &middot; {story.tone}</div>
                <div className="prose prose-blue dark:prose-invert max-w-none text-base leading-relaxed text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-blue-950/80 rounded-lg p-4 shadow-inner animate-fadeIn whitespace-pre-line">
                  {story.content}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826] p-4">
      <div className="w-full max-w-4xl mx-auto">
        <Button variant="secondary" onClick={() => navigate('/dashboard')} className="mb-4">&larr; Back to Dashboard</Button>
        <Card className="mb-6 p-6 flex flex-col md:flex-row gap-6 items-center">
          {project.coverImage && (
            <img src={project.coverImage} alt="Cover" className="w-32 h-44 object-cover rounded-lg shadow" />
          )}
          <div className="flex-1">
            {editMode ? (
              <>
                <input
                  className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2 bg-white dark:bg-blue-950 border border-blue-200 dark:border-orange-700 rounded px-2 py-1"
                  name="title"
                  value={form.title || ''}
                  onChange={handleChange}
                />
                <input
                  className="text-blue-500 dark:text-orange-200 mb-1 font-semibold bg-white dark:bg-blue-950 border border-blue-200 dark:border-orange-700 rounded px-2 py-1"
                  name="genre"
                  value={form.genre || ''}
                  onChange={handleChange}
                />
                <input
                  className="text-blue-500 dark:text-orange-200 mb-1 font-semibold bg-white dark:bg-blue-950 border border-blue-200 dark:border-orange-700 rounded px-2 py-1"
                  name="status"
                  value={form.status || ''}
                  onChange={handleChange}
                />
                <textarea
                  className="text-gray-700 dark:text-gray-200 mb-2 bg-white dark:bg-blue-950 border border-blue-200 dark:border-orange-700 rounded px-2 py-1"
                  name="description"
                  value={form.description || ''}
                  onChange={handleChange}
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <Button variant="primary" onClick={handleSave}>Save</Button>
                  <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2">{project.title}</h2>
                  <Button variant="primary" onClick={() => { setEditMode(true); setChapterEditMode(true); }}>Edit</Button>
                </div>
                <div className="text-blue-500 dark:text-orange-200 mb-1 font-semibold">{project.genre} &middot; {project.status}</div>
                <div className="text-gray-700 dark:text-gray-200 mb-2">{project.description}</div>
              </>
            )}
          </div>
        </Card>
        <Card className="mb-6 p-6">
          <h3 className="text-xl font-bold text-blue-700 dark:text-orange-300 mb-4">Chapters</h3>
          {chapters.length === 0 ? (
            <div className="text-blue-500 dark:text-blue-200">No chapters yet.</div>
          ) : (
            <>
              <pre style={{ color: 'red', fontSize: 12 }}>{JSON.stringify(chapters, null, 2)}</pre>
              <div className="flex items-center gap-4 mb-4">
                <Button variant="secondary" onClick={handlePrevChapter} disabled={selectedChapterIndex === 0}>Previous</Button>
                <select
                  className="px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950 text-gray-900 dark:text-gray-100 shadow"
                  value={selectedChapterIndex}
                  onChange={handleChapterChange}
                >
                  {chapters.map((ch, idx) => (
                    <option key={ch.id} value={idx}>Chapter {ch.chapterNumber}: {ch.title}</option>
                  ))}
                </select>
                <Button variant="secondary" onClick={handleNextChapter} disabled={selectedChapterIndex === chapters.length - 1}>Next</Button>
                <Button variant="primary" onClick={() => setChapterEditMode(e => !e)}>{chapterEditMode ? 'Cancel Edit' : 'Edit Chapter'}</Button>
                {chapterEditMode && (
                  <Button variant="primary" onClick={handleChapterSave}>Save</Button>
                )}
              </div>
              {chapterEditMode ? (
                <>
                  <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Editing Chapter {chapters[selectedChapterIndex].chapterNumber}</div>
                  <input
                    className="text-xl font-bold text-blue-700 dark:text-orange-300 mb-2 bg-white dark:bg-blue-950 border border-blue-200 dark:border-orange-700 rounded px-2 py-1"
                    name="title"
                    value={chapterForm.title}
                    onChange={handleChapterFormChange}
                  />
                  <textarea
                    className="whitespace-pre-line text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/60 rounded-lg p-4 shadow-inner mb-2 border border-blue-200 dark:border-orange-700"
                    name="content"
                    value={chapterForm.content}
                    onChange={handleChapterFormChange}
                    rows={10}
                  />
                </>
              ) : (
                <>
                  <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Chapter {chapters[selectedChapterIndex].chapterNumber}: {chapters[selectedChapterIndex].title}</div>
                  <div className="whitespace-pre-line text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/60 rounded-lg p-4 shadow-inner">
                    {chapters[selectedChapterIndex].content}
                  </div>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StoryView; 