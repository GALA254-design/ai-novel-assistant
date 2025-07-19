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
  setDoc,
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

export async function generateStory({ prompt, genre, tone }) {
  const response = await fetch("https://n8nromeo123987.app.n8n.cloud/webhook-test/ultimate-agentic-novel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      genre,
      tone,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate story from n8n.");
  }

  const blob = await response.blob();
  return {
    story: await blob.text(),
    fileUrl: URL.createObjectURL(blob),
  };
}

export async function generateStoryTxtFromN8n({ prompt, genre, tone }) {
  const response = await fetch("https://n8nromeo123987.app.n8n.cloud/webhook-test/ultimate-agentic-novel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      genre,
      tone,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to generate story from n8n.");
  }
  const blob = await response.blob();
  return await blob.text();
}

// New function to generate story via Firebase
export async function generateStoryViaFirebase({ 
  title, 
  prompt, 
  genre, 
  tone, 
  chapters, 
  words, 
  userId 
}: {
  title: string;
  prompt: string;
  genre: string;
  tone: string;
  chapters: number;
  words: number;
  userId: string;
}) {
  // Create a temporary document to track the generation
  const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generationRef = doc(db, 'storyGenerations', generationId);
  
  // Initialize the generation document
  await setDoc(generationRef, {
    userId,
    title,
    prompt,
    genre,
    tone,
    chapters,
    words,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  // Trigger n8n workflow with Firebase save instruction
  const response = await fetch("https://n8nromeo123987.app.n8n.cloud/webhook/ultimate-agentic-novel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      genre,
      tone,
      prompt,
      chapters,
      words,
      saveToFirebase: true,
      generationId,
      userId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to trigger story generation');
  }

  // Poll for the result
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  const pollInterval = 5000; // 5 seconds

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    const generationDoc = await getDoc(generationRef);
    if (generationDoc.exists()) {
      const data = generationDoc.data();
      if (data.status === 'completed' && data.story) {
        // Create the story in Firebase
        const storyId = await createStory({
          title: data.title || title,
          content: data.story,
          authorId: userId,
          authorName: '', // Will be filled by the component
          genre: data.genre || genre,
          tone: data.tone || tone,
        });

        // Clean up the generation document
        await deleteDoc(generationRef);

        return {
          storyId,
          story: data.story,
          title: data.title || title
        };
      } else if (data.status === 'failed') {
        await deleteDoc(generationRef);
        throw new Error(data.error || 'Story generation failed');
      }
    }
    
    attempts++;
  }

  // Clean up if timeout
  await deleteDoc(generationRef);
  throw new Error('Story generation timed out. Please try again.');
}

// Hybrid function that tries Firebase first, falls back to file download
export async function generateStoryHybrid({ 
  title, 
  prompt, 
  genre, 
  tone, 
  chapters, 
  words, 
  userId 
}: {
  title: string;
  prompt: string;
  genre: string;
  tone: string;
  chapters: number;
  words: number;
  userId: string;
}) {
  try {
    // Try Firebase method first
    return await generateStoryViaFirebase({
      title,
      prompt,
      genre,
      tone,
      chapters,
      words,
      userId
    });
  } catch (error) {
    console.log('Firebase method failed, falling back to file download:', error);
    
    // Fallback to file download method
    const response = await fetch("https://n8nromeo123987.app.n8n.cloud/webhook/ultimate-agentic-novel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        genre,
        tone,
        prompt,
        chapters,
        words
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate story');
    }

    const blob = await response.blob();
    const storyContent = await blob.text();

    // Create story in Firebase manually
    const storyId = await createStory({
      title,
      content: storyContent,
      authorId: userId,
      authorName: '',
      genre,
      tone,
    });

    return {
      storyId,
      story: storyContent,
      title
    };
  }
}

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

export async function getAllStories(): Promise<Story[]> {
  const snapshot = await getDocs(collection(db, 'stories'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
} 