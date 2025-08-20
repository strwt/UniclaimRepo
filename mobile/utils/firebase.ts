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
    getDocs
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
    profileImageUrl?: string; // Optional field for profile image URL
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
                console.log('Reusing existing conversation:', existingConversation.id);
                return existingConversation.id;
            }

            const conversationRef = await addDoc(collection(db, 'conversations'), {
                postId,
                postTitle,
                participants: {
                    [currentUserId]: {
                        uid: currentUserId,
                        firstName: currentUserData.firstName,
                        lastName: currentUserData.lastName,
                        joinedAt: serverTimestamp()
                    },
                    [postOwnerId]: {
                        uid: postOwnerId,
                        firstName: postOwnerUserData?.firstName || 'Post Owner',
                        lastName: postOwnerUserData?.lastName || '',
                        joinedAt: serverTimestamp()
                    }
                },
                createdAt: serverTimestamp()
            });

            return conversationRef.id;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create conversation');
        }
    },

    // Send a message
    async sendMessage(conversationId: string, senderId: string, senderName: string, text: string): Promise<void> {
        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, {
                senderId,
                senderName,
                text,
                timestamp: serverTimestamp(),
                readBy: [senderId]
            });

            // Update last message in conversation
            await updateDoc(doc(db, 'conversations', conversationId), {
                lastMessage: {
                    text,
                    senderId,
                    timestamp: serverTimestamp()
                }
            });
        } catch (error: any) {
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
                status: 'pending'
            };

            await setDoc(doc(db, 'posts', postId), post);
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
                const imageUrls = await imageService.uploadImages(updates.images as string[]);
                updateData.images = imageUrls;
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

            await deleteDoc(doc(db, 'posts', postId));
        } catch (error: any) {
            console.error('Error deleting post:', error);
            throw new Error(error.message || 'Failed to delete post');
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
    }
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
