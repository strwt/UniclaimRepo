// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendEmailVerification,
    type User as FirebaseUser,
    type UserCredential
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
    getDocs,
    writeBatch
} from 'firebase/firestore';
// Note: Firebase Storage imports removed - now using Cloudinary
// import {
//     getStorage,
//     ref,
//     uploadBytes,
//     getDownloadURL,
//     deleteObject
// } from 'firebase/storage';

// Import ListenerManager for centralized listener management
import { listenerManager } from './ListenerManager';

// Firebase configuration from environment variables
// Create a .env file in the frontend folder with your Firebase config:
// VITE_FIREBASE_API_KEY=your-api-key
// VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=your-project-id
// VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
// VITE_FIREBASE_APP_ID=your-app-id
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCgN70CTX2wQpcgoSZF6AK0fuq7ikcQgNs",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "uniclaim2.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "uniclaim2",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "uniclaim2.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "38339063459",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:38339063459:web:3b5650ebe6fabd352b1916",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-E693CKMPSY"
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

// Import Post interface
import type { Post } from '../types/Post';

// Import Cloudinary service
import { cloudinaryService } from './cloudinary';

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
    role?: 'user' | 'admin'; // User role for access control
    status?: 'active' | 'banned'; // User account status
    banInfo?: any; // Ban information
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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, 'users', user.uid), userData);

            return { user, userData };
        } catch (error: any) {
            throw new Error(error.message || 'Admin user creation failed');
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

// Message service functions
export const messageService = {
    // Create a new conversation
    async createConversation(postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: UserData, postOwnerUserData?: any): Promise<string> {
        try {
            // Use passed post owner user data or fallback to fetching from users collection
            let postOwnerFirstName = '';
            let postOwnerLastName = '';
            let postOwnerProfilePicture = '';
            // Note: contact number not used in conversation document

            if (postOwnerUserData && postOwnerUserData.firstName && postOwnerUserData.lastName) {
                // Use the passed user data from the post
                postOwnerFirstName = postOwnerUserData.firstName;
                postOwnerLastName = postOwnerUserData.lastName;
                postOwnerProfilePicture = postOwnerUserData.profilePicture || '';

            } else {
                // Fallback: try to fetch from users collection
                try {
                    const postOwnerDoc = await getDoc(doc(db, 'users', postOwnerId));
                    if (postOwnerDoc.exists()) {
                        const postOwnerData = postOwnerDoc.data();
                        postOwnerFirstName = postOwnerData.firstName || '';
                        postOwnerLastName = postOwnerData.lastName || '';
                        postOwnerProfilePicture = postOwnerData.profilePicture || '';
                    }
                } catch (error) {
                    console.warn('Could not fetch post owner data:', error);
                    // Continue with empty values if fetch fails
                }
            }

            // Always ensure we have profile pictures - fetch fresh data if missing
            let currentUserProfilePicture = currentUserData.profilePicture || currentUserData.profileImageUrl || '';
            if (!currentUserProfilePicture) {
                try {
                    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
                    if (currentUserDoc.exists()) {
                        const freshUserData = currentUserDoc.data();
                        currentUserProfilePicture = freshUserData.profilePicture || freshUserData.profileImageUrl || '';
                    }
                } catch (error) {
                    console.warn('Could not fetch current user data for profile picture:', error);
                }
            }

            if (!postOwnerProfilePicture) {
                try {
                    const postOwnerDoc = await getDoc(doc(db, 'users', postOwnerId));
                    if (postOwnerDoc.exists()) {
                        const freshPostOwnerData = postOwnerDoc.data();
                        postOwnerProfilePicture = freshPostOwnerData.profilePicture || freshPostOwnerData.profileImageUrl || '';
                    }
                } catch (error) {
                    console.warn('Could not fetch post owner data for profile picture:', error);
                }
            }

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

            const conversationData = {
                postId,
                postTitle,
                participants: {
                    [currentUserId]: {
                        uid: currentUserId,
                        firstName: currentUserData.firstName,
                        lastName: currentUserData.lastName,
                        profilePicture: currentUserProfilePicture || null,
                        joinedAt: serverTimestamp()
                    },
                    [postOwnerId]: {
                        uid: postOwnerId,
                        firstName: postOwnerFirstName,
                        lastName: postOwnerLastName,
                        profilePicture: postOwnerProfilePicture || null,
                        joinedAt: serverTimestamp()
                    }
                },
                createdAt: serverTimestamp()
            };

            const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);

            return conversationRef.id;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create conversation');
        }
    },

    // Send a message
    async sendMessage(conversationId: string, senderId: string, senderName: string, text: string, senderProfilePicture?: string): Promise<void> {
        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, {
                senderId,
                senderName,
                senderProfilePicture: senderProfilePicture || null,
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

    // Get user's conversations (real-time listener)
    getUserConversations(userId: string, callback: (conversations: any[]) => void, errorCallback?: (error: any) => void) {
        const q = query(
            collection(db, 'conversations'),
            where(`participants.${userId}`, '!=', null)
            // Removed orderBy to avoid composite index requirement
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const conversations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter out conversations where the user is the only participant
            const validConversations = conversations.filter((conv: any) => {
                const participantIds = Object.keys(conv.participants || {});
                return participantIds.length > 1; // Must have at least 2 participants
            });

            // Check and recover missing profile pictures for each conversation
            validConversations.forEach((conversation: any) => {
                if (profilePictureRecoveryService.needsProfilePictureRecovery(conversation)) {
                    // Attempt to recover profile pictures in the background
                    profilePictureRecoveryService.recoverProfilePictures(conversation.id, conversation)
                        .then(() => {
                            // Profile pictures recovered successfully
                        })
                        .catch((error) => {
                            console.error('❌ Failed to recover profile pictures for conversation:', conversation.id, error);
                        });
                }
            });

            // Sort conversations by createdAt in JavaScript instead
            const sortedConversations = validConversations.sort((a: any, b: any) => {
                const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)) : new Date(0);
                const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) : new Date(0);
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });

            callback(sortedConversations);
        }, (error) => {
            // Handle listener errors gracefully
            console.log('🔧 MessageService: Listener error:', error?.message || 'Unknown error');
            if (errorCallback) {
                errorCallback(error);
            }
        });

        // Register with ListenerManager for tracking
        const listenerId = listenerManager.addListener(unsubscribe, 'MessageService');

        // Return a wrapped unsubscribe function that also removes from ListenerManager
        return () => {
            listenerManager.removeListener(listenerId);
        };
    },

    // NEW: Get current conversations (one-time query, not a listener)
    async getCurrentConversations(userId: string): Promise<any[]> {
        try {
            console.log('🔧 MessageService: Performing one-time query for current conversations...');

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

            console.log(`🔧 MessageService: One-time query found ${sortedConversations.length} conversations`);
            return sortedConversations;

        } catch (error: any) {
            console.error('❌ MessageService: One-time query failed:', error);
            throw new Error(error.message || 'Failed to get current conversations');
        }
    },

    // Get messages for a conversation
    getConversationMessages(conversationId: string, callback: (messages: any[]) => void) {
        const q = query(
            collection(db, 'conversations', conversationId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(messages);
        });

        // Register with ListenerManager for tracking
        const listenerId = listenerManager.addListener(unsubscribe, 'MessageService');

        // Return a wrapped unsubscribe function that also removes from ListenerManager
        return () => {
            listenerManager.removeListener(listenerId);
        };
    },

    // Mark conversation as read
    async markConversationAsRead(conversationId: string, _userId: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'conversations', conversationId), {
                unreadCount: 0
            });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to mark conversation as read');
        }
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
    }
};

