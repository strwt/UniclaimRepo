// Firebase configuration and utilities for React Native
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User as FirebaseUser,
    UserCredential
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    where,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDocs,
    writeBatch
} from 'firebase/firestore';
// Firebase Storage removed - using Cloudinary instead
// import {
//     getStorage,
//     ref,
//     uploadBytes,
//     getDownloadURL,
//     deleteObject
// } from 'firebase/storage';

// Firebase configuration
// Create a .env file in the mobile folder with your Firebase config:
// EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
// EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
// EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
// EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
// EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
// EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCgN70CTX2wQpcgoSZF6AK0fuq7ikcQgNs",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "uniclaim2.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "uniclaim2",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "uniclaim2.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "38339063459",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:38339063459:web:3b5650ebe6fabd352b1916",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-E693CKMPSY"
};

// Initialize Firebase with duplicate check
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp(); // Use existing app
}

// Initialize auth with AsyncStorage persistence
let auth: any;
try {
    // Try to use AsyncStorage persistence if available
    const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (error) {
    // Fallback to default auth if persistence setup fails
    auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
// export const storage = getStorage(app); // Removed - using Cloudinary instead

// Import Post interface and Cloudinary service
import type { Post } from '../types/type';
import { cloudinaryService } from './cloudinary';

// User data interface for Firestore
export interface UserData {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    contactNum: string;
    studentId: string; // Required field for student ID
    profilePicture?: string; // Standardized field name to match web version
    createdAt: any;
    updatedAt: any;
}

// Helper function to extract Cloudinary public ID from URL (same as web version)
function extractCloudinaryPublicId(url: string): string | null {
    try {
        // Handle different Cloudinary URL formats
        if (url.includes('res.cloudinary.com')) {
            // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image_name.jpg
            const urlParts = url.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');

            if (uploadIndex !== -1) {
                // Get everything after 'upload' but before any version number
                let publicIdParts = urlParts.slice(uploadIndex + 1);

                // Remove version number if present (starts with 'v' followed by numbers)
                const versionIndex = publicIdParts.findIndex(part => /^v\d+$/.test(part));
                if (versionIndex !== -1) {
                    publicIdParts = publicIdParts.slice(versionIndex + 1);
                }

                // Remove file extension from the last part
                if (publicIdParts.length > 0) {
                    const lastPart = publicIdParts[publicIdParts.length - 1];
                    const extensionIndex = lastPart.lastIndexOf('.');
                    if (extensionIndex !== -1) {
                        publicIdParts[publicIdParts.length - 1] = lastPart.substring(0, extensionIndex);
                    }
                }

                const publicId = publicIdParts.join('/');
                return publicId;
            }
        } else if (url.includes('api.cloudinary.com')) {
            // Format: https://api.cloudinary.com/v1_1/cloud_name/image/upload/...
            const urlParts = url.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');

            if (uploadIndex !== -1) {
                const publicIdParts = urlParts.slice(uploadIndex + 1);
                const publicId = publicIdParts.join('/');
                return publicId;
            }
        }

        return null;

    } catch (error) {
        return null;
    }
}

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
            const userCredential: UserCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });

            const userData: UserData = {
                uid: user.uid,
                email: user.email!,
                firstName,
                lastName,
                contactNum,
                studentId,
                profilePicture: undefined, // Initialize with undefined, will be set later
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

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
            if (userDoc.exists()) {
                const userData = userDoc.data() as UserData;
                return userData;
            } else {
                return null;
            }
        } catch (error: any) {
            console.error('🔥 Firebase: Error fetching user data:', error);
            return null;
        }
    },

    // Update user data in Firestore
    async updateUserData(uid: string, updates: Partial<Omit<UserData, 'uid' | 'email' | 'createdAt'>>): Promise<void> {
        try {
            const updateData = {
                ...updates,
                updatedAt: serverTimestamp()
            };

            await updateDoc(doc(db, 'users', uid), updateData);
        } catch (error: any) {
            console.error('Error updating user data:', error);
            throw new Error(error.message || 'Failed to update user data');
        }
    }
};

