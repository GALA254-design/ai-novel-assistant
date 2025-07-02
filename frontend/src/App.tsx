// frontend/src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

import { AuthProvider } from './context/AuthContext'; // <--- IMPORT AuthProvider here

const App: React.FC = () => {
  return (
    <Router> {/* The Router component provides the routing context */}
      <AuthProvider> {/* <--- AuthProvider is now INSIDE the Router context */}
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-story" element={<NewStory />} />
            <Route path="/editor" element={<StoryEditor />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/agents" element={<AgentManager />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/help" element={<Help />} />
            <Route path="/recover" element={<Recover />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/story/:projectId" element={<StoryView />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
};

export default App;