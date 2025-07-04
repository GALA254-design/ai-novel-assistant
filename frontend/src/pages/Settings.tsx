import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { FiSettings, FiInfo } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, fetchUserById } from '../services/api';
import { db } from '../firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

const tabLabels = [
  { label: 'Profile', key: 'profile' },
  { label: 'Story Generation', key: 'generation' },
];

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(tabLabels[0].key);
  const [settings, setSettings] = useState({
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    timezone: 'UTC-5',
    language: 'en',
    theme: 'auto',
    defaultGenre: 'Fantasy',
    defaultTone: 'Serious',
    defaultLength: 'Medium',
    autoSave: true,
    saveInterval: 30,
    preferredAgent: 'openai',
    fallbackAgent: 'claude',
    maxRetries: 3,
    defaultExportFormat: 'pdf',
    includeMetadata: true,
    autoExport: false,
    emailNotifications: true,
    storyCompletionAlerts: true,
    systemUpdates: false,
    marketingEmails: false,
    shareAnalytics: true,
    shareUsageData: false,
    publicProfile: false,
    bio: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'userPreferences', user.uid)).then(snapshot => {
        if (snapshot.exists()) {
          setSettings(prev => ({ ...prev, ...snapshot.data() }));
        }
      });
    }
  }, [user]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileChange = async (key: string, value: any) => {
    handleSettingChange(key, value);
    if (!user) return;
    if (key === 'displayName') {
      await updateUser({ displayName: value });
      await updateDoc(doc(db, 'users', user.uid), { displayName: value });
    } else if (key === 'email') {
      await updateUser({ email: value });
      await updateDoc(doc(db, 'users', user.uid), { email: value });
    } else if (key === 'bio') {
      await updateDoc(doc(db, 'users', user.uid), { bio: value });
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    await setDoc(doc(db, 'userPreferences', user.uid), {
      defaultGenre: settings.defaultGenre,
      defaultTone: settings.defaultTone,
      defaultLength: settings.defaultLength,
      autoSave: settings.autoSave,
      saveInterval: settings.saveInterval,
    }, { merge: true });
    showToast('Settings saved successfully', 'success');
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      showToast('Settings reset to default', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-[#181c2a] dark:via-[#232946] dark:to-blue-950">
      <div className="w-full mx-auto p-4 md:p-8 md:max-w-5xl">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#232946]/80 backdrop-blur-md border-b border-blue-100 dark:border-blue-900 flex items-center justify-between px-4 py-2 shadow">
          <h2 className="text-2xl font-bold text-blue-700 dark:text-orange-300 flex items-center gap-2"><FiSettings /> Settings</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-12 mt-4">
          {/* Left: Tabs and content */}
          <div className="flex-1 min-w-0">
            {/* Tabs with animated underline */}
            <div className="flex flex-col sm:flex-row border-b border-blue-100 dark:border-blue-900 mb-6 gap-2 sm:gap-0">
              {tabLabels.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full sm:w-auto px-4 py-3 font-semibold rounded-t-lg sm:rounded-t-none sm:rounded-l-lg text-base transition-colors duration-200 ${activeTab === tab.key ? 'text-blue-700 dark:text-orange-300 border-b-2 border-blue-600 dark:border-orange-400 bg-blue-50 dark:bg-blue-900' : 'text-blue-700 dark:text-orange-300 bg-transparent'}`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-blue-600 dark:bg-orange-400 rounded-full transition-all duration-300" />
                  )}
                </button>
              ))}
            </div>
            {/* Tab content in cards */}
            <Card className="p-4 sm:p-6 w-full">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Display Name"
                      value={settings.displayName}
                      onChange={e => handleProfileChange('displayName', e.target.value)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={settings.email}
                      onChange={e => handleProfileChange('email', e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Bio</label>
                      <textarea
                        value={settings.bio || ''}
                        onChange={e => handleProfileChange('bio', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="UTC-8">Pacific Time (UTC-8)</option>
                        <option value="UTC-5">Eastern Time (UTC-5)</option>
                        <option value="UTC+0">UTC</option>
                        <option value="UTC+1">Central European Time (UTC+1)</option>
                        <option value="UTC+8">China Standard Time (UTC+8)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Appearance</span>
                    <button
                      onClick={toggleTheme}
                      className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow text-2xl"
                      aria-label="Toggle theme"
                    >
                      {theme === 'dark' ? '🌞' : '🌙'}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                </div>
              )}
              {activeTab === 'generation' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Default Genre</label>
                      <select
                        value={settings.defaultGenre}
                        onChange={(e) => handleSettingChange('defaultGenre', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="Fantasy">Fantasy</option>
                        <option value="Sci-Fi">Science Fiction</option>
                        <option value="Mystery">Mystery</option>
                        <option value="Romance">Romance</option>
                        <option value="Horror">Horror</option>
                        <option value="Adventure">Adventure</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Default Tone</label>
                      <select
                        value={settings.defaultTone}
                        onChange={(e) => handleSettingChange('defaultTone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="Serious">Serious</option>
                        <option value="Humorous">Humorous</option>
                        <option value="Dramatic">Dramatic</option>
                        <option value="Inspiring">Inspiring</option>
                        <option value="Dark">Dark</option>
                        <option value="Lighthearted">Lighthearted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Default Length</label>
                      <select
                        value={settings.defaultLength}
                        onChange={(e) => handleSettingChange('defaultLength', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="Short">Short</option>
                        <option value="Medium">Medium</option>
                        <option value="Long">Long</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Auto-save Interval (seconds)</label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={settings.saveInterval}
                        onChange={(e) => handleSettingChange('saveInterval', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Enable auto-save</span>
                    </label>
                  </div>
                </div>
              )}
              {activeTab === 'agents' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Preferred Agent</label>
                      <select
                        value={settings.preferredAgent}
                        onChange={(e) => handleSettingChange('preferredAgent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="openai">OpenAI GPT-4</option>
                        <option value="claude">Claude 3 Sonnet</option>
                        <option value="gemini">Google Gemini Pro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fallback Agent</label>
                      <select
                        value={settings.fallbackAgent}
                        onChange={(e) => handleSettingChange('fallbackAgent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="claude">Claude 3 Sonnet</option>
                        <option value="openai">OpenAI GPT-4</option>
                        <option value="gemini">Google Gemini Pro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Max Retries</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={settings.maxRetries}
                        onChange={(e) => handleSettingChange('maxRetries', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'export' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Default Export Format</label>
                      <select
                        value={settings.defaultExportFormat}
                        onChange={(e) => handleSettingChange('defaultExportFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="pdf">PDF</option>
                        <option value="txt">Text File</option>
                        <option value="md">Markdown</option>
                        <option value="docx">Word Document</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.includeMetadata}
                        onChange={(e) => handleSettingChange('includeMetadata', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Include metadata in exports</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.autoExport}
                        onChange={(e) => handleSettingChange('autoExport', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Auto-export completed stories</span>
                    </label>
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.storyCompletionAlerts}
                      onChange={(e) => handleSettingChange('storyCompletionAlerts', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Story completion alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.systemUpdates}
                      onChange={(e) => handleSettingChange('systemUpdates', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">System updates and maintenance</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.marketingEmails}
                      onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Marketing and promotional emails</span>
                  </label>
                </div>
              )}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.shareAnalytics}
                      onChange={(e) => handleSettingChange('shareAnalytics', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Share anonymous analytics to improve the service</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.shareUsageData}
                      onChange={(e) => handleSettingChange('shareUsageData', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Share usage data for research purposes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.publicProfile}
                      onChange={(e) => handleSettingChange('publicProfile', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Make my profile public</span>
                  </label>
                </div>
              )}
            </Card>
            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 w-full">
              <Button variant="primary" onClick={handleSaveSettings}>
                Save Settings
              </Button>
              <Button variant="secondary" onClick={handleResetSettings}>
                Reset to Default
              </Button>
            </div>
          </div>
          {/* Right: Tips/Help */}
          <div className="w-full md:w-1/4 flex-shrink-0 flex flex-col gap-6 sticky top-20 self-start min-w-0">
            <Card className="p-4 flex items-center gap-3">
              <FiInfo className="w-6 h-6 text-blue-600 dark:text-orange-400" />
              <div>
                <div className="font-bold">Tip</div>
                <div className="text-xs text-gray-500">You can customize your experience in each tab. Changes are saved instantly!</div>
              </div>
            </Card>
          </div>
        </div>
        {/* Log Out button at the bottom */}
        <div className="w-full flex justify-center mt-8">
          <Button
            variant="danger"
            className="w-full max-w-xs py-3 text-lg font-bold shadow-lg bg-red-600 dark:bg-orange-500 hover:bg-red-700 dark:hover:bg-orange-600 transition-all duration-200"
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
              }
            }}
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
