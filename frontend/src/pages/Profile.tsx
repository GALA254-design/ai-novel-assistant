import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { FiEdit2, FiAward, FiArrowLeft, FiUser, FiMail, FiLock, FiCamera, FiSave, FiLogOut, FiActivity, FiStar } from 'react-icons/fi';
import { auth, db } from '../firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    avatar: user?.photoURL || '',
    theme: 'auto',
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Sync local profile state with user on mount and when user changes
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (isMounted) {
        setProfile({
          name: user?.displayName || '',
          email: user?.email || '',
          avatar: user?.photoURL || '',
          theme: 'auto',
        });
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [user]);

  if (!user) {
    return (
      <div className="w-full animate-fadeIn">
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-indigo-500 dark:from-orange-300 dark:to-pink-400 bg-clip-text text-transparent">Join Us!</h1>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">Create an account to manage your profile and stories.</p>
            <div className="flex justify-center gap-4">
              <Button variant="primary">
                <NavLink to="/register">Sign Up</NavLink>
              </Button>
              <Button variant="secondary">
                <NavLink to="/login">Log In</NavLink>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // Update Firebase Auth (displayName, photoURL, email)
      if (auth.currentUser) {
        if (profile.email !== user.email) {
          await updateEmail(auth.currentUser, profile.email);
        }
        await updateProfile(auth.currentUser, {
          displayName: profile.name,
          photoURL: profile.avatar,
        });
      }
      // Update Firestore profile (bio, avatar, etc.)
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          displayName: profile.name,
          email: profile.email,
          photoURL: profile.avatar,
        }, { merge: true });
      }
      // Update AuthContext for instant UI reflection
      await updateUser({
        displayName: profile.name,
        email: profile.email,
        photoURL: profile.avatar,
      });
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = () => {
    if (password.new !== password.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    showToast('Password updated successfully!', 'success');
    setPassword({ current: '', new: '', confirm: '' });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const newAvatar = event.target?.result as string;
        setProfile(prev => ({ ...prev, avatar: newAvatar }));
        try {
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
              displayName: profile.name,
              photoURL: newAvatar,
            });
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
              displayName: profile.name,
              email: profile.email,
              photoURL: newAvatar,
            }, { merge: true });
          }
          await updateUser({
            displayName: profile.name,
            email: profile.email,
            photoURL: newAvatar,
          });
          showToast('Avatar updated successfully!', 'success');
        } catch (error) {
          showToast('Failed to update avatar. Please try again.', 'error');
        } finally {
          setAvatarLoading(false);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Go back to Dashboard"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        {/* Cover image */}
        <div className="relative h-36 md:h-48 w-full rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-400 to-pink-400 shadow-2xl mb-12 flex items-end overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="absolute left-1/2 md:left-12 bottom-[-56px] md:bottom-[-64px] z-10 transform -translate-x-1/2 md:translate-x-0">
            <div className="relative">
              <Avatar src={profile.avatar || user?.photoURL} name={profile.name} size={112} className="ring-4 ring-white dark:ring-slate-900 shadow-xl" />
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow-lg transition-all duration-200 hover:scale-110" title="Upload new avatar">
                <FiCamera size={16} />
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full mt-16 md:mt-12">
          {/* Left: Profile Card & Tabs */}
          <div className="w-full lg:w-2/3">
            <Card className="p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">{profile.name}</h2>
                <p className="text-base text-slate-500 dark:text-slate-400 mb-3 font-semibold flex items-center justify-center lg:justify-start gap-2">
                  <FiMail className="w-4 h-4" />
                  {profile.email}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex flex-col sm:flex-row border-b border-blue-100 dark:border-blue-900 mb-8 gap-2 sm:gap-0">
                <button 
                  onClick={() => setActiveTab('personal')} 
                  className={`flex items-center gap-2 w-full sm:w-auto px-6 py-3 font-semibold rounded-t-xl sm:rounded-t-none sm:rounded-l-xl text-lg transition-all duration-200 ${
                    activeTab === 'personal' 
                      ? 'text-blue-700 dark:text-orange-300 border-b-2 border-blue-600 dark:border-orange-400 bg-blue-50 dark:bg-blue-900/50' 
                      : 'text-blue-700 dark:text-orange-300 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <FiUser className="w-4 h-4" />
                  Personal Info
                </button>
                <button 
                  onClick={() => setActiveTab('security')} 
                  className={`flex items-center gap-2 w-full sm:w-auto px-6 py-3 font-semibold rounded-t-xl sm:rounded-t-none sm:rounded-l-xl text-lg transition-all duration-200 ${
                    activeTab === 'security' 
                      ? 'text-blue-700 dark:text-orange-300 border-b-2 border-blue-600 dark:border-orange-400 bg-blue-50 dark:bg-blue-900/50' 
                      : 'text-blue-700 dark:text-orange-300 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <FiLock className="w-4 h-4" />
                  Security
                </button>
              </div>

              {/* Tab content */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <Input label="Display Name" name="name" value={profile.name} onChange={handleUserChange} leftIcon={<FiUser className="w-4 h-4" />} />
                  <Input label="Email Address" name="email" type="email" value={profile.email} onChange={handleUserChange} leftIcon={<FiMail className="w-4 h-4" />} />
                  <Button 
                    variant="primary" 
                    onClick={handleUpdateProfile} 
                    disabled={loading || avatarLoading}
                    className="flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Update Profile'}
                  </Button>
                </div>
              )}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <Input label="Current Password" name="current" type="password" value={password.current} onChange={handlePasswordChange} leftIcon={<FiLock className="w-4 h-4" />} />
                  <Input label="New Password" name="new" type="password" value={password.new} onChange={handlePasswordChange} leftIcon={<FiLock className="w-4 h-4" />} />
                  <Input label="Confirm New Password" name="confirm" type="password" value={password.confirm} onChange={handlePasswordChange} leftIcon={<FiLock className="w-4 h-4" />} />
                  <Button variant="primary" onClick={handleUpdatePassword} className="flex items-center gap-2">
                    <FiLock className="w-4 h-4" />
                    Update Password
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Recent Activity/Badges */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <Card className="p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <FiActivity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h4>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Logged in
                </li>
                <li className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Updated profile
                </li>
                <li className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Generated a story
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-0 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <FiAward className="text-yellow-500 w-6 h-6" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Pro Writer</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">For generating 10+ stories</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FiStar className="w-4 h-4 text-yellow-500" />
                <span>Unlocked achievement</span>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-0 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <FiStar className="text-purple-500 w-6 h-6" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">AI Explorer</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Used AI features 5+ times</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FiStar className="w-4 h-4 text-purple-500" />
                <span>Unlocked achievement</span>
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

export default Profile; 