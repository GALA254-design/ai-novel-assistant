// frontend/src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StoryEditor from './pages/StoryEditor';
import Feedback from './pages/Feedback';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AgentManager from './pages/AgentManager';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Help from './pages/Help';
import Recover from './pages/Recover';
import VerifyEmail from './pages/VerifyEmail';
import NewStory from './pages/NewStory';
import StoryView from './pages/StoryView';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';

// PrivateRoute component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" state={{ from: location, message: 'Please log in or sign up to continue.' }} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recover" element={<Recover />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/help" element={<Help />} />
            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/new-story" element={<PrivateRoute><NewStory /></PrivateRoute>} />
            <Route path="/editor" element={<PrivateRoute><StoryEditor /></PrivateRoute>} />
            <Route path="/feedback" element={<PrivateRoute><Feedback /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/agents" element={<PrivateRoute><AgentManager /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
            <Route path="/story/:projectId" element={<PrivateRoute><StoryView /></PrivateRoute>} />
            <Route path="*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default App;