// Message service functions
export const messageService = {
    // Create a new conversation
    async createConversation(postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: UserData, postOwnerUserData?: any): Promise<string> {
        try {
            // Simple duplicate check: get all user conversations and filter in JavaScript
            const userConversationsQuery = query(
                collection(db, 'conversations'),
                where(`participants.${currentUserId}`, '!=', null)
            );
            const userConversationsSnapshot = await getDocs(userConversationsQuery);
            const existingConversation = userConversationsSnapshot.docs.find((docSnap) => {
                const data: any = docSnap.data();
                return data.postId === postId && data.participants && data.participants[postOwnerId];
            });
            if (existingConversation) {
                return existingConversation.id;
            }

            const conversationData = {
                postId,
                postTitle,
                participants: {
                    [currentUserId]: {
                        uid: currentUserId,
                        firstName: currentUserData.firstName,
                        lastName: currentUserData.lastName,
                        profilePicture: currentUserData.profilePicture || null, // Ensure null instead of undefined
                        joinedAt: serverTimestamp()
                    },
                    [postOwnerId]: {
                        uid: postOwnerId,
                        firstName: postOwnerUserData?.firstName || 'Post Owner',
                        lastName: postOwnerUserData?.lastName || '',
                        profilePicture: (postOwnerUserData?.profilePicture || postOwnerUserData?.profileImageUrl) || null, // Ensure null instead of undefined
                        joinedAt: serverTimestamp()
                    }
                },
                createdAt: serverTimestamp()
            };

            const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);

            return conversationRef.id;
        } catch (error: any) {
            console.error('❌ Mobile: Failed to create conversation:', error);
            console.error('❌ Mobile: Error details:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            throw new Error(error.message || 'Failed to create conversation');
        }
    },

    // Send a message
    async sendMessage(conversationId: string, senderId: string, senderName: string, text: string, senderProfilePicture?: string): Promise<void> {
        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const messageData = {
                senderId,
                senderName,
                senderProfilePicture: senderProfilePicture || null, // Ensure null instead of undefined
                text,
                timestamp: serverTimestamp(),
                readBy: [senderId]
            };

            await addDoc(messagesRef, messageData);

            // Update last message in conversation
            await updateDoc(doc(db, 'conversations', conversationId), {
                lastMessage: {
                    text,
                    senderId,
                    timestamp: serverTimestamp()
                }
            });

        } catch (error: any) {
            console.error('❌ Mobile: Failed to send message:', error);
            console.error('❌ Mobile: Error details:', {
                code: error.code,
                message: error.message,
                details: error.details
            });
            throw new Error(error.message || 'Failed to send message');
        }
    },

    // Get user's conversations
    getUserConversations(userId: string, callback: (conversations: any[]) => void) {
        const q = query(
            collection(db, 'conversations'),
            where(`participants.${userId}`, '!=', null)
        );

        return onSnapshot(q, (snapshot) => {
            const conversations = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .sort((a: any, b: any) => {
                    // Sort by createdAt in descending order (newest first)
                    const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
                    const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
                    return bTime.getTime() - aTime.getTime();
                });
            callback(conversations);
        });
    },

    // Get messages for a conversation
    getConversationMessages(conversationId: string, callback: (messages: any[]) => void) {
        const q = query(
            collection(db, 'conversations', conversationId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(messages);
        });
    },

    // Mark message as read
    async markMessageAsRead(conversationId: string, messageId: string, userId: string): Promise<void> {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (messageDoc.exists()) {
                const messageData = messageDoc.data();
                const readBy = messageData.readBy || [];

                if (!readBy.includes(userId)) {
                    await updateDoc(messageRef, {
                        readBy: [...readBy, userId]
                    });
                }
            }
        } catch (error: any) {
            throw new Error(error.message || 'Failed to mark message as read');
        }
    },

    // Get current conversations for a user (one-time query, not real-time)
    async getCurrentConversations(userId: string): Promise<any[]> {
        try {
            const q = query(
                collection(db, 'conversations'),
                where(`participants.${userId}`, '!=', null)
            );

            const snapshot = await getDocs(q);
            const conversations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter out conversations where the user is the only participant
            const validConversations = conversations.filter((conv: any) => {
                const participantIds = Object.keys(conv.participants || {});
                return participantIds.length > 1; // Must have at least 2 participants
            });

            // Sort conversations by createdAt
            const sortedConversations = validConversations.sort((a: any, b: any) => {
                const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)) : new Date(0);
                const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) : new Date(0);
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });

            return sortedConversations;

        } catch (error: any) {
            console.error('❌ Mobile MessageService: One-time query failed:', error);
            throw new Error(error.message || 'Failed to get current conversations');
        }
    }
};

