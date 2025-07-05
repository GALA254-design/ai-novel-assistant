import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

// Premium Card component for content blocks with modern styling and variants
const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const variants = {
    default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg',
    elevated: 'bg-white dark:bg-slate-800 border-0 shadow-2xl',
    outlined: 'bg-transparent border-2 border-slate-200 dark:border-slate-700 shadow-none',
    ghost: 'bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm',
  };

  const hoverClass = hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-300' : '';

  return (
    <div
      className={`
        rounded-2xl transition-all duration-200
        ${variants[variant]}
        ${paddingClasses[padding]}
        ${hoverClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card; 