import React, { useState } from 'react';
import { DEFAULT_PROFILE_PICTURE } from '@/types/User';

interface ProfilePictureProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  fallbackSrc?: string;
  priority?: boolean; // For important images that should load immediately
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackSrc = DEFAULT_PROFILE_PICTURE,
  priority = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

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

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const imageSrc = imageError || !src ? fallbackSrc : src;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {imageLoading && (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse flex items-center justify-center`}>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 transition-opacity duration-200 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: imageLoading ? 'none' : 'block' }}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
};

export default ProfilePicture;
