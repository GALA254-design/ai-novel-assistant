import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Recover: React.FC = () => {
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    const ok = await resetPassword(email);
    if (ok) setSuccess(true);
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826] flex flex-col items-center justify-center">
      <div className="w-full max-w-lg mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-blue-950/80 p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="p-2 border rounded"
            required
            disabled={success}
          />
          <Button type="submit" disabled={loading || success}>
            {loading ? 'Sending...' : success ? 'Sent!' : 'Send Reset Link'}
          </Button>
          {success && (
            <div className="text-green-600 text-center">
              Check your email for a reset link.<br />
              <Link to="/login" className="text-blue-600 dark:text-blue-300 hover:underline font-semibold">Back to Login</Link>
            </div>
          )}
          {error && <div className="text-red-600 text-center">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default Recover; 