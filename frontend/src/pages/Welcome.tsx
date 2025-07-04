import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { FiBookOpen, FiZap, FiUserPlus } from 'react-icons/fi';

const Welcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-[#181c2a] dark:via-[#232946] dark:to-blue-950 p-4 animate-fadeIn">
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center gap-8 justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiBookOpen className="w-16 h-16 text-blue-600 dark:text-orange-400 mb-2 animate-bounce" />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-700 dark:text-orange-300 text-center mb-2">Welcome to AI-NOVEL CRAFTER</h1>
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-200 text-center max-w-xl mb-2">
            Unleash your creativity with AI-powered story generation, editing, and analytics. Write, refine, and manage your novels with ease—anywhere, anytime.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <div className="flex flex-col items-center gap-2 p-4 bg-white/80 dark:bg-blue-950/80 rounded-xl shadow-lg border border-blue-200 dark:border-blue-900">
            <FiZap className="w-8 h-8 text-blue-500 dark:text-orange-400" />
            <span className="font-bold text-blue-700 dark:text-orange-300">AI Story Generation</span>
            <span className="text-sm text-gray-600 dark:text-gray-300 text-center">Generate, refine, and expand your stories with advanced AI models.</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white/80 dark:bg-blue-950/80 rounded-xl shadow-lg border border-blue-200 dark:border-blue-900">
            <FiBookOpen className="w-8 h-8 text-blue-500 dark:text-orange-400" />
            <span className="font-bold text-blue-700 dark:text-orange-300">Organize & Edit</span>
            <span className="text-sm text-gray-600 dark:text-gray-300 text-center">Edit, save, and manage all your stories in one beautiful dashboard.</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white/80 dark:bg-blue-950/80 rounded-xl shadow-lg border border-blue-200 dark:border-blue-900">
            <FiUserPlus className="w-8 h-8 text-blue-500 dark:text-orange-400" />
            <span className="font-bold text-blue-700 dark:text-orange-300">Join the Community</span>
            <span className="text-sm text-gray-600 dark:text-gray-300 text-center">Sign up to unlock analytics, feedback, and more creative tools.</span>
          </div>
        </div>
        <Button
          variant="primary"
          className="w-full max-w-xs py-4 text-xl font-bold shadow-lg bg-blue-600 dark:bg-orange-400 hover:bg-blue-700 dark:hover:bg-orange-500 transition-all duration-200 mt-6"
          onClick={() => navigate('/register')}
        >
          Get Started & Sign Up
        </Button>
        <div className="text-center text-gray-600 dark:text-gray-300 mt-4">
          Already have an account?{' '}
          <button className="text-blue-600 dark:text-orange-400 font-semibold underline" onClick={() => navigate('/login')}>Log In</button>
        </div>
      </div>
    </div>
  );
};

export default Welcome; 