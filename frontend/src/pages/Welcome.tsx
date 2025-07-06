import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { FiBookOpen, FiZap, FiUserPlus, FiArrowRight, FiStar, FiTrendingUp, FiShield, FiHeart } from 'react-icons/fi';

const Welcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center gap-8 sm:gap-12 animate-fadeIn">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center w-full mb-6 sm:mb-10 animate-fadeIn">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white/30 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl flex items-center justify-center mb-4 sm:mb-6 animate-float border border-white/30 dark:border-slate-700/40">
              <FiBookOpen className="w-10 h-10 sm:w-14 sm:h-14 text-blue-600 dark:text-orange-300 drop-shadow-lg" />
            </div>
            <div className="absolute -top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white dark:border-slate-900">
              <span className="text-white text-xs sm:text-sm font-bold tracking-wide">AI</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 dark:from-orange-300 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight tracking-tight drop-shadow-xl animate-slideInDown">
            AI Novel Crafter
          </h1>
          <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-xs sm:max-w-2xl leading-relaxed font-medium animate-fadeIn delay-100">
            Unleash your creativity with AI-powered story generation, editing, and analytics. 
            Write, refine, and manage your novels with ease—anywhere, anytime.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full mb-6 sm:mb-10 animate-slideInUp">
          <div className="group p-4 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 dark:border-slate-700/40 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center gap-3 sm:gap-4 text-center w-full max-w-xs mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <FiZap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">AI Story Generation</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
              Generate, refine, and expand your stories with advanced AI models that understand your creative vision and bring your ideas to life.
            </p>
          </div>
          <div className="group p-4 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 dark:border-slate-700/40 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center gap-3 sm:gap-4 text-center w-full max-w-xs mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <FiBookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Organize & Edit</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
              Edit, save, and manage all your stories in one beautiful, distraction-free writing environment designed for maximum creativity.
            </p>
          </div>
          <div className="group p-4 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 dark:border-slate-700/40 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center gap-3 sm:gap-4 text-center w-full max-w-xs mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300">
              <FiUserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Join the Community</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
              Sign up to unlock analytics, feedback, and connect with fellow writers in our creative community of storytellers.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full mb-6 sm:mb-10 animate-fadeIn delay-200">
          <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg border-0 text-center flex flex-col items-center gap-0.5 sm:gap-1 w-full max-w-xs mx-auto">
            <FiStar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">10K+</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Stories Created</div>
          </div>
          <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg border-0 text-center flex flex-col items-center gap-0.5 sm:gap-1 w-full max-w-xs mx-auto">
            <FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">5K+</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active Writers</div>
          </div>
          <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 shadow-lg border-0 text-center flex flex-col items-center gap-0.5 sm:gap-1 w-full max-w-xs mx-auto">
            <FiShield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">99.9%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Uptime</div>
          </div>
          <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 shadow-lg border-0 text-center flex flex-col items-center gap-0.5 sm:gap-1 w-full max-w-xs mx-auto">
            <FiHeart className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">4.9★</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">User Rating</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-lg mx-auto mb-6 sm:mb-10 animate-fadeIn delay-300">
        <Button
          variant="primary"
            size="xl"
            className="w-full py-4 sm:py-6 text-lg sm:text-xl font-bold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          onClick={() => navigate('/register')}
        >
          Get Started & Sign Up
            <FiArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-200" />
        </Button>
          <div className="text-center text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          Already have an account?{' '}
            <button 
              className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors duration-200" 
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-6 sm:mt-8 w-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md py-3 sm:py-4 rounded-2xl shadow-inner animate-fadeIn delay-400">
          <p className="font-medium">Experience the future of creative writing</p>
          <p className="mt-1 sm:mt-2">Powered by advanced AI technology</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome; 