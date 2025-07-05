import React from 'react';

// Premium Loader/Spinner component for async actions
const Loader: React.FC<{ size?: number; className?: string; color?: string }> = ({ size = 32, className = '', color }) => (
  <span
    className={`inline-flex items-center justify-center ${className}`}
    role="status"
    aria-label="Loading"
    aria-busy="true"
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      className="animate-spin-slow text-blue-600 dark:text-blue-400 drop-shadow-lg"
      style={color ? { color } : {}}
    >
      <circle
        className="opacity-20"
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeWidth="6"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M25 5a20 20 0 0 1 20 20h-6a14 14 0 0 0-14-14V5z"
      />
    </svg>
  </span>
);

export default Loader; 