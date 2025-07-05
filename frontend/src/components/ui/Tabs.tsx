import React, { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  initialIndex?: number;
  fullWidth?: boolean;
}

// Premium Tabs component for switching between content sections
const Tabs: React.FC<TabsProps> = ({ tabs, initialIndex = 0, fullWidth = false }) => {
  const [active, setActive] = useState(initialIndex);
  return (
    <div>
      <div
        className={`relative flex gap-2 mb-6 ${fullWidth ? 'w-full' : ''}`}
        role="tablist"
      >
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`
              text-base px-5 py-2 font-semibold rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
              shadow-sm
              ${active === idx
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg scale-105 z-10'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300'}
              ${fullWidth ? 'flex-1' : ''}
            `}
            onClick={() => setActive(idx)}
            aria-selected={active === idx}
            aria-controls={`tabpanel-${idx}`}
            id={`tab-${idx}`}
            role="tab"
            tabIndex={active === idx ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="rounded-2xl bg-white dark:bg-slate-900/60 shadow-inner p-6 transition-all duration-200"
        role="tabpanel"
        id={`tabpanel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        {tabs[active].content}
      </div>
    </div>
  );
};

export default Tabs; 