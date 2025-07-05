// frontend/src/pages/Login.tsx (No major changes needed if 'username' is intended to be 'email')

import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import googleLogo from '../assets/google.svg';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

const Login: React.FC = () => {
  const { login, loginWithGoogle, loading, error } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(form.username, form.password);
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
            <FiMail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in to continue your creative journey
          </p>
        </div>

        <Card className="w-full p-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
          {/* Google Sign In */}
          <Button 
            type="button" 
            variant="outline" 
            className="w-full mb-6 flex items-center justify-center gap-3 py-3 text-base font-semibold border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200" 
            onClick={loginWithGoogle} 
            disabled={loading}
          >
            <img src={googleLogo} alt="Google logo" className="w-5 h-5" />
            {loading ? 'Signing in with Google...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              name="username"
              type="email"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your email address"
              autoComplete="email"
              leftIcon={<FiMail className="w-4 h-4" />}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              leftIcon={<FiLock className="w-4 h-4" />}
              required
            />
            
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm font-semibold bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              disabled={loading} 
              className="w-full py-3 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <Link 
              to="/recover" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200"
            >
              Forgot your password?
            </Link>
          </div>
          
          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link 
              to="/register" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200"
            >
              Create one now
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;