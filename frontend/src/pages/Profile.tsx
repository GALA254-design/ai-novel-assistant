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
import { auth, db, storage } from '../firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Utility to resize and compress image
async function resizeAndCompressImage(file: File, maxSize = 256, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height *= maxSize / width));
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width *= maxSize / height));
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Image compression failed'));
        },
        'image/jpeg',
        quality
      );
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showToast('Image is too large (max 2MB).', 'error');
        return;
      }
      setAvatarLoading(true);
      try {
        // Resize and compress image before upload
        const compressedBlob = await resizeAndCompressImage(file, 256, 0.7);
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
        // Upload to Firebase Storage
        const storageRef = ref(storage, `avatars/${user.uid}/${compressedFile.name}`);
        await uploadBytes(storageRef, compressedFile);
        const downloadURL = await getDownloadURL(storageRef);
        setProfile(prev => ({ ...prev, avatar: downloadURL }));
        // Update Auth and Firestore
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: profile.name,
            photoURL: downloadURL,
          });
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            displayName: profile.name,
            email: profile.email,
            photoURL: downloadURL,
          }, { merge: true });
        }
        await updateUser({
          displayName: profile.name,
          email: profile.email,
          photoURL: downloadURL,
        });
        showToast('Avatar updated successfully!', 'success');
      } catch (error) {
        showToast('Failed to upload avatar. Please try again.', 'error');
      } finally {
        setAvatarLoading(false);
      }
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
        {/* Avatar display (no camera/edit) */}
        <div className="flex flex-col items-center mb-6">
          <Avatar src={profile.avatar || user?.photoURL} name={profile.name} size={112} className="ring-4 ring-white dark:ring-slate-900 shadow-xl" />
        </div>
        {/* Cover image */}
        {/* Removed avatar/profile picture and upload button */}

        {/* Center the card under the avatar on all screen sizes */}
        <div className="flex flex-col items-center w-full mt-16 md:mt-12">
          {/* Profile Card & Tabs */}
          <div className="w-full max-w-2xl">
            <Card className="p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border-0 animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">{profile.name}</h2>
                <p className="text-base text-slate-500 dark:text-slate-400 mb-3 font-semibold flex items-center justify-center gap-2">
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
                {/* Removed Security tab */}
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
              {/* Removed Security tab content */}
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