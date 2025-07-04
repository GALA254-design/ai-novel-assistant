import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { NavLink, useLocation } from 'react-router-dom';
import { FiMenu, FiHome, FiEdit, FiUser, FiLogOut, FiBell, FiSettings, FiPlus, FiSearch, FiZap, FiBarChart2, FiInfo } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Avatar from './ui/Avatar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Dashboard', icon: FiHome, to: '/dashboard' },
    { name: 'Story Editor', icon: FiEdit, to: '/editor' },
    ...(user ? [
      { name: 'Profile', icon: FiUser, to: '/profile' },
      { name: 'Settings', icon: FiSettings, to: '/settings' },
      { name: 'Agents', icon: FiZap, to: '/agents' },
      { name: 'Analytics', icon: FiBarChart2, to: '/analytics' },
      { name: 'Help', icon: FiInfo, to: '/help' },
    ] : []),
    { name: 'Feedback', icon: FiBell, to: '/feedback' },
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const [showWelcome, setShowWelcome] = useState(
    () => isDashboard && sessionStorage.getItem('ai-novel-welcome') !== 'dismissed'
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-screen min-h-screen flex flex-col bg-gradient-to-br from-[#1a2236] via-[#232946] to-[#121826] dark:from-[#181c2a] dark:via-[#232946] dark:to-[#121826] transition-all duration-300 overflow-x-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 w-full flex items-center justify-between px-2 py-2 bg-white/80 dark:bg-[#232946]/80 backdrop-blur-md shadow-lg border-b border-blue-100 dark:border-blue-900 transition-all duration-300">
        <div className="flex items-center gap-2 w-full">
          {/* Hamburger for mobile */}
          <button
            className="md:hidden p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent bg-blue-700/80 dark:bg-blue-800/80 text-white shadow"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <FiMenu size={24} />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 flex-1">
            <h1 className="text-lg font-bold font-heading tracking-tight text-[#232946] dark:text-white whitespace-nowrap">AI-NOVEL CRAFTER</h1>
            <span className="ml-0 sm:ml-1 mt-1 sm:mt-0 px-2 py-0.5 text-xs rounded-xl font-semibold bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow sm:inline block text-center w-fit">Beta</span>
          </div>
          <div className="flex-1" />
          {user && (
            <NavLink
              to="/profile"
              className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-blue-200 dark:border-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent bg-white dark:bg-blue-900 ml-2"
              aria-label="Profile"
              style={{ padding: 0 }}
            >
              <Avatar src={user.photoURL} name={user.displayName} size={32} />
            </NavLink>
          )}
          {!user && (
            <div className="hidden sm:flex items-center gap-1">
              <NavLink to="/login" className="px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-white hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">Log In</NavLink>
              <NavLink to="/register" className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow">Sign Up</NavLink>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar for desktop and mobile drawer */}
      <div className="flex flex-1 w-screen">
        {/* Desktop sidebar */}
        <aside className={`hidden md:flex flex-col h-[calc(100vh-72px)] sticky top-[72px] z-20 ${sidebarCollapsed ? 'w-20' : 'w-60'} border-r border-blue-100 dark:border-blue-900 bg-white/80 dark:bg-[#232946]/80 backdrop-blur-lg shadow-2xl transition-all duration-300`} aria-label="Sidebar">
          {/* User info at top */}
          {user && (
            <div className={`flex flex-col items-center py-6 transition-all duration-300 ${sidebarCollapsed ? 'py-2' : ''}`}>
              <Avatar src={user.photoURL} name={user.displayName} size={sidebarCollapsed ? 32 : 48} />
              {!sidebarCollapsed && <span className="mt-2 text-sm font-semibold text-blue-900 dark:text-blue-100">{user.displayName}</span>}
            </div>
          )}
          <button
            className="mb-2 mx-auto p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            tabIndex={0}
          >
            <FiMenu size={24} />
          </button>
          {/* Make nav and logout scrollable if needed */}
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
            <nav className="flex flex-col gap-2 mt-2 flex-1" role="navigation" aria-label="Sidebar">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-5 py-3 rounded-xl font-medium hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900 dark:hover:to-blue-800 transition-all duration-200 group ${sidebarCollapsed ? 'justify-center px-2' : ''} ${isActive ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg dark:from-blue-700 dark:to-blue-500' : 'text-blue-900 dark:text-blue-100'}`
                    }
                    title={link.name}
                    aria-label={link.name}
                    tabIndex={0}
                  >
                    <span className="text-xl"><Icon size={20} /></span>
                    <span className={`transition-all duration-200 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>{link.name}</span>
                  </NavLink>
                );
              })}
            </nav>
            {/* Logout at bottom, always visible */}
            {user && (
              <div className="mt-auto pb-6 px-2">
                <button
                  onClick={logout}
                  className={`w-full flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <FiLogOut size={20} />
                  <span className={`${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>Logout</span>
                </button>
              </div>
            )}
          </div>
        </aside>
        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar overlay" />
            <aside className="relative w-64 max-w-full h-full bg-white/90 dark:bg-[#232946]/90 border-r border-blue-100 dark:border-blue-900 shadow-2xl p-0 flex flex-col transition-transform duration-300 rounded-r-xl overflow-y-auto">
              {/* User info at top for mobile */}
              {user && (
                <div className="flex flex-col items-center py-6 border-b border-blue-100 dark:border-blue-900 bg-white/80 dark:bg-[#232946]/80">
                  <Avatar src={user.photoURL} name={user.displayName} size={56} />
                  <span className="mt-2 text-base font-semibold text-blue-900 dark:text-blue-100">{user.displayName}</span>
                </div>
              )}
              <button
                className="absolute top-4 right-4 p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <nav className="flex flex-col gap-2 mt-8">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.name}
                      to={link.to}
                      className={({ isActive }: { isActive: boolean }) =>
                        `flex items-center gap-3 px-5 py-3 rounded-xl font-medium hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900 dark:hover:to-blue-800 transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg dark:from-blue-700 dark:to-blue-500' : 'text-blue-900 dark:text-blue-100'}`
                      }
                      title={link.name}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="text-xl"><Icon size={22} /></span>
                      <span className="text-base">{link.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}
        {/* Main content area */}
        <main className="flex-1 w-full p-0 sm:p-0 md:p-0 flex flex-col gap-8 transition-all duration-300 min-h-[calc(100vh-72px)]">
          {/* Main content card */}
          <div className="w-full flex flex-col gap-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
      {/* Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 dark:bg-[#232946]/90 border-t border-blue-100 dark:border-blue-900 flex justify-around items-center h-16 shadow-2xl backdrop-blur-lg">
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full ${isActive ? 'text-blue-600 dark:text-orange-400' : 'text-blue-900 dark:text-blue-100'}` }>
          <FiHome size={26} />
          <span className="text-xs">Home</span>
        </NavLink>
        <NavLink to="/editor" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full ${isActive ? 'text-blue-600 dark:text-orange-400' : 'text-blue-900 dark:text-blue-100'}` }>
          <FiEdit size={26} />
          <span className="text-xs">Editor</span>
        </NavLink>
        <NavLink to="/profile"
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full ${isActive ? 'text-blue-600 dark:text-orange-400' : 'text-blue-900 dark:text-blue-100'}`}
        >
          {({ isActive }) => (
            <>
              {user ? (
                <span className={`rounded-full border-2 ${isActive ? 'border-blue-600 dark:border-orange-400' : 'border-blue-200 dark:border-blue-800'} p-0.5`}>
                  <Avatar src={user.photoURL} name={user.displayName} size={32} />
                </span>
              ) : (
                <FiUser size={26} />
              )}
              <span className="text-xs">Profile</span>
            </>
          )}
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full ${isActive ? 'text-blue-600 dark:text-orange-400' : 'text-blue-900 dark:text-blue-100'}` }>
          <FiSettings size={26} />
          <span className="text-xs">Settings</span>
        </NavLink>
        <NavLink to="/agents" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full ${isActive ? 'text-blue-600 dark:text-orange-400' : 'text-blue-900 dark:text-blue-100'}` }>
          <FiZap size={26} />
          <span className="text-xs">Agents</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full ${isActive ? 'text-blue-600 dark:text-orange-400' : 'text-blue-900 dark:text-blue-100'}` }>
          <FiBarChart2 size={26} />
          <span className="text-xs">Analytics</span>
        </NavLink>
        <NavLink to="/help" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full ${isActive ? 'text-blue-600 dark:text-orange-400' : 'text-blue-900 dark:text-blue-100'}` }>
          <FiInfo size={26} />
          <span className="text-xs">Help</span>
        </NavLink>
        <NavLink to="/feedback" className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full ${isActive ? 'text-blue-600 dark:text-orange-400' : 'text-blue-900 dark:text-blue-100'}` }>
          <FiBell size={26} />
          <span className="text-xs">Feedback</span>
        </NavLink>
      </nav>
      {/* Footer */}
      <footer className="w-screen py-4 px-8 bg-white/80 dark:bg-[#232946]/80 border-t border-blue-100 dark:border-blue-900 text-center text-xs text-blue-900 dark:text-blue-100 transition-all duration-300">
        &copy; {new Date().getFullYear()} AI Novel Assistant. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout; 