// Ghost conversation detection and cleanup utilities
export const ghostConversationService = {
    // Detect ghost conversations (conversations without corresponding posts)
    async detectGhostConversations(): Promise<{ conversationId: string; postId: string; reason: string }[]> {
        try {
            // Get all conversations
            const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
            const ghostConversations: { conversationId: string; postId: string; reason: string }[] = [];

            // Check each conversation
            for (const convDoc of conversationsSnapshot.docs) {
                const convData = convDoc.data();
                const postId = convData.postId;

                if (!postId) {
                    ghostConversations.push({
                        conversationId: convDoc.id,
                        postId: 'unknown',
                        reason: 'Missing postId field'
                    });
                    continue;
                }

                try {
                    // Check if the post still exists
                    const postDoc = await getDoc(doc(db, 'posts', postId));

                    if (!postDoc.exists()) {
                        ghostConversations.push({
                            conversationId: convDoc.id,
                            postId: postId,
                            reason: 'Post no longer exists'
                        });
                    }
                } catch (error: any) {
                    if (error.code === 'permission-denied') {
                        ghostConversations.push({
                            conversationId: convDoc.id,
                            postId: postId,
                            reason: 'Cannot access post (permission denied)'
                        });
                    } else {
                        ghostConversations.push({
                            conversationId: convDoc.id,
                            postId: postId,
                            reason: `Error checking post: ${error.message}`
                        });
                    }
                }
            }

            return ghostConversations;

        } catch (error: any) {
            console.error('❌ Mobile: Ghost conversation detection failed:', error);
            throw new Error(`Failed to detect ghost conversations: ${error.message}`);
        }
    },

    // Clean up ghost conversations
    async cleanupGhostConversations(ghostConversations: { conversationId: string; postId: string; reason: string }[]): Promise<{ success: number; failed: number; errors: string[] }> {
        try {
            const batch = writeBatch(db);
            let success = 0;
            let failed = 0;
            const errors: string[] = [];

            // Add all ghost conversations to deletion batch
            ghostConversations.forEach(ghost => {
                try {
                    const convRef = doc(db, 'conversations', ghost.conversationId);
                    batch.delete(convRef);
                } catch (error: any) {
                    failed++;
                    errors.push(`Failed to add ${ghost.conversationId}: ${error.message}`);
                }
            });

            if (ghostConversations.length > 0) {
                // Execute the batch deletion
                await batch.commit();
                success = ghostConversations.length;
            }

            return { success, failed, errors };

        } catch (error: any) {
            console.error('❌ Mobile: Ghost conversation cleanup failed:', error);
            throw new Error(`Failed to cleanup ghost conversations: ${error.message}`);
        }
    },

    // Validate conversation integrity (for admin use)
    async validateConversationIntegrity(): Promise<{
        totalConversations: number;
        validConversations: number;
        ghostConversations: number;
        orphanedMessages: number;
        details: string[];
    }> {
        try {
            const result: {
                totalConversations: number;
                validConversations: number;
                ghostConversations: number;
                orphanedMessages: number;
                details: string[];
            } = {
                totalConversations: 0,
                validConversations: 0,
                ghostConversations: 0,
                orphanedMessages: 0,
                details: []
            };

            // Get all conversations
            const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
            result.totalConversations = conversationsSnapshot.docs.length;

            for (const convDoc of conversationsSnapshot.docs) {
                const convData = convDoc.data();
                const postId = convData.postId;

                if (!postId) {
                    result.ghostConversations++;
                    result.details.push(`Conversation ${convDoc.id}: Missing postId`);
                    continue;
                }

                try {
                    // Check if post exists
                    const postDoc = await getDoc(doc(db, 'posts', postId));

                    if (!postDoc.exists()) {
                        result.ghostConversations++;
                        result.details.push(`Conversation ${convDoc.id}: Post ${postId} not found`);
                        continue;
                    }

                    // Check for orphaned messages
                    try {
                        const messagesSnapshot = await getDocs(collection(db, 'conversations', convDoc.id, 'messages'));
                        if (messagesSnapshot.docs.length === 0) {
                            result.details.push(`Conversation ${convDoc.id}: No messages found`);
                        }
                    } catch (error: any) {
                        result.orphanedMessages++;
                        result.details.push(`Conversation ${convDoc.id}: Cannot access messages - ${error.message}`);
                    }

                    result.validConversations++;

                } catch (error: any) {
                    result.ghostConversations++;
                    result.details.push(`Conversation ${convDoc.id}: Error checking post - ${error.message}`);
                }
            }

            return result;

        } catch (error: any) {
            console.error('❌ Mobile: Conversation integrity validation failed:', error);
            throw new Error(`Failed to validate conversation integrity: ${error.message}`);
        }
    }
};

