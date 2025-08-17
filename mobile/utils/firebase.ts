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

export const auth = getAuth(app);
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
    createdAt: any;
    updatedAt: any;
}

// Auth utility functions
export const authService = {
    // Register new user
    async register(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        contactNum: string
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
            return userDoc.exists() ? userDoc.data() as UserData : null;
        } catch (error: any) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }
};

// Message service functions
export const messageService = {
    // Create a new conversation
    async createConversation(postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: UserData): Promise<string> {
        try {
            // Check if conversation already exists
            const existingQuery = query(
                collection(db, 'conversations'),
                where('postId', '==', postId),
                where(`participants.${currentUserId}`, '!=', null),
                where(`participants.${postOwnerId}`, '!=', null)
            );

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
                        firstName: '',
                        lastName: '',
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
            const deletePromises = imageUrls.map(async (url) => {
                if (url.includes('cloudinary.com')) {
                    // Extract public ID from Cloudinary URL for deletion
                    const urlParts = url.split('/');
                    const uploadIndex = urlParts.findIndex(part => part === 'upload');
                    if (uploadIndex !== -1) {
                        const publicIdWithExtension = urlParts.slice(uploadIndex + 1).join('/');
                        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
                        await cloudinaryService.deleteImage(publicId);
                    }
                }
            });

            await Promise.all(deletePromises);
        } catch (error: any) {
            console.error('Error deleting images:', error);
            // Don't throw error for deletion failures to avoid blocking other operations
        }
    }
};

// Post service functions
export const postService = {
    // Create a new post
    async createPost(postData: Omit<Post, 'id' | 'createdAt'>): Promise<string> {
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
            where('type', '==', type),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];
            callback(posts);
        });
    },

    // Get posts by category
    getPostsByCategory(category: string, callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];
            callback(posts);
        });
    },

    // Get posts by user email
    getUserPosts(userEmail: string, callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('user.email', '==', userEmail),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];
            callback(posts);
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
                await imageService.deleteImages(post.images as string[]);
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
            where('location', '==', location),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];
            callback(posts);
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
