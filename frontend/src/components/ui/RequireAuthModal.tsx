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
    <Modal isOpen={isOpen} onClose={onClose} title="Authentication Required">
      <div className="p-4 flex flex-col items-center gap-4">
        <div className="text-center text-lg text-blue-900 dark:text-blue-100 font-semibold mb-2">
          {message || 'Please log in or sign up to continue.'}
        </div>
        <div className="flex gap-3 w-full">
          <Button className="flex-1 py-2 text-base font-bold" variant="primary" onClick={() => { onClose(); navigate('/login'); }}>
            Log In
          </Button>
          <Button className="flex-1 py-2 text-base font-bold" variant="secondary" onClick={() => { onClose(); navigate('/register'); }}>
            Sign Up
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RequireAuthModal; 