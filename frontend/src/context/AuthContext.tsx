// frontend/src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';

// Define the shape of your user data (adjust as per your backend response)
interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  refreshUser: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Convert Firebase user to our User type
  const mapUser = (fbUser: FirebaseUser): User => ({
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
  });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(mapUser(fbUser));
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  function getFriendlyAuthError(error: any, context: 'login' | 'register'): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return context === 'register'
          ? 'An account with this email already exists. Please log in or use a different email.'
          : 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Incorrect email or password. Please check your credentials and try again.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials. Please check your email and password and try again.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'The sign-in popup was closed before completing.';
      default:
        return error.message || 'An unknown error occurred. Please try again.';
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(mapUser(result.user));
      setLoading(false);
      navigate('/dashboard');
      return true;
    } catch (err: any) {
      setError(getFriendlyAuthError(err, 'login'));
      setLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setUser(mapUser(result.user));
      await sendEmailVerification(result.user);
      setLoading(false);
      navigate('/verify-email');
      return true;
    } catch (err: any) {
      setError(getFriendlyAuthError(err, 'register'));
      setLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(mapUser(result.user));
      setLoading(false);
      navigate('/dashboard');
      return true;
    } catch (err: any) {
      setError(getFriendlyAuthError(err, 'login'));
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    signOut(auth);
    setUser(null);
    navigate('/login');
  };

  // Add a method to refresh the user from Firebase
  const refreshUser = () => {
    if (auth.currentUser) {
      setUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
      });
    }
  };

  // Add a method to send a password reset email
  const resetPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
      setLoading(false);
      return false;
    }
  };

  // Add a method to send a verification email
  const resendVerificationEmail = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setLoading(false);
        return true;
      } else {
        setError('No user is currently logged in.');
        setLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email.');
      setLoading(false);
      return false;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
    // Optionally, update Firestore here if needed
  };

  // Provide the context values to children components
  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, loginWithGoogle, logout, refreshUser, resetPassword, resendVerificationEmail, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export {};