import React from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

// Premium Input component with label, error display, and modern styling
const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText,
  leftIcon,
  rightIcon,
  inputSize = 'md',
  className = '', 
  ...props 
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = props.type === 'password';
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  const inputId = props.id || props.name || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="mb-6">
      {label && (
        <label 
          htmlFor={inputId}
          className="block mb-2 font-semibold text-slate-700 dark:text-slate-300 text-sm"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {leftIcon}
          </div>
        )}
        
      <input
          id={inputId}
          className={`
            w-full rounded-xl border-2 transition-all duration-200
            bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${(rightIcon || isPassword) ? 'pr-10' : ''}
            ${sizes[inputSize]}
            ${error 
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
              : 'border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500'
            }
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          {...props}
          type={isPassword ? (showPassword ? 'text' : 'password') : props.type}
      />
        
        {isPassword ? (
          <span
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
            role="button"
            onMouseDown={e => e.preventDefault()}
          >
            {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
          </span>
        ) : rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p 
          id={errorId} 
          className="text-red-500 text-sm mt-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p 
          id={helperId} 
          className="text-slate-500 dark:text-slate-400 text-sm mt-2"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input; 