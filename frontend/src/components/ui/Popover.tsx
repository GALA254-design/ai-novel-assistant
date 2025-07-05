import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  button: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

// Premium Popover component for floating content, accessible, closes on outside click, and traps focus
const Popover: React.FC<PopoverProps> = ({ button, children, align = 'right', width = 'min-w-[220px]' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
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
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl transition-all duration-200"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {button}
      </button>
      <div
        ref={contentRef}
        className={`absolute z-50 mt-3 ${alignClass} ${width} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl transition-all duration-200 ease-in-out transform origin-top ${open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'} animate-fadeIn`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{ minWidth: 220 }}
      >
        {/* Arrow */}
        <span className="absolute -top-2 left-10 w-4 h-4 bg-white dark:bg-slate-900 border-l border-t border-slate-200 dark:border-slate-700 rotate-45 z-0 shadow-md" />
        <div className="relative z-10 p-4">{children}</div>
      </div>
    </div>
  );
};

export default Popover; 