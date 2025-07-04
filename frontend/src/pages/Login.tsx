// frontend/src/pages/Login.tsx (No major changes needed if 'username' is intended to be 'email')

import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import googleLogo from '../assets/google.svg';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const { login, loginWithGoogle, loading, error } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' }); // 'username' here should be the email

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Assuming the 'username' input is where the user enters their email
    await login(form.username, form.password); // Calls useAuth().login(email, password)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
      <div className="w-full max-w-lg mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <Card className="w-full p-6 md:p-8 bg-white/80 dark:bg-blue-950/80 backdrop-blur-md border border-blue-200 dark:border-blue-900 shadow-2xl">
          <h2 className="text-3xl font-heading font-bold mb-6 text-center text-[#232946] dark:text-white tracking-tight">Sign In</h2>
          <Button type="button" variant="secondary" className="w-full mb-4 flex items-center justify-center gap-2 border-2 border-blue-400 dark:border-orange-400 bg-white dark:bg-blue-950 text-blue-700 dark:text-orange-300 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-200" onClick={loginWithGoogle} disabled={loading}>
            <img src={googleLogo} alt="Google logo" className="w-5 h-5" />
            {loading ? 'Signing in with Google...' : 'Sign in with Google'}
          </Button>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <Input
              label="Username or Email"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username or email"
              autoComplete="username"
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
              required
            />
            {error && <div className="text-danger text-sm text-center font-semibold dark:text-pink-400">{error}</div>}
            <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full py-3 text-lg font-bold shadow-lg bg-blue-600 dark:bg-orange-400 hover:bg-blue-700 dark:hover:bg-orange-500 transition-all duration-200">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/recover" className="text-blue-600 dark:text-blue-300 hover:underline font-semibold">Forgot your password?</Link>
          </div>
          <div className="mt-6 text-center text-sm text-blue-900 dark:text-blue-100">
            Don&apos;t have an account? <a href="/register" className="text-blue-600 dark:text-blue-300 hover:underline font-semibold">Register</a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;