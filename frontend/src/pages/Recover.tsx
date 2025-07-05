import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { Link } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiArrowLeft, FiRefreshCw, FiLock } from 'react-icons/fi';

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
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-[#181c2a] dark:via-[#232946] dark:to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiLock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Reset Password
            </h1>
            
            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                leftIcon={<FiMail className="w-4 h-4" />}
                required
                disabled={success}
              />
              
              <Button 
                type="submit" 
                disabled={loading || success}
                className="flex items-center gap-2 w-full"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : success ? (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    Sent!
                  </>
                ) : (
                  <>
                    <FiMail className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>
            
            {/* Success Message */}
            {success && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 justify-center text-green-600 dark:text-green-400 mb-3">
                  <FiCheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Check your email for a reset link.</span>
                </div>
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <span className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</span>
              </div>
            )}
            
            {/* Back to Login (when not in success state) */}
            {!success && (
              <div className="mt-6">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Recover; 