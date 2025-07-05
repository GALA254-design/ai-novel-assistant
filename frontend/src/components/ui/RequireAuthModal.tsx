import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

interface RequireAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const RequireAuthModal: React.FC<RequireAuthModalProps> = ({ isOpen, onClose, message }) => {
  const navigate = useNavigate();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Authentication Required" size="sm">
      <div className="flex flex-col items-center gap-6 p-2">
        <div className="text-center text-lg text-slate-800 dark:text-slate-100 font-semibold mb-2">
          {message || 'Please log in or sign up to continue.'}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button className="flex-1 py-3 text-base font-bold" variant="primary" size="lg" onClick={() => { onClose(); navigate('/login'); }}>
            Log In
          </Button>
          <Button className="flex-1 py-3 text-base font-bold" variant="secondary" size="lg" onClick={() => { onClose(); navigate('/register'); }}>
            Sign Up
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RequireAuthModal; 