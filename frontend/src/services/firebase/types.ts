// Firebase-related types and interfaces

// User data interface for Firestore
export interface UserData {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    contactNum: string;
    studentId: string;
    profilePicture?: string;
    profileImageUrl?: string; // Added to support mobile app field name
    role?: 'user' | 'admin' | 'campus_security'; // User role for access control
    status?: 'active' | 'banned'; // User account status
    banInfo?: any; // Ban information
    createdAt: any;
    updatedAt: any;
}
