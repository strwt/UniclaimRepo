// Default profile picture for users without a custom image
export const DEFAULT_PROFILE_PICTURE = '/src/assets/empty_profile.jpg';

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNum: string;
  studentId: string;
  profilePicture?: string;
  profileImageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  status?: 'active' | 'banned';
  banInfo?: any;
  role?: 'user' | 'admin';
  emailVerified?: boolean; // Email verification status
}

// Re-export UserData from firebase utils for consistency
export type { UserData } from '../utils/firebase';
