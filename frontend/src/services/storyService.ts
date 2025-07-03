import api from './api';
import axios from 'axios';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';

export interface GenerateStoryParams {
  prompt: string;
  genre: string;
  tone: string;
  length?: string;
  setting?: string;
}

export interface GenerateStoryResponse {
  status: string;
  story: string;
}

export interface Story {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  genre: string;
  tone: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  genre: string;
  coverImage?: string;
  status: 'Draft' | 'Editing' | 'Completed';
  createdAt?: any;
  lastUpdated?: any;
}

export interface Chapter {
  id?: string;
  title: string;
  content: string;
  chapterNumber: number;
  aiSuggestions?: string[];
  createdAt?: any;
  lastEdited?: any;
}

export interface Export {
  id?: string;
  format: string;
  createdAt?: any;
  status: string;
  downloadLink?: string;
}

export interface Feedback {
  id?: string;
  type: string;
  message: string;
  rating: number;
  createdAt?: any;
}

<<<<<<< HEAD
export async function generateStory(params: GenerateStoryParams): Promise<GenerateStoryResponse> {
  const response = await fetch('https://n8nromeo123987.app.n8n.cloud/webhook-test/ultimate-agentic-novel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error('Failed to generate story');
  }
  return await response.json();
}

// The following function is not recommended for production and may cause CORS issues.
// export async function generateStoryDirectly({ prompt, genre, tone }: { prompt: string; genre: string; tone: string }) {
//   try {
//     const url = 'https://n8nromeo123987.app.n8n.cloud/webhook-test/generate story';
//     const body = { prompt, genre, tone };
//     console.log('Sending POST to n8n webhook:', url, body);
//     const response = await axios.post(url, body, {
//       headers: { 'Content-Type': 'application/json' },
//       responseType: 'text', // Expect plain text
//     });
//     console.log('n8n plain text response:', response.data);
//     return response.data; // This is the story as plain text
//   } catch (error: any) {
//     console.error('Error from n8n webhook:', error);
//     throw error.response?.data || error.message || 'Story generation failed';
//   }
// } 
=======
export async function generateStory({ prompt, genre, tone }) {
  const response = await fetch("https://n8nromeo123987.app.n8n.cloud/webhook/ultimate-agentic-novel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: prompt,
      genre,
      tone,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate story from n8n.");
  }

  const blob = await response.blob(); // because your n8n workflow returns a file
  return {
    story: await blob.text(), // extract the text from the file
    fileUrl: URL.createObjectURL(blob), // optional: to trigger download
  };
}
>>>>>>> 3e3e879f518c32329bc841962304115b9482af36

export async function createStory(story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, 'stories'), {
    ...story,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getUserStories(authorId: string): Promise<Story[]> {
  const q = query(collection(db, 'stories'), where('authorId', '==', authorId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
}

export async function updateStory(id: string, updates: Partial<Story>) {
  const storyRef = doc(db, 'stories', id);
  await updateDoc(storyRef, { ...updates, updatedAt: Timestamp.now() });
}

export async function deleteStory(id: string) {
  await deleteDoc(doc(db, 'stories', id));
}

// PROJECTS CRUD
export async function createProject(userId: string, project: Omit<Project, 'id' | 'createdAt' | 'lastUpdated'>) {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, `users/${userId}/projects`), {
      ...project,
      createdAt: now,
      lastUpdated: now,
    });
    return docRef.id;
  } catch (e) {
    throw new Error('Failed to create project.');
  }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    const q = query(collection(db, `users/${userId}/projects`));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  } catch (e) {
    throw new Error('Failed to fetch projects.');
  }
}

export async function updateProject(userId: string, projectId: string, updates: Partial<Project>) {
  try {
    const projectRef = doc(db, `users/${userId}/projects`, projectId);
    await updateDoc(projectRef, { ...updates, lastUpdated: Timestamp.now() });
  } catch (e) {
    throw new Error('Failed to update project.');
  }
}

export async function deleteProject(userId: string, projectId: string) {
  try {
    await deleteDoc(doc(db, `users/${userId}/projects`, projectId));
  } catch (e) {
    throw new Error('Failed to delete project.');
  }
}

// CHAPTERS CRUD
export async function addChapter(userId: string, projectId: string, chapter: Omit<Chapter, 'id' | 'createdAt' | 'lastEdited'>) {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, `users/${userId}/projects/${projectId}/chapters`), {
      ...chapter,
      createdAt: now,
      lastEdited: now,
    });
    return docRef.id;
  } catch (e) {
    throw new Error('Failed to add chapter.');
  }
}

export async function getChapters(userId: string, projectId: string): Promise<Chapter[]> {
  try {
    const q = query(collection(db, `users/${userId}/projects/${projectId}/chapters`));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter));
  } catch (e) {
    throw new Error('Failed to fetch chapters.');
  }
}

export async function updateChapter(userId: string, projectId: string, chapterId: string, updates: Partial<Chapter>) {
  try {
    const chapterRef = doc(db, `users/${userId}/projects/${projectId}/chapters`, chapterId);
    await updateDoc(chapterRef, { ...updates, lastEdited: Timestamp.now() });
  } catch (e) {
    throw new Error('Failed to update chapter.');
  }
}

export async function deleteChapter(userId: string, projectId: string, chapterId: string) {
  try {
    await deleteDoc(doc(db, `users/${userId}/projects/${projectId}/chapters`, chapterId));
  } catch (e) {
    throw new Error('Failed to delete chapter.');
  }
}

// EXPORTS CRUD
export async function addExport(userId: string, exportData: Omit<Export, 'id' | 'createdAt'>) {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, `users/${userId}/exports`), {
      ...exportData,
      createdAt: now,
    });
    return docRef.id;
  } catch (e) {
    throw new Error('Failed to add export.');
  }
}

// FEEDBACK CRUD
export async function addFeedback(userId: string, feedback: Omit<Feedback, 'id' | 'createdAt'>) {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, `users/${userId}/feedback`), {
      ...feedback,
      createdAt: now,
    });
    return docRef.id;
  } catch (e) {
    throw new Error('Failed to add feedback.');
  }
} 