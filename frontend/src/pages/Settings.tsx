import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { FiSettings, FiInfo, FiArrowLeft, FiSave, FiRotateCcw, FiLogOut, FiUser, FiMail, FiGlobe, FiClock, FiSun, FiMoon, FiZap, FiShield, FiBell, FiEye, FiEyeOff } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, fetchUserById } from '../services/api';
import { db, auth } from '../firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const tabLabels = [
  { label: 'Profile', key: 'profile', icon: <FiUser className="w-4 h-4" /> },
  { label: 'Security', key: 'security', icon: <FiShield className="w-4 h-4" /> },
];

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
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
  });
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        displayName: user.displayName || prev.displayName,
        email: user.email || prev.email,
      }));
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
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
    await setDoc(doc(db, 'userPreferences', user.uid), {
      defaultGenre: settings.defaultGenre,
      defaultTone: settings.defaultTone,
      defaultLength: settings.defaultLength,
      autoSave: settings.autoSave,
      saveInterval: settings.saveInterval,
    }, { merge: true });
    showToast('Settings saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      showToast('Settings reset to default', 'info');
    }
  };

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

      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <FiSettings className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Customize your experience and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Tabs and content */}
          <div className="flex-1 min-w-0">
            {/* Tabs with animated underline */}
            <div className="flex flex-col sm:flex-row border-b border-blue-100 dark:border-blue-900 mb-8 gap-2 sm:gap-0">
              {tabLabels.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 w-full sm:w-auto px-6 py-3 font-semibold rounded-t-xl sm:rounded-t-none sm:rounded-l-xl text-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    activeTab === tab.key 
                      ? 'text-blue-700 dark:text-orange-300 border-b-2 border-blue-600 dark:border-orange-400 bg-blue-50 dark:bg-blue-900/50 shadow-lg' 
                      : 'text-blue-700 dark:text-orange-300 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                  aria-selected={activeTab === tab.key}
                  role="tab"
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content in cards */}
            <Card className="p-4 sm:p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 rounded-3xl shadow-2xl w-full max-w-full mb-8 animate-fadeIn">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <Input
                      label="Display Name"
                      value={settings.displayName}
                      onChange={e => handleProfileChange('displayName', e.target.value)}
                      leftIcon={<FiUser className="w-4 h-4" />}
                      className="w-full"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={settings.email}
                      onChange={e => handleProfileChange('email', e.target.value)}
                      leftIcon={<FiMail className="w-4 h-4" />}
                      className="w-full"
                    />
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Timezone</label>
                      <div className="relative">
                        <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 transition-all duration-200"
                      >
                        <option value="UTC-8">Pacific Time (UTC-8)</option>
                        <option value="UTC-5">Eastern Time (UTC-5)</option>
                        <option value="UTC+0">UTC</option>
                        <option value="UTC+1">Central European Time (UTC+1)</option>
                        <option value="UTC+8">China Standard Time (UTC+8)</option>
                      </select>
                    </div>
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Language</label>
                      <div className="relative">
                        <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 transition-all duration-200"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                  </div>
                  </div>
                  
                  {/* Theme Toggle */}
                  <div className="mt-4 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 w-full">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? <FiMoon className="w-5 h-5 text-blue-600" /> : <FiSun className="w-5 h-5 text-orange-500" />}
                    <div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Appearance</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                    </div>
                  </div>
                      <button
                        onClick={toggleTheme}
                        className="relative w-16 h-8 flex items-center rounded-full border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-lg"
                        aria-label="Toggle theme"
                      >
                        <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ${
                          theme === 'dark' 
                            ? 'bg-blue-600 translate-x-8' 
                            : 'bg-orange-500 translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'security' && (
                <div className="space-y-8 max-w-full sm:max-w-lg mx-auto">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiShield /> Change Password</h2>
                  <form
                    className="space-y-6"
                    onSubmit={async e => {
                      e.preventDefault();
                      setPasswordError(null);
                      setPasswordSuccess(false);
                      setPasswordLoading(true);
                      try {
                        if (!user?.email) throw new Error('No user email');
                        if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) throw new Error('All fields required');
                        if (passwordForm.new !== passwordForm.confirm) throw new Error('New passwords do not match');
                        const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
                        if (!auth.currentUser) throw new Error('No authenticated user');
                        const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
                        await reauthenticateWithCredential(auth.currentUser, credential);
                        await updatePassword(auth.currentUser, passwordForm.new);
                        setPasswordSuccess(true);
                        setPasswordForm({ current: '', new: '', confirm: '' });
                        showToast('Password updated successfully', 'success');
                      } catch (err: any) {
                        let msg = err.message || 'Failed to update password';
                        if (err.code === 'auth/wrong-password') msg = 'Current password is incorrect.';
                        if (err.code === 'auth/weak-password') msg = 'New password is too weak.';
                        setPasswordError(msg);
                      } finally {
                        setPasswordLoading(false);
                      }
                    }}
                  >
                    <Input
                      label="Current Password"
                      type="password"
                      value={passwordForm.current}
                      onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))}
                      required
                      className="w-full"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordForm.new}
                      onChange={e => setPasswordForm(f => ({ ...f, new: e.target.value }))}
                      required
                      className="w-full"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={passwordForm.confirm}
                      onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
                      required
                      className="w-full"
                    />
                    {passwordError && <div className="text-red-600 dark:text-red-400 text-sm font-semibold bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 w-full">{passwordError}</div>}
                    {passwordSuccess && <div className="text-green-600 dark:text-green-400 text-sm font-semibold bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-xl border border-green-200 dark:border-green-800 w-full">Password updated successfully!</div>}
                    <Button type="submit" variant="primary" className="w-full py-3 font-bold" disabled={passwordLoading}>
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </div>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full">
              <Button 
                variant="primary" 
                onClick={handleSaveSettings} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FiSave className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="secondary" onClick={handleResetSettings} className="flex items-center gap-2">
                <FiRotateCcw className="w-4 h-4" />
                Reset to Default
              </Button>
            </div>
          </div>

          {/* Right: Tips/Help */}
          <div className="w-full lg:w-1/4 flex-shrink-0 flex flex-col gap-6 sticky top-20 self-start min-w-0">
            <Card className="p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
              <FiInfo className="w-6 h-6 text-blue-600 dark:text-orange-400" />
              <div>
                  <div className="font-semibold text-blue-700 dark:text-orange-300">Tip</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                You can customize your experience in each tab. Changes are saved instantly!
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <FiShield className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-700 dark:text-blue-300">Privacy</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Your settings and preferences are stored securely and only accessible to you.
              </div>
            </Card>
          </div>
        </div>

        {/* Log Out button */}
        <div className="w-full flex justify-center mt-8">
          <Button
            variant="danger"
            className="flex items-center gap-2 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
              }
            }}
          >
            <FiLogOut className="w-5 h-5" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
