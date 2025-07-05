import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Link } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';

const VerifyEmail: React.FC = () => {
  const { resendVerificationEmail, loading, error } = useAuth();
  const [resent, setResent] = useState(false);
  
  const handleResend = async () => {
    setResent(false);
    const ok = await resendVerificationEmail();
    if (ok) setResent(true);
  };
  
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-[#181c2a] dark:via-[#232946] dark:to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Verify Your Email
            </h1>
            
            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              A verification email has been sent to your address. Please check your inbox and click the link to verify your account.
            </p>
            
            {/* Resend Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Didn't get the email?
              </p>
              <Button 
                variant="secondary" 
                onClick={handleResend} 
                disabled={loading}
                className="flex items-center gap-2 w-full"
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <FiMail className="w-4 h-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>
            
            {/* Status Messages */}
            {resent && (
              <div className="flex items-center gap-2 justify-center text-green-600 dark:text-green-400 mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <FiCheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Verification email sent!</span>
              </div>
            )}
            
            {error && (
              <div className="text-red-600 dark:text-red-400 text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            
            {/* Back to Login */}
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail; 