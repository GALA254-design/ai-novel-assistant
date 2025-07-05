import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FiBookOpen, FiHelpCircle, FiSettings, FiMail, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const sections = [
  { key: 'getting-started', label: 'Getting Started' },
  { key: 'faq', label: 'FAQ' },
  { key: 'features', label: 'Feature Guides' },
  { key: 'contact', label: 'Contact & Support' },
];

const sectionIcons = {
  'getting-started': <FiBookOpen className="inline-block mr-2 text-blue-600 dark:text-orange-400" />,
  'faq': <FiHelpCircle className="inline-block mr-2 text-blue-600 dark:text-orange-400" />,
  'features': <FiSettings className="inline-block mr-2 text-blue-600 dark:text-orange-400" />,
  'contact': <FiMail className="inline-block mr-2 text-blue-600 dark:text-orange-400" />,
};

const Help: React.FC = () => {
  const [active, setActive] = useState(sections[0].key);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={handleBack}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Go back to Dashboard"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
      
      {/* Main content */}
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent mb-2 drop-shadow">Help & Support</h1>
          <p className="text-gray-600 dark:text-gray-300 text-base">Welcome to AI-NOVEL CRAFTER! Here you can find guides, FAQs, and support to help you get the most out of your experience.</p>
        </div>

        {/* Navigation tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`px-4 py-2 rounded-xl font-semibold text-left flex items-center gap-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-orange-400 shadow-sm ${active === s.key ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white dark:from-orange-400 dark:to-pink-400 dark:text-blue-950 shadow-lg' : 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-orange-200 hover:bg-blue-200 dark:hover:bg-blue-800'}`}
              aria-current={active === s.key ? 'page' : undefined}
              tabIndex={0}
            >
              {sectionIcons[s.key]}
              {s.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <Card className="p-4 sm:p-8 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
          {active === 'getting-started' && (
            <div>
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent">Getting Started</h2>
              <ol className="list-decimal ml-6 space-y-2 text-gray-800 dark:text-gray-100">
                <li>Sign up for an account or log in.</li>
                <li>Explore the Dashboard to view and manage your stories.</li>
                <li>Use the Story Editor to create or edit your stories with AI assistance.</li>
                <li>Visit Settings to customize your preferences and profile.</li>
                <li>Check Analytics for insights on your writing and AI usage.</li>
              </ol>
            </div>
          )}
          {active === 'faq' && (
            <div>
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent">Frequently Asked Questions</h2>
              <ul className="space-y-3 text-gray-800 dark:text-gray-100">
                <li><b>How do I generate a story with AI?</b><br />Go to the Story Editor, enter your prompt, and click "Generate".</li>
                <li><b>Can I change my profile picture?</b><br />Yes, go to your Profile page and upload a new avatar.</li>
                <li><b>How do I export my stories?</b><br />Use the Export tab in Settings or the export options in the Dashboard.</li>
                <li><b>Is my data private?</b><br />Your stories and profile are private by default. See Privacy in Settings for more options.</li>
              </ul>
            </div>
          )}
          {active === 'features' && (
            <div>
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent">Feature Guides</h2>
              <ul className="list-disc ml-6 space-y-2 text-gray-800 dark:text-gray-100">
                <li><b>Dashboard:</b> Overview of your stories, quick actions, and stats.</li>
                <li><b>Story Editor:</b> Write, edit, and generate stories with AI help.</li>
                <li><b>Agent Management:</b> Add, edit, and manage AI agents for story generation.</li>
                <li><b>Analytics:</b> Visualize your writing activity and AI usage.</li>
                <li><b>Settings:</b> Customize your profile, preferences, and notifications.</li>
              </ul>
            </div>
          )}
          {active === 'contact' && (
            <div>
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent">Contact & Support</h2>
              <p className="mb-2 text-gray-800 dark:text-gray-100">Need help? Reach out to our support team:</p>
              <ul className="list-disc ml-6 text-gray-800 dark:text-gray-100">
                <li>Email: <a href="mailto:support@ai-novel.com" className="text-blue-600 underline">support@ai-novel.com</a></li>
                <li>Community: <a href="https://discord.gg/ainovel" className="text-blue-600 underline">Join our Discord</a></li>
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Help; 