// Background cleanup service for periodic ghost conversation maintenance
export const backgroundCleanupService = {
    // Run periodic cleanup (can be called by admin or scheduled tasks)
    async runPeriodicCleanup(): Promise<{
        timestamp: string;
        ghostsDetected: number;
        ghostsCleaned: number;
        errors: string[];
        duration: number;
    }> {
        const startTime = Date.now();
        const errors: string[] = [];

        try {
            // Detect ghost conversations
            const ghostConversations = await ghostConversationService.detectGhostConversations();

            if (ghostConversations.length === 0) {
                return {
                    timestamp: new Date().toISOString(),
                    ghostsDetected: 0,
                    ghostsCleaned: 0,
                    errors: [],
                    duration: Date.now() - startTime
                };
            }

            // Clean up detected ghosts
            const cleanupResult = await ghostConversationService.cleanupGhostConversations(ghostConversations);

            // Collect any errors
            if (cleanupResult.errors.length > 0) {
                errors.push(...cleanupResult.errors);
            }

            const duration = Date.now() - startTime;
            return {
                timestamp: new Date().toISOString(),
                ghostsDetected: ghostConversations.length,
                ghostsCleaned: cleanupResult.success,
                errors: errors,
                duration: duration
            };

        } catch (error: any) {
            const duration = Date.now() - startTime;
            console.error('❌ Mobile: Periodic cleanup failed:', error);
            errors.push(`Periodic cleanup failed: ${error.message}`);

            return {
                timestamp: new Date().toISOString(),
                ghostsDetected: 0,
                ghostsCleaned: 0,
                errors: errors,
                duration: duration
            };
        }
    },

    // Quick health check (lightweight version of integrity validation)
    async quickHealthCheck(): Promise<{
        healthy: boolean;
        totalConversations: number;
        ghostCount: number;
        issues: string[];
    }> {
        try {
            // Get total conversation count
            const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
            const totalConversations = conversationsSnapshot.docs.length;

            if (totalConversations === 0) {
                return {
                    healthy: true,
                    totalConversations: 0,
                    ghostCount: 0,
                    issues: []
                };
            }

            // Sample check: look at first few conversations for obvious issues
            const sampleSize = Math.min(5, totalConversations);
            const issues: string[] = [];
            let ghostCount = 0;

            for (let i = 0; i < sampleSize; i++) {
                const convDoc = conversationsSnapshot.docs[i];
                const convData = convDoc.data();
                const postId = convData.postId;

                if (!postId) {
                    ghostCount++;
                    issues.push(`Conversation ${convDoc.id}: Missing postId`);
                    continue;
                }

                try {
                    const postDoc = await getDoc(doc(db, 'posts', postId));
                    if (!postDoc.exists()) {
                        ghostCount++;
                        issues.push(`Conversation ${convDoc.id}: Post ${postId} not found`);
                    }
                } catch (error: any) {
                    ghostCount++;
                    issues.push(`Conversation ${convDoc.id}: Cannot access post ${postId}`);
                }
            }

            // Estimate total ghosts based on sample
            const estimatedGhosts = Math.ceil((ghostCount / sampleSize) * totalConversations);
            const healthy = estimatedGhosts === 0;

            return {
                healthy: healthy,
                totalConversations: totalConversations,
                ghostCount: estimatedGhosts,
                issues: issues
            };

        } catch (error: any) {
            console.error('❌ Mobile: Quick health check failed:', error);
            return {
                healthy: false,
                totalConversations: 0,
                ghostCount: 0,
                issues: [`Health check failed: ${error.message}`]
            };
        }
    }
};

