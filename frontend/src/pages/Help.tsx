import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { FiBookOpen, FiHelpCircle, FiSettings, FiMail } from 'react-icons/fi';

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-[#181c2a] dark:via-[#232946] dark:to-blue-950">
      <div className="w-full mx-auto p-4 md:p-8 md:max-w-5xl flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <nav className="md:w-1/4 flex-shrink-0 flex md:flex-col gap-2 md:gap-4 mb-4 md:mb-0 sticky top-24 self-start">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`px-4 py-2 rounded-lg font-semibold text-left flex items-center gap-2 transition-colors duration-200 ${active === s.key ? 'bg-blue-600 text-white dark:bg-orange-400 dark:text-blue-950 shadow' : 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-orange-200'}`}
            >
              {sectionIcons[s.key]}
              {s.label}
            </button>
          ))}
        </nav>
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Card className="p-6">
            <div className="mb-6 border-b border-blue-100 dark:border-blue-900 pb-4">
              <h1 className="text-3xl font-bold text-blue-700 dark:text-orange-300 mb-1">Help & Support</h1>
              <p className="text-gray-600 dark:text-gray-300 text-base">Welcome to AI-NOVEL CRAFTER! Here you can find guides, FAQs, and support to help you get the most out of your experience.</p>
            </div>
            {active === 'getting-started' && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-orange-300">Getting Started</h2>
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
                <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-orange-300">Frequently Asked Questions</h2>
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
                <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-orange-300">Feature Guides</h2>
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
                <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-orange-300">Contact & Support</h2>
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
    </div>
  );
};

export default Help; 