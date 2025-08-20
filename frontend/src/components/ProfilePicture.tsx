import React from 'react';
import { DEFAULT_PROFILE_PICTURE } from '@/types/User';

interface ProfilePictureProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackSrc = DEFAULT_PROFILE_PICTURE,
  priority = false
}) => {
  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
    '3xl': 'w-24 h-24',
    '4xl': 'w-32 h-32',
    '5xl': 'w-40 h-40'
  };

  // Just show the image directly - no loading states, no complications
  const imageSrc = src || fallbackSrc;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 ${className}`}
      loading={priority ? "eager" : "lazy"}
      onError={(e) => {
        // If image fails, fallback to default
        const target = e.target as HTMLImageElement;
        target.src = fallbackSrc;
      }}
    />
  );
};

export default ProfilePicture;
