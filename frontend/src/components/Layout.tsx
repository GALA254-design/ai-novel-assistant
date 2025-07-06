import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { FiMenu, FiHome, FiEdit, FiUser, FiLogOut, FiBell, FiSettings, FiPlus, FiSearch, FiZap, FiBarChart2, FiInfo, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Avatar from './ui/Avatar';

const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Dashboard', icon: FiHome, to: '/dashboard' },
    { name: 'Story Editor', icon: FiEdit, to: '/editor' },
    ...(user ? [
      { name: 'Profile', icon: FiUser, to: '/profile' },
      { name: 'Settings', icon: FiSettings, to: '/settings' },
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
    <div className="w-screen min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 overflow-x-hidden">
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-40 w-full flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50 dark:border-slate-700/50 transition-all duration-300">
        <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
          {/* Hamburger for mobile */}
          <button
            className="md:hidden p-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <FiMenu size={20} />
          </button>
          
          {/* Logo and Brand */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1">
            <h1 className="text-xl font-bold font-heading tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent whitespace-nowrap">
              AI Novel Crafter
            </h1>
            <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white shadow-lg rounded-full sm:inline block text-center w-fit">
              Beta
            </span>
          </div>
          
          <div className="flex-1" />
          
          {/* User Actions */}
          {user && (
            <NavLink
              to="/profile"
              className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-white dark:bg-slate-800 ml-2 shadow-md hover:shadow-lg transition-all duration-200"
              aria-label="Profile"
            >
              <Avatar src={user.photoURL} name={user.displayName} size={36} />
            </NavLink>
          )}
          
          {!user && (
            <div className="hidden sm:flex items-center gap-2">
              <NavLink 
                to="/login" 
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Log In
              </NavLink>
              <NavLink 
                to="/register" 
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </header>

      {/* Premium Sidebar for desktop and mobile drawer */}
      <div className="flex flex-1 w-full">
        {/* Desktop sidebar */}
        <aside className={`hidden md:flex flex-col h-[calc(100vh-80px)] sticky top-[80px] z-30 ${sidebarCollapsed ? 'w-20' : 'w-64'} border-r border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl transition-all duration-300`} aria-label="Sidebar">
          {/* User info at top */}
          {user && (
            <div className={`flex flex-col items-center py-6 transition-all duration-300 ${sidebarCollapsed ? 'py-4' : ''}`}>
              <div className={`${sidebarCollapsed ? 'w-12 h-12' : 'w-16 h-16'} rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden`}>
                <Avatar src={user.photoURL} name={user.displayName} size={sidebarCollapsed ? 48 : 64} />
              </div>
              {!sidebarCollapsed && (
                <span className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100 text-center px-2">
                  {user.displayName}
                </span>
              )}
            </div>
          )}
          
          {/* Collapse Toggle */}
          <button
            className="mb-4 mx-auto p-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FiMenu size={18} />
          </button>
          
          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0 px-3">
            <nav className="flex flex-col gap-1 flex-1" role="navigation" aria-label="Sidebar">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${sidebarCollapsed ? 'justify-center px-2' : ''} ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                    title={link.name}
                    aria-label={link.name}
                  >
                    <span className="text-lg"><Icon size={20} /></span>
                    <span className={`transition-all duration-200 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                      {link.name}
                    </span>
                  </NavLink>
                );
              })}
            </nav>
            
            {/* Logout at bottom */}
            {user && (
              <div className="mt-auto pb-6 px-1">
                <button
                  onClick={logout}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <FiLogOut size={20} />
                  <span className={`${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                    Logout
                  </span>
                </button>
              </div>
            )}
          </div>
        </aside>
        
        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setSidebarOpen(false)} 
              aria-label="Close sidebar overlay" 
            />
            <aside className="relative w-72 max-w-full h-full bg-white/95 dark:bg-slate-900/95 border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl p-0 flex flex-col transition-transform duration-300 rounded-r-2xl overflow-y-auto backdrop-blur-xl">
              {/* User info at top for mobile */}
              {user && (
                <div className="flex flex-col items-center py-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                  <div className="w-20 h-20 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                    <Avatar src={user.photoURL} name={user.displayName} size={80} />
                  </div>
                  <span className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {user.displayName}
                  </span>
                </div>
              )}
              
              {/* Close button */}
              <button
                className="absolute top-4 right-4 p-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <FiX size={20} />
              </button>
              
              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-1 mt-8 px-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.name}
                      to={link.to}
                      className={({ isActive }: { isActive: boolean }) =>
                        `flex items-center gap-4 px-4 py-4 rounded-xl font-medium transition-all duration-200 ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`
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
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6 transition-all duration-300 min-h-[calc(100vh-80px)]">
          <div className="w-full flex flex-col gap-6 min-h-full flex-1 min-w-0 md:max-w-[calc(100vw-256px)]">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Premium Bottom Navigation Bar for Mobile (now with 4 icons) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-around items-center h-20 shadow-2xl backdrop-blur-xl px-4 gap-2">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
            isActive 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FiHome size={28} />
          <span className="text-sm font-semibold mt-1">Home</span>
        </NavLink>
        <NavLink 
          to="/editor" 
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
            isActive 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FiEdit size={28} />
          <span className="text-sm font-semibold mt-1">Editor</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
            isActive 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FiSettings size={28} />
          <span className="text-sm font-semibold mt-1">Settings</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 ${
            isActive 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {({ isActive }) => (
            <>
              {user ? (
                <div className={`rounded-xl border-2 p-0.5 transition-all duration-200 ${
                  isActive 
                    ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <Avatar src={user.photoURL} name={user.displayName} size={32} />
                </div>
              ) : (
                <FiUser size={28} />
              )}
              <span className="text-sm font-semibold mt-1">Profile</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* Floating Action Button (FAB) for New Story - Mobile Only */}
      <button
        onClick={() => window.location.href = '/new-story'}
        className="fixed z-50 bottom-14 left-1/2 -translate-x-1/2 md:hidden bg-white/95 dark:bg-slate-900/95 text-blue-600 dark:text-blue-400 rounded-full w-16 h-16 flex items-center justify-center border-4 border-blue-100 dark:border-slate-800 shadow-2xl transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-800"
        aria-label="New Story"
        style={{ boxShadow: '0 8px 24px 0 rgba(31, 41, 55, 0.18)' }}
      >
        <FiPlus className="w-10 h-10 font-bold" />
      </button>
      
      {/* Premium Footer */}
      <footer className="w-screen py-6 px-8 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/50 dark:border-slate-700/50 text-center text-sm text-slate-600 dark:text-slate-400 transition-all duration-300 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          &copy; {new Date().getFullYear()} AI Novel Assistant. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout; 