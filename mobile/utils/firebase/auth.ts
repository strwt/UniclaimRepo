// Authentication service for user management
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    UserCredential
} from 'firebase/auth';
import { auth, db } from './config';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    limit,
    getDocs
} from 'firebase/firestore';

// User data interface for Firestore
export interface UserData {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    contactNum: string;
    studentId: string;
    profilePicture?: string;
    profileImageUrl?: string;
    role?: 'user' | 'admin' | 'campus_security';
    status?: 'active' | 'banned';
    banInfo?: any;
    createdAt: any;
    updatedAt: any;
}

// Authentication service
export const authService = {
    // Register new user
    async register(email: string, password: string, userData: Partial<UserData>): Promise<UserCredential> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with additional user data
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: `${userData.firstName} ${userData.lastName}`
                });
            }

            return userCredential;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to register user');
        }
    },

    // Sign in user
    async login(email: string, password: string): Promise<UserCredential> {
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            throw new Error(error.message || 'Failed to sign in');
        }
    },

    // Sign out user
    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error: any) {
            throw new Error(error.message || 'Failed to sign out');
        }
    },

    // Send password reset email
    async sendPasswordResetEmail(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            // Handle specific Firebase auth errors
            let errorMessage = 'Failed to send password reset email';

            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address format';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many requests. Please try again later';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your internet connection';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid credentials provided';
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }

            throw new Error(errorMessage);
        }
    },

    // Get user data by ID
    async getUserData(userId: string): Promise<UserData | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data() as UserData;
            }
            return null;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get user data');
        }
    }
};

// User data service for Firestore operations
export const userService = {
    // Create user document in Firestore
    async createUser(userId: string, userData: UserData): Promise<void> {
        try {
            await setDoc(doc(db, 'users', userId), {
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create user document');
        }
    },

    // Get user data by ID
    async getUserData(userId: string): Promise<UserData | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data() as UserData;
            }
            return null;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get user data');
        }
    },

    // Update user data
    async updateUserData(userId: string, updates: Partial<UserData>): Promise<void> {
        try {
            await updateDoc(doc(db, 'users', userId), {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to update user data');
        }
    },

    // Get Campus Security user from database
    async getCampusSecurityUser(): Promise<UserData | null> {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', '==', 'campus_security'), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { uid: doc.id, ...doc.data() } as UserData;
            }

            return null;
        } catch (error: any) {
            console.error('Error getting Campus Security user:', error);
            return null;
        }
    }
};
