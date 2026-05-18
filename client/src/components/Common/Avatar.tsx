import React from 'react';
import { User } from '../../types';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-semibold`}>
      {user.avatar || `${user.name.charAt(0)}${user.name.split(' ')[1]?.charAt(0) || ''}`}
    </div>
  );
};

export default Avatar;