// Image upload service using Cloudinary for React Native
export const imageService = {
    // Upload multiple images and return their URLs
    async uploadImages(imageUris: string[], postId?: string): Promise<string[]> {
        try {
            return await cloudinaryService.uploadImages(imageUris, 'posts');
        } catch (error: any) {
            console.error('Error uploading images:', error);
            throw new Error(error.message || 'Failed to upload images');
        }
    },

    // Delete images from Cloudinary
    async deleteImages(imageUrls: string[]): Promise<void> {
        try {
            if (imageUrls.length === 0) {
                return;
            }

            const deletePromises = imageUrls.map(async (url) => {
                if (url.includes('cloudinary.com')) {
                    // Extract public ID from Cloudinary URL for deletion using robust function
                    const publicId = extractCloudinaryPublicId(url);

                    if (publicId) {
                        try {
                            await cloudinaryService.deleteImage(publicId);
                        } catch (deleteError: any) {
                            // Handle deletion errors gracefully without throwing
                            if (deleteError.message?.includes('permission') || deleteError.message?.includes('401')) {
                                // Silent handling for permission issues
                            } else if (deleteError.message?.includes('signature') || deleteError.message?.includes('CryptoJS')) {
                                // Silent handling for signature issues
                            } else {
                                // Silent handling for other errors
                            }
                            // Don't throw error - just log it and continue
                        }
                    }
                }
            });

            await Promise.all(deletePromises);
        } catch (error: any) {
            // Check if it's a Cloudinary configuration issue
            if (error.message?.includes('not configured') || error.message?.includes('credentials')) {
                // Silent handling for configuration issues
                return;
            }

            // Check if it's a permission issue
            if (error.message?.includes('401') || error.message?.includes('permission')) {
                // Silent handling for permission issues
                return;
            }

            // Check if it's a signature generation issue
            if (error.message?.includes('signature') || error.message?.includes('CryptoJS')) {
                // Silent handling for signature issues
                return;
            }

            // For other errors, just log them without throwing
            console.error('Image deletion encountered issues:', error.message);
        }
    },

    // Delete single profile picture from Cloudinary and update user profile
    async deleteProfilePicture(profilePictureUrl: string, userId?: string): Promise<void> {
        try {
            if (!profilePictureUrl || !profilePictureUrl.includes('cloudinary.com')) {
                return; // No Cloudinary image to delete
            }

            // Extract public ID from Cloudinary URL for deletion
            const publicId = extractCloudinaryPublicId(profilePictureUrl);

            if (publicId) {
                try {
                    await cloudinaryService.deleteImage(publicId);

                    // If userId is provided, update the user's profile in Firestore
                    if (userId) {
                        try {
                            const userRef = doc(db, 'users', userId);
                            await updateDoc(userRef, {
                                profileImageUrl: null,
                                updatedAt: serverTimestamp()
                            });
                        } catch (updateError: any) {
                            console.error('Failed to update user profile in Firestore:', updateError.message);
                            // Don't throw error - image was deleted from Cloudinary successfully
                        }
                    }
                } catch (deleteError: any) {
                    // Handle deletion errors gracefully without throwing
                    if (deleteError.message?.includes('permission') || deleteError.message?.includes('401')) {
                        // Silent handling for permission issues
                    } else if (deleteError.message?.includes('signature') || deleteError.message?.includes('CryptoJS')) {
                        // Silent handling for signature issues
                    } else {
                        // Silent handling for other errors
                    }
                    // Don't throw error - just log it and continue
                }
            }
        } catch (error: any) {
            // Check if it's a Cloudinary configuration issue
            if (error.message?.includes('not configured') || error.message?.includes('credentials')) {
                // Silent handling for configuration issues
                return;
            }

            // Check if it's a permission issue
            if (error.message?.includes('401') || error.message?.includes('permission')) {
                // Silent handling for permission issues
                return;
            }

            // Check if it's a signature generation issue
            if (error.message?.includes('signature') || error.message?.includes('CryptoJS')) {
                // Silent handling for signature issues
                return;
            }

            // For other errors, just log them without throwing
            console.error('Profile picture deletion encountered issues:', error.message);
        }
    }
};

