import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { FiArrowLeft, FiEdit, FiSave, FiDownload, FiFileText, FiFile, FiFileImage } from 'react-icons/fi';

const StoryView: React.FC = () => {
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const passedStoryText = location.state?.storyText || '';
  const [storyText, setStoryText] = useState<string>(passedStoryText);
  const [chaptersParsed, setChaptersParsed] = useState<string[]>([]);

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

  useEffect(() => {
    if (passedStoryText) {
      // Optional: parse chapters if the story uses 'Chapter X:'
      const chapters = passedStoryText.split(/Chapter \d+:/i).filter(Boolean).map((c, i) => `Chapter ${i + 1}:${c}`);
      setChaptersParsed(chapters.length > 1 ? chapters : []);
    }
  }, [passedStoryText]);

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
        navigate('/dashboard', { state: { refresh: true } });
      } else if (project) {
        await updateProject(user.uid, project.id!, {
          title: form.title,
          genre: form.genre,
          description: form.description,
          status: form.status,
        });
        setProject({ ...project, ...form });
        showToast('Project updated!', 'success');
        setEditMode(false);
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

  const fetchStoryFromN8n = async () => {
    try {
      const response = await fetch('https://your-n8n-webhook-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Your prompt here' }),
      });
      const blob = await response.blob();
      const text = await blob.text();
      setStoryText(text);
      // Optional: parse chapters if the story uses 'Chapter X:'
      const chapters = text.split(/Chapter \d+:/i).filter(Boolean).map((c, i) => `Chapter ${i + 1}:${c}`);
      setChaptersParsed(chapters.length > 1 ? chapters : []);
    } catch (err) {
      setStoryText('Failed to fetch story from n8n.');
    }
  };

  if (loading) return <Loader />;
  if (!project && !story) return <div className="p-8 text-center text-red-600">Project or Story not found or you do not have access.</div>;

  if (story) {
    return (
      <div className="w-full animate-fadeIn">
        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Go back to Dashboard"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="w-full max-w-4xl mx-auto">
          <Card className="mb-6 p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button 
                variant="secondary" 
                onClick={() => {
                  const blob = new Blob([story.content], { type: 'text/plain;charset=utf-8' });
                  saveAs(blob, `${story.title || 'story'}.txt`);
                }}
                className="flex items-center gap-2"
              >
                <FiFileText className="w-4 h-4" />
                Export as TXT
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
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
                }}
                className="flex items-center gap-2"
              >
                <FiFile className="w-4 h-4" />
                Export as DOCX
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  const doc = new jsPDF();
                  doc.setFontSize(16);
                  doc.text(story.title || '', 10, 20);
                  doc.setFontSize(12);
                  const splitText = doc.splitTextToSize(story.content || '', 180);
                  doc.text(splitText, 10, 30);
                  doc.save(`${story.title || 'story'}.pdf`);
                }}
                className="flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export as PDF
              </Button>
              {editMode && (
                <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
                  <FiSave className="w-4 h-4" />
                  Save Story
                </Button>
              )}
            </div>

            {/* Story content */}
            {editMode ? (
              <div className="space-y-4">
                <input
                  className="w-full text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2 bg-white/80 dark:bg-blue-950/80 border border-blue-200 dark:border-orange-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                  name="title"
                  value={form.title || ''}
                  onChange={handleChange}
                  placeholder="Story title..."
                />
                <div className="flex gap-4">
                  <input
                    className="flex-1 px-4 py-2 rounded-xl border border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80 text-blue-500 dark:text-orange-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                    name="genre"
                    value={form.genre || ''}
                    onChange={handleChange}
                    placeholder="Genre..."
                  />
                  <input
                    className="flex-1 px-4 py-2 rounded-xl border border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80 text-blue-500 dark:text-orange-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                    name="tone"
                    value={form.tone || ''}
                    onChange={handleChange}
                    placeholder="Tone..."
                  />
                </div>
                <textarea
                  className="w-full min-h-[400px] prose prose-blue dark:prose-invert max-w-none text-base leading-relaxed text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-blue-950/80 rounded-xl p-6 shadow-inner border border-blue-200 dark:border-orange-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200 resize-y"
                  name="content"
                  value={form.content || ''}
                  onChange={handleChange}
                  placeholder="Write your story here..."
                />
                <div className="flex gap-2 mt-4">
                  <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
                    <FiSave className="w-4 h-4" />
                    Save
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2">{story.title}</h2>
                    <div className="text-blue-500 dark:text-orange-200 mb-4 font-semibold">{story.genre} &middot; {story.tone}</div>
                  </div>
                  <Button variant="primary" onClick={() => setEditMode(true)} className="flex items-center gap-2">
                    <FiEdit className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
                <div className="prose prose-blue dark:prose-invert max-w-none text-base leading-relaxed text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-blue-950/80 rounded-xl p-6 shadow-inner border border-blue-200 dark:border-orange-700 whitespace-pre-line">
                  {story.content}
                </div>
              </div>
            )}
          </Card>

          {storyText && (
            <Card className="mb-6 p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent">Generated Story</h2>
              {chaptersParsed.length > 0 ? (
                chaptersParsed.map((chapter, idx) => (
                  <div key={idx} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-orange-300">{chapter.split(':')[0]}</h3>
                    <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">{chapter.slice(chapter.indexOf(':') + 1)}</div>
                  </div>
                ))
              ) : (
                <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 leading-relaxed">{storyText}</div>
              )}
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Go back to Dashboard"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        {/* Project info */}
        <Card className="mb-6 p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <div className="flex gap-6">
            {project.coverImage && (
              <img src={project.coverImage} alt="Cover" className="w-32 h-44 object-cover rounded-xl shadow-lg" />
            )}
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-4">
                  <input
                    className="w-full text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2 bg-white/80 dark:bg-blue-950/80 border border-blue-200 dark:border-orange-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                    name="title"
                    value={form.title || ''}
                    onChange={handleChange}
                    placeholder="Project title..."
                  />
                  <div className="flex gap-4">
                    <input
                      className="flex-1 px-4 py-2 rounded-xl border border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80 text-blue-500 dark:text-orange-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                      name="genre"
                      value={form.genre || ''}
                      onChange={handleChange}
                      placeholder="Genre..."
                    />
                    <input
                      className="flex-1 px-4 py-2 rounded-xl border border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80 text-blue-500 dark:text-orange-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                      name="status"
                      value={form.status || ''}
                      onChange={handleChange}
                      placeholder="Status..."
                    />
                  </div>
                  <textarea
                    className="w-full px-4 py-2 rounded-xl border border-blue-200 dark:border-orange-700 bg-white/80 dark:bg-blue-950/80 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200 resize-y"
                    name="description"
                    value={form.description || ''}
                    onChange={handleChange}
                    placeholder="Project description..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
                      <FiSave className="w-4 h-4" />
                      Save
                    </Button>
                    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-2">{project.title}</h2>
                      <div className="text-blue-500 dark:text-orange-200 mb-2 font-semibold">{project.genre} &middot; {project.status}</div>
                      <div className="text-gray-700 dark:text-gray-200">{project.description}</div>
                    </div>
                    <Button variant="primary" onClick={() => { setEditMode(true); setChapterEditMode(true); }} className="flex items-center gap-2">
                      <FiEdit className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Chapters */}
        <Card className="mb-6 p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <h3 className="text-xl font-bold text-blue-700 dark:text-orange-300 mb-4">Chapters</h3>
          {chapters.length === 0 ? (
            <div className="text-blue-500 dark:text-blue-200 text-center py-8">No chapters yet.</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={handlePrevChapter} disabled={selectedChapterIndex === 0} className="flex items-center gap-2">
                  Previous
                </Button>
                <select
                  className="flex-1 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-blue-950/80 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                  value={selectedChapterIndex}
                  onChange={handleChapterChange}
                >
                  {chapters.map((ch, idx) => (
                    <option key={ch.id} value={idx}>Chapter {ch.chapterNumber}: {ch.title}</option>
                  ))}
                </select>
                <Button variant="secondary" onClick={handleNextChapter} disabled={selectedChapterIndex === chapters.length - 1} className="flex items-center gap-2">
                  Next
                </Button>
                <Button variant="primary" onClick={() => setChapterEditMode(e => !e)} className="flex items-center gap-2">
                  <FiEdit className="w-4 h-4" />
                  {chapterEditMode ? 'Cancel Edit' : 'Edit Chapter'}
                </Button>
                {chapterEditMode && (
                  <Button variant="primary" onClick={handleChapterSave} className="flex items-center gap-2">
                    <FiSave className="w-4 h-4" />
                    Save
                  </Button>
                )}
              </div>
              {chapterEditMode ? (
                <div className="space-y-4">
                  <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Editing Chapter {chapters[selectedChapterIndex].chapterNumber}</div>
                  <input
                    className="w-full text-xl font-bold text-blue-700 dark:text-orange-300 mb-2 bg-white/80 dark:bg-blue-950/80 border border-blue-200 dark:border-orange-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200"
                    name="title"
                    value={chapterForm.title}
                    onChange={handleChapterFormChange}
                    placeholder="Chapter title..."
                  />
                  <textarea
                    className="w-full min-h-[400px] whitespace-pre-line text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/60 rounded-xl p-6 shadow-inner border border-blue-200 dark:border-orange-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 transition-all duration-200 resize-y"
                    name="content"
                    value={chapterForm.content}
                    onChange={handleChapterFormChange}
                    placeholder="Write your chapter content here..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Chapter {chapters[selectedChapterIndex].chapterNumber}: {chapters[selectedChapterIndex].title}</div>
                  <div className="whitespace-pre-line text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/60 rounded-xl p-6 shadow-inner border border-blue-200 dark:border-orange-700 leading-relaxed">
                    {chapters[selectedChapterIndex].content}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StoryView; 