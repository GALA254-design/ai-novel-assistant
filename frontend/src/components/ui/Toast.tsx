import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiX, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';

interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show a toast
  const showToast = useCallback((message: string, type: Toast['type'] = 'info', title?: string, duration = 5000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, title, duration }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastStyles = (type: Toast['type']) => {
    const base = 'relative px-4 py-3 rounded-2xl shadow-2xl font-medium flex items-start gap-3 transition-all duration-300 transform bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0';
    
    const variants = {
      success: 'border-l-4 border-green-400 dark:border-green-500',
      error: 'border-l-4 border-red-400 dark:border-red-500',
      warning: 'border-l-4 border-yellow-400 dark:border-yellow-500',
      info: 'border-l-4 border-blue-400 dark:border-blue-500',
    };
    
    return `${base} ${variants[type || 'info']}`;
  };

  const getIcon = (type: Toast['type']) => {
    const iconClass = 'w-5 h-5 flex-shrink-0 mt-0.5';
    switch (type) {
      case 'success':
        return <FiCheck className={`${iconClass} text-green-600 dark:text-green-400`} />;
      case 'error':
        return <FiAlertCircle className={`${iconClass} text-red-600 dark:text-red-400`} />;
      case 'warning':
        return <FiAlertCircle className={`${iconClass} text-yellow-600 dark:text-yellow-400`} />;
      default:
        return <FiInfo className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div 
        className="fixed bottom-4 right-4 z-50 space-y-3 flex flex-col items-end max-w-sm sm:max-w-md pointer-events-none" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${getToastStyles(toast.type)} pointer-events-auto animate-in slide-in-from-right-full duration-300`}
            role="status"
            aria-live="polite"
            tabIndex={0}
          >
            {getIcon(toast.type)}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="font-semibold text-sm mb-1">{toast.title}</div>
              )}
              <div className="text-sm leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-all duration-200 flex-shrink-0 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              aria-label="Dismiss notification"
            >
              <FiX size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};