// User service functions
export const userService = {
    // Update user profile data
    async updateUserProfile(userId: string, updates: Partial<UserData>): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error: any) {
            console.error('Error updating user profile:', error);
            throw new Error(error.message || 'Failed to update user profile');
        }
    },

    // Get user data by ID
    async getUserById(userId: string): Promise<UserData | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data() as UserData;
            }
            return null;
        } catch (error: any) {
            console.error('Error getting user data:', error);
            throw new Error(error.message || 'Failed to get user data');
        }
    }
};

// Post service functions
export const postService = {
    // Create a new post
    async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'creatorId'>, creatorId: string): Promise<string> {
        try {
            // Generate a unique post ID
            const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Upload images if any (convert string URIs to Cloudinary URLs)
            const imageUrls = postData.images.length > 0
                ? await imageService.uploadImages(postData.images as string[])
                : [];

            // Create post document
            const post: Post = {
                ...postData,
                id: postId,
                creatorId: creatorId, // Add the creator ID
                images: imageUrls,
                createdAt: serverTimestamp(),
                status: 'pending',
                // Initialize 30-day lifecycle fields
                isExpired: false,
                movedToUnclaimed: false,
                originalStatus: 'pending'
            };

            await setDoc(doc(db, 'posts', postId), post);

            // Set expiry date (30 days from creation) after post is created
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            await updateDoc(doc(db, 'posts', postId), {
                expiryDate: expiryDate
            });

            return postId;
        } catch (error: any) {
            console.error('Error creating post:', error);
            throw new Error(error.message || 'Failed to create post');
        }
    },

    // Get all posts with real-time updates
    getAllPosts(callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];

            callback(posts);
        }, (error) => {
            console.error('Error fetching posts:', error);
            callback([]);
        });
    },

    // Get posts by type (lost/found)
    getPostsByType(type: 'lost' | 'found', callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('type', '==', type)
            // Removed orderBy to avoid composite index requirement
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];

            // Sort posts by createdAt in JavaScript instead
            const sortedPosts = posts.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });

            callback(sortedPosts);
        });
    },

    // Get posts by category
    getPostsByCategory(category: string, callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('category', '==', category)
            // Removed orderBy to avoid composite index requirement
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];

            // Sort posts by createdAt in JavaScript instead
            const sortedPosts = posts.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });

            callback(sortedPosts);
        });
    },

    // Get posts by user email
    getUserPosts(userEmail: string, callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('user.email', '==', userEmail)
            // Removed orderBy to avoid composite index requirement
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];

            // Sort posts by createdAt in JavaScript instead
            const sortedPosts = posts.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });

            callback(sortedPosts);
        }, (error) => {
            console.error('Error fetching user posts:', error);
            callback([]);
        });
    },

    // Get a single post by ID
    async getPostById(postId: string): Promise<Post | null> {
        try {
            const postDoc = await getDoc(doc(db, 'posts', postId));
            if (postDoc.exists()) {
                const data = postDoc.data();
                return {
                    id: postDoc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || data.createdAt
                } as Post;
            }
            return null;
        } catch (error: any) {
            console.error('Error fetching post:', error);
            throw new Error(error.message || 'Failed to fetch post');
        }
    },

    // Update post status
    async updatePostStatus(postId: string, status: 'pending' | 'resolved' | 'rejected'): Promise<void> {
        try {
            await updateDoc(doc(db, 'posts', postId), {
                status,
                updatedAt: serverTimestamp()
            });
        } catch (error: any) {
            console.error('Error updating post status:', error);
            throw new Error(error.message || 'Failed to update post status');
        }
    },

    // Update post
    async updatePost(postId: string, updates: Partial<Post>): Promise<void> {
        try {
            const updateData = {
                ...updates,
                updatedAt: serverTimestamp()
            };

            // Handle image updates if needed
            if (updates.images) {
                // Separate new images (local URIs) from existing images (Cloudinary URLs)
                const existingImages: string[] = [];
                const newImages: string[] = [];

                updates.images.forEach((image: string | File) => {
                    const imageStr = typeof image === 'string' ? image : image.name;
                    if (imageStr.startsWith('http') || imageStr.startsWith('https')) {
                        // This is an existing Cloudinary URL - keep as is
                        existingImages.push(imageStr);
                    } else {
                        // This is a new local image - needs to be uploaded
                        newImages.push(imageStr);
                    }
                });

                // Only upload new images
                let finalImages = [...existingImages];
                if (newImages.length > 0) {
                    const uploadedUrls = await imageService.uploadImages(newImages);
                    finalImages = [...existingImages, ...uploadedUrls];
                }

                updateData.images = finalImages;

                console.log('Image update details:', {
                    existing: existingImages.length,
                    new: newImages.length,
                    final: finalImages.length
                });
            }

            await updateDoc(doc(db, 'posts', postId), updateData);
        } catch (error: any) {
            console.error('Error updating post:', error);
            throw new Error(error.message || 'Failed to update post');
        }
    },

    // Delete post
    async deletePost(postId: string): Promise<void> {
        try {
            // Get post data to delete associated images
            const post = await this.getPostById(postId);

            if (post && post.images.length > 0) {
                try {
                    await imageService.deleteImages(post.images as string[]);
                } catch (imageDeleteError: any) {
                    // Log image deletion errors but don't fail the post deletion
                    console.error('Image deletion failed, but continuing with post deletion:', imageDeleteError.message);
                }
            }

            // Delete the post first
            await deleteDoc(doc(db, 'posts', postId));

            // Delete all conversations related to this post after post is deleted
            await this.deleteConversationsByPostId(postId);

            // SAFETY NET: Automatic ghost detection and cleanup
            try {
                const ghostConversations = await ghostConversationService.detectGhostConversations();

                if (ghostConversations.length > 0) {
                    const cleanupResult = await ghostConversationService.cleanupGhostConversations(ghostConversations);

                    if (cleanupResult.errors.length > 0) {
                        console.warn('Safety net cleanup had some errors:', cleanupResult.errors);
                    }
                }
            } catch (ghostError: any) {
                // Don't fail the main deletion if ghost detection fails
                console.warn('Safety net ghost detection failed (non-critical):', ghostError.message);
            }
        } catch (error: any) {
            console.error('Mobile: Post deletion failed:', error);
            throw new Error(error.message || 'Failed to delete post');
        }
    },

    // Delete all conversations related to a specific post
    async deleteConversationsByPostId(postId: string): Promise<void> {
        try {
            // STEP 1: Query conversations by postId
            const conversationsQuery = query(
                collection(db, 'conversations'),
                where('postId', '==', postId)
            );

            const conversationsSnapshot = await getDocs(conversationsQuery);

            if (conversationsSnapshot.docs.length === 0) {
                return;
            }

            // STEP 2: Create a batch operation for atomic deletion
            const batch = writeBatch(db);

            // STEP 3: Delete messages and conversations in the correct order
            for (const convDoc of conversationsSnapshot.docs) {
                const conversationId = convDoc.id;

                try {
                    // STEP 3a: Delete all messages in the subcollection first
                    const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
                    const messagesSnapshot = await getDocs(messagesQuery);

                    if (messagesSnapshot.docs.length > 0) {
                        // Add all messages to the deletion batch
                        messagesSnapshot.docs.forEach(messageDoc => {
                            batch.delete(messageDoc.ref);
                        });
                    }

                    // STEP 3b: Add conversation document to deletion batch
                    batch.delete(convDoc.ref);

                } catch (error: any) {
                    throw new Error(`Failed to process conversation ${conversationId}: ${error.message}`);
                }
            }

            // STEP 4: Execute the batch operation atomically
            await batch.commit();

            // STEP 5: Verify deletion was successful
            const verifyQuery = query(
                collection(db, 'conversations'),
                where('postId', '==', postId)
            );
            const verifySnapshot = await getDocs(verifyQuery);

            if (verifySnapshot.docs.length > 0) {
                throw new Error('Conversation deletion verification failed');
            }

        } catch (error: any) {
            console.error('Mobile: Error deleting conversations for post:', error);
            throw new Error(`Failed to delete conversations: ${error.message}`);
        }
    },

    // Search posts by title or description
    async searchPosts(searchTerm: string): Promise<Post[]> {
        try {
            const postsSnapshot = await getDocs(collection(db, 'posts'));
            const posts = postsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];

            const searchTermLower = searchTerm.toLowerCase();
            return posts.filter(post =>
                post.title.toLowerCase().includes(searchTermLower) ||
                post.description.toLowerCase().includes(searchTermLower) ||
                post.category.toLowerCase().includes(searchTermLower) ||
                post.location.toLowerCase().includes(searchTermLower)
            );
        } catch (error: any) {
            console.error('Error searching posts:', error);
            throw new Error(error.message || 'Failed to search posts');
        }
    },

    // Get posts by location
    getPostsByLocation(location: string, callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('location', '==', location)
            // Removed orderBy to avoid composite index requirement
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];

            // Sort posts by createdAt in JavaScript instead
            const sortedPosts = posts.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });

            callback(sortedPosts);
        });
    },

    // Move post to unclaimed status (expired posts)
    async movePostToUnclaimed(postId: string): Promise<void> {
        try {
            const postRef = doc(db, 'posts', postId);
            const postDoc = await getDoc(postRef);

            if (!postDoc.exists()) {
                throw new Error('Post not found');
            }

            const postData = postDoc.data();

            await updateDoc(postRef, {
                isExpired: true,
                movedToUnclaimed: true,
                originalStatus: postData.status || 'pending'
            });

            console.log(`Post ${postId} moved to unclaimed status`);
        } catch (error: any) {
            console.error('Error moving post to unclaimed:', error);
            throw new Error(error.message || 'Failed to move post to unclaimed');
        }
    },

    // Activate ticket (move back to active from unclaimed)
    async activateTicket(postId: string): Promise<void> {
        try {
            const postRef = doc(db, 'posts', postId);
            const postDoc = await getDoc(postRef);

            if (!postDoc.exists()) {
                throw new Error('Post not found');
            }

            const postData = postDoc.data();

            // Calculate new expiry date (30 days from now)
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + 30);

            await updateDoc(postRef, {
                isExpired: false,
                movedToUnclaimed: false,
                status: postData.originalStatus || 'pending',
                expiryDate: newExpiryDate
            });

            console.log(`Post ${postId} activated and moved back to active status`);
        } catch (error: any) {
            console.error('Error activating ticket:', error);
            throw new Error(error.message || 'Failed to activate ticket');
        }
    },


};

// Helper function to get readable error messages
export const getFirebaseErrorMessage = (error: any): string => {
    switch (error.code) {
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email address.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters long.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            return error.message || 'An unexpected error occurred. Please try again.';
    }
};
