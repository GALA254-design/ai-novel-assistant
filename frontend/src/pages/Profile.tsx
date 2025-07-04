import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { FiEdit2, FiAward } from 'react-icons/fi';
import { auth, db } from '../firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    bio: '', // Will be loaded from Firestore if needed
    avatar: user?.photoURL || '',
    theme: 'auto',
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
  const profileCompletion = 80; // Example completion percentage
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Sync local profile state with user on mount and when user changes
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      let bio = '';
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          bio = snap.data().bio || '';
        }
      }
      if (isMounted) {
        setProfile({
          name: user?.displayName || '',
          email: user?.email || '',
          bio,
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
      <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
        <div className="w-full mx-auto p-4 md:p-8 md:max-w-4xl flex flex-col items-center justify-center">
          <div className="container mx-auto p-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Join Us!</h1>
            <p className="mb-8 text-lg">Create an account to manage your profile and stories.</p>
            <div className="flex justify-center gap-4">
              <NavLink to="/register" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Sign Up
              </NavLink>
              <NavLink to="/login" className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300">
                Log In
              </NavLink>
            </div>
          </div>
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
          bio: profile.bio,
          photoURL: profile.avatar,
        }, { merge: true });
      }
      // Update AuthContext for instant UI reflection
      await updateUser({
        displayName: profile.name,
        email: profile.email,
        photoURL: profile.avatar,
      });
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
              bio: profile.bio,
              photoURL: newAvatar,
            }, { merge: true });
          }
          await updateUser({
            displayName: profile.name,
            email: profile.email,
            photoURL: newAvatar,
          });
        } finally {
          setAvatarLoading(false);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826]">
      <div className="w-full mx-auto p-4 md:p-8 md:max-w-4xl">
        {/* Cover image */}
        <div className="relative h-32 md:h-40 w-full rounded-2xl bg-gradient-to-r from-blue-400 to-pink-400 mb-8 flex items-end">
          <div className="absolute left-8 bottom-[-48px] md:bottom-[-56px] z-10">
            <div className="relative">
              <Avatar src={profile.avatar || user?.photoURL} name={profile.name} size={96} />
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition" title="Upload new avatar">
                <FiEdit2 />
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8 w-full mt-12">
          {/* Left: Profile Card & Tabs */}
          <div className="w-full md:w-2/3">
            <Card className="p-6 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{profile.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{profile.email}</p>
              <div className="mb-4 text-gray-600 dark:text-gray-300">{profile.bio}</div>
              {/* Profile completion bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-700 dark:text-orange-300">Profile Completion</span>
                  <span className="text-xs font-semibold text-blue-700 dark:text-orange-300">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2">
                  <div className="bg-blue-600 dark:bg-orange-400 h-2 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
                </div>
              </div>
              {/* Tabs */}
              <div className="flex border-b border-blue-100 dark:border-blue-900 mb-4">
                <button onClick={() => setActiveTab('personal')} className={`px-4 py-2 font-semibold ${activeTab === 'personal' ? 'text-blue-700 dark:text-orange-300 border-b-2 border-blue-600 dark:border-orange-400' : 'text-blue-700 dark:text-orange-300'}`}>Personal Info</button>
                <button onClick={() => setActiveTab('security')} className={`px-4 py-2 font-semibold ${activeTab === 'security' ? 'text-blue-700 dark:text-orange-300 border-b-2 border-blue-600 dark:border-orange-400' : 'text-blue-700 dark:text-orange-300'}`}>Security</button>
              </div>
              {/* Tab content */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <Input label="Display Name" name="name" value={profile.name} onChange={handleUserChange} />
                  <Input label="Email Address" name="email" type="email" value={profile.email} onChange={handleUserChange} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Bio</label>
                    <textarea name="bio" value={profile.bio} onChange={handleUserChange} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-orange-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  </div>
                  <Button variant="primary" onClick={handleUpdateProfile} disabled={loading || avatarLoading}>{(loading || avatarLoading) ? 'Saving...' : 'Update Profile'}</Button>
                </div>
              )}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <Input label="Current Password" name="current" type="password" value={password.current} onChange={handlePasswordChange} />
                  <Input label="New Password" name="new" type="password" value={password.new} onChange={handlePasswordChange} />
                  <Input label="Confirm New Password" name="confirm" type="password" value={password.confirm} onChange={handlePasswordChange} />
                  <Button variant="primary" onClick={handleUpdatePassword}>Update Password</Button>
                </div>
              )}
            </Card>
          </div>
          {/* Right: Recent Activity/Badges */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <Card className="p-4">
              <h4 className="font-bold mb-2">Recent Activity</h4>
              <ul className="space-y-2 text-blue-900 dark:text-blue-100">
                <li>Logged in</li>
                <li>Updated profile</li>
                <li>Generated a story</li>
              </ul>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <FiAward className="text-yellow-400 w-6 h-6" />
              <div>
                <div className="font-bold">Badge: Pro Writer</div>
                <div className="text-xs text-gray-500">For generating 10+ stories</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 