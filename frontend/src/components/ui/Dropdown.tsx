import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  label: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

// Premium Dropdown component with accessible menu and modern styling
const Dropdown: React.FC<DropdownProps> = ({ label, children, compact = false, align = 'right', width = 'w-56' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus trap and Escape key handler
  useEffect(() => {
    if (!open) return;
    const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && focusable && focusable.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    first?.focus();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Alignment classes
  const alignClass = align === 'left' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        className={`rounded-xl font-semibold border-2 border-blue-600 dark:border-blue-400 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 shadow-lg ${compact ? 'text-xs px-2 py-1' : 'text-base px-4 py-2'}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        {/* Dropdown arrow */}
        <svg className={`ml-2 inline-block transition-transform duration-200 ${open ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M7 7l3 3 3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
      </button>
      <div
        ref={contentRef}
        className={`absolute mt-3 z-50 ${alignClass} ${width} bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl transition-all duration-200 origin-top ${open ? 'scale-100 opacity-100 pointer-events-auto animate-fadeIn' : 'scale-95 opacity-0 pointer-events-none'}`}
        tabIndex={-1}
        role="menu"
        aria-modal="true"
        style={{ minWidth: 180 }}
      >
        {/* Arrow */}
        <span className="absolute -top-2 right-8 w-4 h-4 bg-white/80 dark:bg-slate-900/90 border-l border-t border-slate-200 dark:border-slate-700 rotate-45 z-0 shadow-md" />
        <div className="py-2 relative z-10">{children}</div>
      </div>
    </div>
  );
};

// Premium Dropdown.Item for menu items
interface DropdownItemProps extends React.ComponentProps<'button'> {
  compact?: boolean;
}
export const DropdownItem: React.FC<DropdownItemProps> = ({ children, className = '', compact = false, ...props }) => (
  <button
    className={`w-full text-left font-semibold rounded-xl border-2 border-transparent bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 ${compact ? 'text-xs px-2 py-1' : 'text-base px-4 py-3'} ${className}`}
    role="menuitem"
    {...props}
  >
    {children}
  </button>
);

export default Dropdown; 