import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const { resendVerificationEmail, loading, error } = useAuth();
  const [resent, setResent] = useState(false);
  const handleResend = async () => {
    setResent(false);
    const ok = await resendVerificationEmail();
    if (ok) setResent(true);
  };
  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826] flex flex-col items-center justify-center">
      <div className="w-full max-w-lg mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-2 text-center">Verify Your Email</h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-2">
          A verification email has been sent to your address. Please check your inbox and click the link to verify your account.<br />
          Didn't get the email?
        </p>
        <Button type="button" onClick={handleResend} disabled={loading}>
          {loading ? 'Resending...' : 'Resend Verification Email'}
        </Button>
        {resent && <div className="text-green-600 text-center">Verification email sent!</div>}
        {error && <div className="text-red-600 text-center">{error}</div>}
        <Link to="/login" className="text-blue-600 dark:text-blue-300 hover:underline font-semibold mt-4">Back to Login</Link>
      </div>
    </div>
  );
};

export default VerifyEmail; 