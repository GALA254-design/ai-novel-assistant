// frontend/src/pages/Register.tsx

import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import googleLogo from '../assets/google.svg';

const Register: React.FC = () => {
  // Destructure the 'register' function, 'loading' state, and 'error' state from useAuth
  const { register, loading, error: authError, loginWithGoogle } = useAuth();
  const navigate = useNavigate(); // Initialize navigate hook

  // Initialize form state with 'name', 'email', 'password', and 'confirm'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [formError, setFormError] = useState<string | null>(null); // For local form validation errors
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); // Clear previous local form errors
    setSuccess(false); // Clear previous success state

    // Basic client-side validation: passwords must match
    if (form.password !== form.confirm) {
      setFormError('Passwords do not match');
      return;
    }

    // Call the actual register function from AuthContext
    const isSuccess = await register(form.email, form.password);

    if (isSuccess) {
      // Set display name after registration
      if (typeof window !== 'undefined') {
        const { auth } = await import('../firebase');
        const { updateProfile } = await import('firebase/auth');
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: form.name });
        }
      }
      setSuccess(true);
      // Optional: Redirect to login page after a short delay for user to read success message
      setTimeout(() => {
        navigate('/login');
      }, 2000); // Redirect after 2 seconds
    } else {
      // The error state will be handled by `authError` from `useAuth`
      // No need to set a separate `setError` here as `authError` will display
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826] flex flex-col items-center justify-center">
      <div className="w-full max-w-lg mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <Card className="w-full p-6 md:p-8 bg-white/80 dark:bg-blue-950/80 backdrop-blur-md border border-blue-200 dark:border-blue-900 shadow-2xl">
          <h2 className="text-3xl font-heading font-bold mb-6 text-center text-[#232946] dark:text-white tracking-tight">Register</h2>
          <Button type="button" variant="secondary" className="w-full mb-4 flex items-center justify-center gap-2 border-2 border-blue-400 dark:border-orange-400 bg-white dark:bg-blue-950 text-blue-700 dark:text-orange-300 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-200" onClick={loginWithGoogle} disabled={loading}>
            <img src={googleLogo} alt="Google logo" className="w-5 h-5" />
            Register with Google
          </Button>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Input for User's Name */}
            <Input
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
            {/* Input for User's Email */}
            <Input
              label="Email"
              name="email"
              type="email" // Use type="email" for better browser validation
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              autoComplete="email"
              required
            />
            {/* Input for Password */}
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
            {/* Input for Confirm Password */}
            <Input
              label="Confirm Password"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
            {/* Display local form errors or authentication errors from context */}
            {(formError || authError) && (
              <div className="text-danger text-sm text-center font-semibold dark:text-pink-400">
                {formError || authError}
              </div>
            )}
            {/* Display success message */}
            {success && (
              <div className="text-success text-sm text-center font-semibold dark:text-green-400">
                Registration successful! Redirecting to login...
              </div>
            )}
            <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full py-3 text-lg font-bold shadow-lg bg-blue-600 dark:bg-orange-400 hover:bg-blue-700 dark:hover:bg-orange-500 transition-all duration-200">
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-blue-900 dark:text-blue-100">
            Already have an account? <a href="/login" className="text-blue-600 dark:text-blue-300 hover:underline font-semibold">Sign In</a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;