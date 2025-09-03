// Authentication service for Firebase
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendEmailVerification,
    type User as FirebaseUser,
    type UserCredential
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';

// Import Firebase instances and types
import { auth, db } from './config';
import type { UserData } from './types';

// Auth utility functions
export const authService = {
    // Register new user
    async register(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        contactNum: string,
        studentId: string
    ): Promise<{ user: FirebaseUser; userData: UserData }> {
        try {
            // Create user with email and password
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // Update user profile with display name
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });

            // Create user document in Firestore
            const userData: UserData = {
                uid: user.uid,
                email: user.email!,
                firstName,
                lastName,
                contactNum,
                studentId,
                profilePicture: '/src/assets/empty_profile.jpg', // Set default profile picture
                status: 'active', // Set default status to active - CRITICAL for permissions
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Ensure the status field is explicitly set to prevent permission issues
            if (!userData.status) {
                userData.status = 'active';
            }

            await setDoc(doc(db, 'users', user.uid), userData);

            return { user, userData };
        } catch (error: any) {
            throw new Error(error.message || 'Registration failed');
        }
    },

    // Login user
    async login(email: string, password: string): Promise<FirebaseUser> {
        try {
            const userCredential: UserCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            return userCredential.user;
        } catch (error: any) {
            throw new Error(error.message || 'Login failed');
        }
    },

    // Logout user
    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error: any) {
            throw new Error(error.message || 'Logout failed');
        }
    },

    // Get user data from Firestore
    async getUserData(uid: string): Promise<UserData | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.exists() ? userDoc.data() as UserData : null;
        } catch (error: any) {
            console.error('Error fetching user data:', error);
            return null;
        }
    },

    // Update user data in Firestore
    async updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
        try {
            await setDoc(doc(db, 'users', uid), {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to update user data');
        }
    },

    // Get current authenticated user
    getCurrentUser(): FirebaseUser | null {
        return auth.currentUser;
    },

    // Check if user is admin
    async isAdmin(uid: string): Promise<boolean> {
        try {
            const userData = await this.getUserData(uid);
            return userData?.role === 'admin';
        } catch (error: any) {
            console.error('Error checking admin status:', error);
            return false;
        }
    },

    // Create admin user (for initial setup)
    async createAdminUser(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        contactNum: string,
        studentId: string
    ): Promise<{ user: FirebaseUser; userData: UserData }> {
        try {
            // Create user with email and password
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // Update user profile with display name
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });

            // Create admin user document in Firestore
            const userData: UserData = {
                uid: user.uid,
                email: user.email!,
                firstName,
                lastName,
                contactNum,
                studentId,
                role: 'admin', // Set as admin
                status: 'active', // Ensure admin users also have active status
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Ensure the status field is explicitly set to prevent permission issues
            if (!userData.status) {
                userData.status = 'active';
            }

            await setDoc(doc(db, 'users', user.uid), userData);

            return { user, userData };
        } catch (error: any) {
            throw new Error(error.message || 'Admin user creation failed');
        }
    },

    // Create campus security user (for campus security access)
    async createCampusSecurityUser(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        contactNum: string,
        studentId: string
    ): Promise<{ user: FirebaseUser; userData: UserData }> {
        try {
            // Create user with email and password
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // Update user profile with display name
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });

            // Create campus security user document in Firestore
            const userData: UserData = {
                uid: user.uid,
                email: user.email!,
                firstName,
                lastName,
                contactNum,
                studentId,
                role: 'campus_security', // Set as campus security
                status: 'active', // Ensure campus security users also have active status
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Ensure the status field is explicitly set to prevent permission issues
            if (!userData.status) {
                userData.status = 'active';
            }

            await setDoc(doc(db, 'users', user.uid), userData);

            return { user, userData };
        } catch (error: any) {
            throw new Error(error.message || 'Campus security user creation failed');
        }
    },

    // Force email verification (for development)
    async forceEmailVerification(email: string, password: string): Promise<void> {
        try {
            // Sign in to get the user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Force email verification
            if (!user.emailVerified) {
                // This will send a verification email
                await sendEmailVerification(user);
                console.log('Verification email sent to:', email);
            }

            // Sign out after sending verification
            await signOut(auth);
        } catch (error: any) {
            throw new Error(error.message || 'Failed to send verification email');
        }
    }
};
