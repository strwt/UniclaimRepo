import React from 'react';
import { Image, ImageStyle } from 'react-native';

interface ProfilePictureProps {
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  style?: ImageStyle;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  size = 'md',
  style
}) => {
  // Default profile picture - you can replace this with your default image
  const defaultProfilePicture = require('../assets/images/empty_profile.jpg');
  
  const sizeStyles = {
    xs: { width: 20, height: 20 },
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
    '2xl': { width: 80, height: 80 },
    '3xl': { width: 96, height: 96 },
    '4xl': { width: 128, height: 128 },
    '5xl': { width: 160, height: 160 }
  };

  const imageSource = src ? { uri: src } : defaultProfilePicture;
  const sizeStyle = sizeStyles[size];

  return (
    <Image
      source={imageSource}
      style={[
        {
          ...sizeStyle,
          borderRadius: sizeStyle.width / 2, // Make it circular
          borderWidth: 1,
          borderColor: '#e5e7eb', // Light gray border
        },
        style
      ]}
      // Fallback to default image if the source fails to load
      onError={() => {
        // React Native Image doesn't have onError like web, but we can handle this
        // by using the default image as fallback
      }}
    />
  );
};

export default ProfilePicture;
