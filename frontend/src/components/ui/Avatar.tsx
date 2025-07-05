import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  status?: 'online' | 'offline' | 'away' | 'busy';
  name?: string;
  loading?: boolean;
  className?: string;
}

// Premium Avatar component with fallback, status indicator, and modern styling
const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = 'User avatar', 
  size = 40, 
  status, 
  loading = false, 
  name,
  className = ''
}) => {
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const initials = name ? getInitials(name) : '';
  
  // Generate gradient background based on name
  const getGradient = (name: string) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-green-500 to-emerald-600',
      'from-orange-500 to-red-600',
      'from-teal-500 to-cyan-600',
      'from-violet-500 to-purple-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-slate-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusSize = size <= 32 ? 'sm' : size <= 48 ? 'md' : 'lg';

  return (
    <div 
      className={`relative inline-block rounded-full overflow-hidden shadow-lg border-2 border-white/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ${className}`} 
      style={{ width: size, height: size }}
      aria-label={name ? `Avatar for ${name}` : alt}
    >
      {loading ? (
        <div className="flex items-center justify-center w-full h-full bg-slate-100 dark:bg-slate-700">
          <svg 
            className="animate-spin text-slate-400" 
            width={size/3} 
            height={size/3} 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
      ) : src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      
      {/* Fallback with initials or default icon */}
      {(!src || loading === false) && (
        <div 
          className={`w-full h-full flex items-center justify-center font-bold text-white ${
            initials 
              ? `bg-gradient-to-br ${getGradient(name || 'User')}` 
              : 'bg-gradient-to-br from-slate-400 to-slate-600'
          }`}
          style={{ fontSize: Math.max(size * 0.4, 12) }}
        >
          {initials || (
            <svg 
              className="w-1/2 h-1/2" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>
      )}
      
      {/* Status indicator */}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-800
            ${statusColors[status]} ${statusSizes[statusSize]}
            ${status === 'online' ? 'animate-pulse' : ''}
          `}
          title={`Status: ${status}`}
          aria-label={`User is ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar; 