// Helper function to extract Cloudinary public ID from URL
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

// Profile picture recovery function for conversations
export const profilePictureRecoveryService = {
    // Check if a conversation needs profile picture recovery
    needsProfilePictureRecovery(conversation: any): boolean {
        if (!conversation || !conversation.participants) return false;

        return Object.values(conversation.participants).some((participant: any) => {
            return !participant.profilePicture || participant.profilePicture === null;
        });
    },

    // Recover missing profile pictures for a conversation
    async recoverProfilePictures(conversationId: string, conversation: any): Promise<void> {
        try {
            const updates: any = {};
            let hasUpdates = false;

            // Check each participant for missing profile pictures
            for (const [userId, participant] of Object.entries(conversation.participants)) {
                const participantData = participant as any;

                if (!participantData.profilePicture || participantData.profilePicture === null) {
                    try {
                        // Fetch fresh user data from users collection
                        const userDoc = await getDoc(doc(db, 'users', userId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();

                            // Check both field names since mobile uses profileImageUrl and web uses profilePicture
                            const profilePicture = userData.profilePicture || userData.profileImageUrl;

                            if (profilePicture) {
                                updates[`participants.${userId}.profilePicture`] = profilePicture;
                                hasUpdates = true;
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error fetching user data for profile picture recovery:', userId, error);
                    }
                }
            }

            // Update conversation if we have profile pictures to recover
            if (hasUpdates) {
                await updateDoc(doc(db, 'conversations', conversationId), updates);
            }
        } catch (error: any) {
            console.error('❌ Error during profile picture recovery:', error);
            throw new Error('Failed to recover profile pictures: ' + error.message);
        }
    }
};

// Image upload service using Cloudinary
export const imageService = {
    // Upload multiple images and return their URLs
    async uploadImages(files: (File | string)[]): Promise<string[]> {
        try {
            return await cloudinaryService.uploadImages(files, 'posts');
        } catch (error: any) {
            console.error('Error uploading images:', error);
            throw new Error(error.message || 'Failed to upload images');
        }
    },

    // Delete images from storage
    async deleteImages(imageUrls: string[]): Promise<void> {
        try {
            if (imageUrls.length === 0) {
                return;
            }

            const deletePromises = imageUrls.map(async (url) => {
                if (url.includes('cloudinary.com')) {
                    // Extract public ID from Cloudinary URL for deletion
                    const publicId = extractCloudinaryPublicId(url);

                    if (publicId) {
                        await cloudinaryService.deleteImage(publicId);
                    }
                }
            });

            await Promise.all(deletePromises);
        } catch (error: any) {
            // Check if it's a Cloudinary configuration issue
            if (error.message?.includes('not configured') || error.message?.includes('credentials')) {
                throw new Error('Cloudinary API credentials not configured. Images cannot be deleted from storage.');
            }

            // Check if it's a permission issue
            if (error.message?.includes('401') || error.message?.includes('permission')) {
                throw new Error('Cloudinary account permissions insufficient. Images cannot be deleted from storage.');
            }

            // Re-throw other errors so the calling function can handle them
            throw new Error(`Failed to delete images from Cloudinary: ${error.message}`);
        }
    },

    // Delete single profile picture from storage and update user profile
    async deleteProfilePicture(profilePictureUrl: string, userId?: string): Promise<void> {
        try {
            if (!profilePictureUrl || !profilePictureUrl.includes('cloudinary.com')) {
                return; // No Cloudinary image to delete
            }

            // Extract public ID from Cloudinary URL for deletion
            const publicId = extractCloudinaryPublicId(profilePictureUrl);

            if (publicId) {
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
            }
        } catch (error: any) {
            // Check if it's a Cloudinary configuration issue
            if (error.message?.includes('not configured') || error.message?.includes('credentials')) {
                throw new Error('Cloudinary API credentials not configured. Profile picture cannot be deleted from storage.');
            }

            // Check if it's a permission issue
            if (error.message?.includes('401') || error.message?.includes('permission')) {
                throw new Error('Cloudinary account permissions insufficient. Profile picture cannot be deleted from storage.');
            }

            // Re-throw other errors so the calling function can handle them
            throw new Error(`Failed to delete profile picture from Cloudinary: ${error.message}`);
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

            // Upload images if any
            const imageUrls = postData.images.length > 0
                ? await imageService.uploadImages(postData.images)
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

            // Calculate expiry date (30 days from creation)
            // Note: We'll set this after the post is created since we need the actual timestamp

            // Debug: Log post data being sent to Firestore
            console.log('Creating post with data:', {
                ...post,
                createdAt: 'serverTimestamp()' // Replace actual timestamp for logging
            });

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

    // Get all posts with real-time updates (DEPRECATED - use getActivePosts for better performance)
    getAllPosts(callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts')
            // orderBy('createdAt', 'desc') // Temporarily commented out
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
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
            console.error('PostService: Error fetching posts:', error);
            callback([]);
        });

        // Register with ListenerManager for tracking
        const listenerId = listenerManager.addListener(unsubscribe, 'PostService');

        // Return a wrapped unsubscribe function that also removes from ListenerManager
        return () => {
            listenerManager.removeListener(listenerId);
        };
    },

    // Get only active (non-expired) posts with real-time updates - OPTIMIZED FOR PERFORMANCE
    getActivePosts(callback: (posts: Post[]) => void) {
        const now = new Date();

        // Create query for active posts only
        const q = query(
            collection(db, 'posts'),
            where('movedToUnclaimed', '==', false), // Only posts not moved to unclaimed
            // Note: We can't use where('expiryDate', '>', now) in the same query with movedToUnclaimed
            // due to Firestore limitations, so we'll filter expiryDate in the callback
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            })) as Post[];

            // Filter out expired posts on the client side (this is fast since we're only processing ~20-50 posts)
            const activePosts = posts.filter(post => {
                if (post.movedToUnclaimed) return false;

                // Check if post has expired
                if (post.expiryDate) {
                    let expiryDate: Date;

                    // Handle Firebase Timestamp
                    if (post.expiryDate && typeof post.expiryDate === 'object' && 'seconds' in post.expiryDate) {
                        expiryDate = new Date(post.expiryDate.seconds * 1000);
                    } else if (post.expiryDate instanceof Date) {
                        expiryDate = post.expiryDate;
                    } else {
                        expiryDate = new Date(post.expiryDate);
                    }

                    // Return false if post has expired
                    if (expiryDate < now) return false;
                }

                return true;
            });

            // Sort posts by createdAt (most recent first)
            const sortedPosts = activePosts.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
            });

            callback(sortedPosts);
        }, (error) => {
            console.error('PostService: Error fetching active posts:', error);
            callback([]);
        });

        // Register with ListenerManager for tracking
        const listenerId = listenerManager.addListener(unsubscribe, 'PostService');

        // Return a wrapped unsubscribe function that also removes from ListenerManager
        return () => {
            listenerManager.removeListener(listenerId);
        };
    },

    // Get posts by type (lost/found)
    getPostsByType(type: 'lost' | 'found', callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('type', '==', type)
            // Removed orderBy to avoid composite index requirement
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
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

        // Register with ListenerManager for tracking
        const listenerId = listenerManager.addListener(unsubscribe, 'PostService');

        // Return a wrapped unsubscribe function that also removes from ListenerManager
        return () => {
            listenerManager.removeListener(listenerId);
        };
    },

    // Get posts by category
    getPostsByCategory(category: string, callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('category', '==', category)
            // Removed orderBy to avoid composite index requirement
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
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

        // Register with ListenerManager for tracking
        const listenerId = listenerManager.addListener(unsubscribe, 'PostService');

        // Return a wrapped unsubscribe function that also removes from ListenerManager
        return () => {
            listenerManager.removeListener(listenerId);
        };
    },

    // Get posts by user email
    getUserPosts(userEmail: string, callback: (posts: Post[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('user.email', '==', userEmail)
            // Removed orderBy to avoid composite index requirement
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
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

        // Register with ListenerManager for tracking
        const listenerId = listenerManager.addListener(unsubscribe, 'PostService');

        // Return a wrapped unsubscribe function that also removes from ListenerManager
        return () => {
            listenerManager.removeListener(listenerId);
        };
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
            // Get the original post data first to compare images
            const originalPost = await this.getPostById(postId);
            if (!originalPost) {
                throw new Error('Post not found');
            }

            const updateData = {
                ...updates,
                updatedAt: serverTimestamp()
            };

            // Handle image updates if needed
            if (updates.images) {
                // Compare original images with new images to find deleted ones
                const originalImages = originalPost.images || [];
                const newImages = updates.images;

                // Find images that were deleted (exist in original but not in new)
                const deletedImages: string[] = [];
                originalImages.forEach((originalImg: string | File) => {
                    // Only process string URLs (Cloudinary URLs) for deletion
                    if (typeof originalImg === 'string') {
                        // Check if this original image is still in the new list
                        const stillExists = newImages.some((newImg: any) => {
                            // If newImg is a string (URL), compare directly
                            if (typeof newImg === 'string') {
                                return newImg === originalImg;
                            }
                            // If newImg is a File, it's a new upload, so original was deleted
                            return false;
                        });

                        if (!stillExists) {
                            deletedImages.push(originalImg);
                        }
                    }
                    // Skip File objects as they can't be deleted from Cloudinary
                });

                // Delete removed images from Cloudinary first
                if (deletedImages.length > 0) {
                    console.log(`Deleting ${deletedImages.length} removed images from Cloudinary:`, deletedImages);
                    await imageService.deleteImages(deletedImages);
                }

                // Upload new images and get URLs
                const imageUrls = await imageService.uploadImages(newImages);
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

            if (post && post.images && post.images.length > 0) {
                await imageService.deleteImages(post.images as string[]);
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
            console.error('Post deletion failed:', error);
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
            console.error('Error deleting conversations for post:', error);
            throw new Error(`Failed to delete conversations: ${error.message}`);
        }
    },

    // Search posts by title or description
    async searchPosts(searchTerm: string): Promise<Post[]> {
        try {
            // Note: This is a simple implementation. For better search,
            // consider using Algolia or implement a more sophisticated search
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

        const unsubscribe = onSnapshot(q, (snapshot) => {
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

        // Register with ListenerManager for tracking
        const listenerId = listenerManager.addListener(unsubscribe, 'PostService');

        // Return a wrapped unsubscribe function that also removes from ListenerManager
        return () => {
            listenerManager.removeListener(listenerId);
        };
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
            console.error('Ghost conversation detection failed:', error);
            throw new Error(`Failed to detect ghost conversations: ${error.message}`);
        }
    },

    // Detect orphaned messages (messages without parent conversations)
    async detectOrphanedMessages(): Promise<{ conversationId: string; messageId: string; reason: string }[]> {
        try {
            const orphanedMessages: { conversationId: string; messageId: string; reason: string }[] = [];

            // Get all conversations
            const conversationsSnapshot = await getDocs(collection(db, 'conversations'));

            for (const convDoc of conversationsSnapshot.docs) {
                const conversationId = convDoc.id;

                try {
                    // Check if conversation still exists
                    const convCheck = await getDoc(convDoc.ref);
                    if (!convCheck.exists()) {
                        // Conversation was deleted, check for orphaned messages
                        const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
                        const messagesSnapshot = await getDocs(messagesQuery);

                        if (messagesSnapshot.docs.length > 0) {
                            messagesSnapshot.docs.forEach(messageDoc => {
                                orphanedMessages.push({
                                    conversationId: conversationId,
                                    messageId: messageDoc.id,
                                    reason: 'Parent conversation was deleted'
                                });
                            });
                        }
                    }
                } catch (error: any) {
                    // If we can't access the conversation, it might be deleted
                    try {
                        const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
                        const messagesSnapshot = await getDocs(messagesQuery);

                        if (messagesSnapshot.docs.length > 0) {
                            messagesSnapshot.docs.forEach(messageDoc => {
                                orphanedMessages.push({
                                    conversationId: conversationId,
                                    messageId: messageDoc.id,
                                    reason: 'Cannot access parent conversation'
                                });
                            });
                        }
                    } catch (messageError: any) {
                        // Silent fail for message access errors
                    }
                }
            }

            return orphanedMessages;

        } catch (error: any) {
            console.error('Orphaned message detection failed:', error);
            throw new Error(`Failed to detect orphaned messages: ${error.message}`);
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
            console.error('Ghost conversation cleanup failed:', error);
            throw new Error(`Failed to cleanup ghost conversations: ${error.message}`);
        }
    },

    // Clean up orphaned messages
    async cleanupOrphanedMessages(orphanedMessages: { conversationId: string; messageId: string; reason: string }[]): Promise<{ success: number; failed: number; errors: string[] }> {
        try {
            const batch = writeBatch(db);
            let success = 0;
            let failed = 0;
            const errors: string[] = [];

            // Group messages by conversation for efficient deletion
            const messagesByConversation = orphanedMessages.reduce((acc, message) => {
                if (!acc[message.conversationId]) {
                    acc[message.conversationId] = [];
                }
                acc[message.conversationId].push(message);
                return acc;
            }, {} as { [conversationId: string]: typeof orphanedMessages });

            // Delete messages for each conversation
            for (const [conversationId, messages] of Object.entries(messagesByConversation)) {
                try {
                    messages.forEach(message => {
                        const messageRef = doc(db, 'conversations', conversationId, 'messages', message.messageId);
                        batch.delete(messageRef);
                    });
                } catch (error: any) {
                    failed += messages.length;
                    errors.push(`Failed to process conversation ${conversationId}: ${error.message}`);
                }
            }

            if (orphanedMessages.length > 0) {
                // Execute the batch deletion
                await batch.commit();
                success = orphanedMessages.length;
            }

            return { success, failed, errors };

        } catch (error: any) {
            console.error('Orphaned message cleanup failed:', error);
            throw new Error(`Failed to cleanup orphaned messages: ${error.message}`);
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
            console.error('Conversation integrity validation failed:', error);
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
            console.error('Periodic cleanup failed:', error);
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
            console.error('Quick health check failed:', error);
            return {
                healthy: false,
                totalConversations: 0,
                ghostCount: 0,
                issues: [`Health check failed: ${error.message}`]
            };
        }
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
