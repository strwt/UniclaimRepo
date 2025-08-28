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
    writeBatch,
    increment
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
    status?: 'active' | 'banned'; // User account status
    banInfo?: any; // Ban information
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
                profilePicture: require('../assets/images/empty_profile.jpg'), // Set default profile picture
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
            // Fetch post details to get type, status, and creator ID
            let postType: "lost" | "found" = "lost";
            let postStatus: "pending" | "resolved" | "rejected" = "pending";
            let postCreatorId = postOwnerId; // Default to post owner ID
            let foundAction: "keep" | "turnover to OSA" | "turnover to Campus Security" | undefined = undefined;

            try {
                const postDoc = await getDoc(doc(db, 'posts', postId));
                if (postDoc.exists()) {
                    const postData = postDoc.data();
                    postType = postData.type || "lost";
                    postStatus = postData.status || "pending";
                    postCreatorId = postData.creatorId || postOwnerId;
                    foundAction = postData.foundAction; // Include foundAction for found items
                }
            } catch (error) {
                console.warn('Could not fetch post data:', error);
                // Continue with default values if fetch fails
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
                return existingConversation.id;
            }

            // Build conversation data dynamically to avoid undefined fields
            const conversationData: any = {
                postId,
                postTitle,
                // New fields for handover button functionality
                postType,
                postStatus,
                postCreatorId,
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
                        profilePicture: postOwnerUserData?.profilePicture || null, // Ensure null instead of undefined
                        joinedAt: serverTimestamp()
                    }
                },
                createdAt: serverTimestamp()
            };

            // Only include foundAction if it has a valid value (not undefined)
            if (foundAction !== undefined) {
                conversationData.foundAction = foundAction;
            }

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
                readBy: [senderId],
                messageType: "text" // Default message type
            };

            await addDoc(messagesRef, messageData);

            // Get conversation data to find other participants
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();
            const participantIds = Object.keys(conversationData.participants || {});

            // Increment unread count for all participants except the sender
            const otherParticipantIds = participantIds.filter(id => id !== senderId);

            // Prepare unread count updates for each receiver
            const unreadCountUpdates: { [key: string]: any } = {};
            otherParticipantIds.forEach(participantId => {
                unreadCountUpdates[`unreadCounts.${participantId}`] = increment(1);
            });

            // Update conversation with last message and increment unread counts for other participants
            await updateDoc(conversationRef, {
                lastMessage: {
                    text,
                    senderId,
                    timestamp: serverTimestamp()
                },
                ...unreadCountUpdates
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

    // Send a handover request message
    async sendHandoverRequest(conversationId: string, senderId: string, senderName: string, senderProfilePicture: string, postId: string, postTitle: string): Promise<void> {
        try {
            // First, check if this conversation already has a handover request
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();

            // Check if this is a lost item (only allow handover for lost items)
            if (conversationData.postType !== 'lost') {
                throw new Error('Handover requests are only allowed for lost items');
            }

            // Check if a handover request already exists
            if (conversationData.handoverRequested === true) {
                throw new Error('You have already requested a handover in this conversation');
            }

            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const handoverMessage = {
                senderId,
                senderName,
                senderProfilePicture: senderProfilePicture || null,
                text: `I would like to handover the item "${postTitle}" to you.`,
                timestamp: serverTimestamp(),
                readBy: [senderId],
                messageType: "handover_request",
                handoverData: {
                    postId,
                    postTitle,
                    status: "pending",
                    requestedAt: serverTimestamp()
                }
            };

            await addDoc(messagesRef, handoverMessage);

            // Get conversation data to find other participants for unread count updates
            const conversationDataForUnread = await getDoc(conversationRef);
            const participantIds = Object.keys(conversationDataForUnread.data()?.participants || {});

            // Increment unread count for all participants except the sender
            const otherParticipantIds = participantIds.filter(id => id !== senderId);

            // Prepare unread count updates for each receiver
            const unreadCountUpdates: { [key: string]: any } = {};
            otherParticipantIds.forEach(participantId => {
                unreadCountUpdates[`unreadCounts.${participantId}`] = increment(1);
            });

            // Update conversation with handover request flag, last message, and unread counts
            await updateDoc(conversationRef, {
                handoverRequested: true,
                lastMessage: {
                    text: handoverMessage.text,
                    senderId,
                    timestamp: handoverMessage.timestamp
                },
                ...unreadCountUpdates
            });

        } catch (error: any) {
            console.error('❌ Mobile: Failed to send handover request:', error);
            throw new Error(error.message || 'Failed to send handover request');
        }
    },

    // Send a claim request message
    async sendClaimRequest(conversationId: string, senderId: string, senderName: string, senderProfilePicture: string, postId: string, postTitle: string): Promise<void> {
        try {
            // First, check if this conversation already has a claim request
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();

            // Check if this is a found item with "keep" action (only allow claims for found items that are being kept)
            if (conversationData.postType !== 'found') {
                throw new Error('Claim requests are only allowed for found items');
            }

            // Allow claims if foundAction is 'keep' or undefined (posts without explicit action)
            if (conversationData.foundAction !== undefined && conversationData.foundAction !== 'keep') {
                throw new Error('Claim requests are only allowed for found items that are being kept');
            }

            // Check if a claim request already exists
            if (conversationData.claimRequested === true) {
                throw new Error('You have already requested to claim this item in this conversation');
            }

            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const claimMessage = {
                senderId,
                senderName,
                senderProfilePicture: senderProfilePicture || null,
                text: `I would like to claim the item "${postTitle}" as my own.`,
                timestamp: serverTimestamp(),
                readBy: [senderId],
                messageType: "claim_request",
                claimData: {
                    postId,
                    postTitle,
                    status: "pending",
                    requestedAt: serverTimestamp()
                }
            };

            await addDoc(messagesRef, claimMessage);

            // Get conversation data to find other participants for unread count updates
            const conversationDataForUnread = await getDoc(conversationRef);
            const participantIds = Object.keys(conversationDataForUnread.data()?.participants || {});

            // Increment unread count for all participants except the sender
            const otherParticipantIds = participantIds.filter(id => id !== senderId);

            // Prepare unread count updates for each receiver
            const unreadCountUpdates: { [key: string]: any } = {};
            otherParticipantIds.forEach(participantId => {
                unreadCountUpdates[`unreadCounts.${participantId}`] = increment(1);
            });

            // Update conversation with claim request flag, last message, and unread counts
            await updateDoc(conversationRef, {
                claimRequested: true,
                lastMessage: {
                    text: claimMessage.text,
                    senderId,
                    timestamp: claimMessage.timestamp
                },
                ...unreadCountUpdates
            });

        } catch (error: any) {
            console.error('❌ Mobile: Failed to send claim request:', error);
            throw new Error(error.message || 'Failed to send claim request');
        }
    },

    // Update claim response
    async updateClaimResponse(conversationId: string, messageId: string, status: 'accepted' | 'rejected', responderId: string, idPhotoUrl?: string): Promise<void> {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);

            // Update the claim message with the response
            const updateData: any = {
                'claimData.status': status,
                'claimData.respondedAt': serverTimestamp(),
                'claimData.responderId': responderId
            };

            // If accepting with ID photo, add the photo URL and change status to pending confirmation
            if (status === 'accepted' && idPhotoUrl) {
                updateData['claimData.idPhotoUrl'] = idPhotoUrl;
                updateData['claimData.status'] = 'pending_confirmation'; // New status for photo confirmation
            }

            await updateDoc(messageRef, updateData);

            // If claim is rejected, reset the claimRequested flag to allow new requests
            if (status === 'rejected') {
                const conversationRef = doc(db, 'conversations', conversationId);
                await updateDoc(conversationRef, {
                    claimRequested: false
                });
            }

            console.log('✅ Mobile: Claim response updated successfully');

        } catch (error: any) {
            console.error('❌ Mobile: Failed to update claim response:', error);
            throw new Error(error.message || 'Failed to update claim response');
        }
    },

    // Confirm ID photo for claim
    async confirmClaimIdPhoto(conversationId: string, messageId: string, confirmBy: string): Promise<void> {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);

            // Update the claim message to confirm the ID photo
            await updateDoc(messageRef, {
                'claimData.idPhotoConfirmed': true,
                'claimData.idPhotoConfirmedAt': serverTimestamp(),
                'claimData.idPhotoConfirmedBy': confirmBy,
                'claimData.status': 'accepted' // Final status after confirmation
            });

            console.log('✅ Mobile: Claim ID photo confirmed successfully');

            // STEP 2: Auto-resolve the post after ID confirmation
            // Get conversation data to retrieve postId
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationSnap = await getDoc(conversationRef);

            if (conversationSnap.exists()) {
                const conversationData = conversationSnap.data();
                const postId = conversationData.postId;

                if (postId) {
                    // Update post status to resolved
                    await updateDoc(doc(db, 'posts', postId), {
                        status: 'resolved',
                        updatedAt: serverTimestamp()
                    });
                    console.log('✅ Mobile: Post auto-resolved after ID photo confirmation:', postId);
                } else {
                    console.warn('⚠️ Mobile: No postId found in conversation, cannot auto-resolve');
                }
            } else {
                console.warn('⚠️ Mobile: Conversation not found, cannot auto-resolve post');
            }

        } catch (error: any) {
            console.error('❌ Mobile: Failed to confirm claim ID photo:', error);
            throw new Error(error.message || 'Failed to confirm claim ID photo');
        }
    },

    // Update handover response with ID photo
    async updateHandoverResponse(conversationId: string, messageId: string, status: 'accepted' | 'rejected', responderId: string, idPhotoUrl?: string): Promise<void> {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);

            // Update the handover message with the response and ID photo
            const updateData: any = {
                'handoverData.status': status,
                'handoverData.respondedAt': serverTimestamp(),
                'handoverData.responderId': responderId
            };

            // If accepting with ID photo, add the photo URL and change status to pending confirmation
            if (status === 'accepted' && idPhotoUrl) {
                updateData['handoverData.idPhotoUrl'] = idPhotoUrl;
                updateData['handoverData.status'] = 'pending_confirmation'; // New status for photo confirmation
            }

            await updateDoc(messageRef, updateData);

            // If handover is rejected, reset the handoverRequested flag to allow new requests
            if (status === 'rejected') {
                const conversationRef = doc(db, 'conversations', conversationId);
                await updateDoc(conversationRef, {
                    handoverRequested: false
                });
            }

            // Note: No new chat bubble is created - only the status is updated
            // The existing handover request message will show the updated status

        } catch (error: any) {
            console.error('❌ Mobile: Failed to update handover response:', error);
            throw new Error(error.message || 'Failed to update handover response');
        }
    },

    // Confirm ID photo for handover
    async confirmHandoverIdPhoto(conversationId: string, messageId: string, confirmBy: string): Promise<void> {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);

            // Update the handover message to confirm the ID photo
            await updateDoc(messageRef, {
                'handoverData.idPhotoConfirmed': true,
                'handoverData.idPhotoConfirmedAt': serverTimestamp(),
                'handoverData.idPhotoConfirmedBy': confirmBy,
                'handoverData.status': 'accepted' // Final status after confirmation
            });

        } catch (error: any) {
            console.error('❌ Mobile: Failed to confirm handover ID photo:', error);
            throw new Error(error.message || 'Failed to confirm handover ID photo');
        }
    },

    // Get conversation data (for handover button logic)
    async getConversation(conversationId: string): Promise<any> {
        try {
            const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
            if (conversationDoc.exists()) {
                return {
                    id: conversationDoc.id,
                    ...conversationDoc.data()
                };
            }
            return null;
        } catch (error: any) {
            console.error('❌ Mobile: Failed to get conversation:', error);
            throw new Error(error.message || 'Failed to get conversation');
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

    // Mark conversation as read
    async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
        try {
            // Reset the unread count for the specific user who is reading the conversation
            await updateDoc(doc(db, 'conversations', conversationId), {
                [`unreadCounts.${userId}`]: 0
            });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to mark conversation as read');
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
    },

    // Delete a message (only the sender can delete their own messages)
    async deleteMessage(conversationId: string, messageId: string, currentUserId: string): Promise<void> {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);

            // Get the message to verify ownership
            const messageDoc = await getDoc(messageRef);
            if (!messageDoc.exists()) {
                throw new Error('Message not found');
            }

            const messageData = messageDoc.data();

            // Security check: Only the sender can delete their message
            if (messageData.senderId !== currentUserId) {
                throw new Error('You can only delete your own messages');
            }

            // NEW: Extract and delete images from Cloudinary before deleting the message
            try {
                console.log('🗑️ Mobile: Starting image cleanup for message type:', messageData.messageType);
                const { extractMessageImages, deleteMessageImages } = await import('./cloudinary');
                const imageUrls = extractMessageImages(messageData);

                console.log(`🗑️ Mobile: Found ${imageUrls.length} images to delete`);
                if (imageUrls.length > 0) {
                    console.log('🗑️ Mobile: Images to delete:', imageUrls.map(url => url.split('/').pop()));
                    const imageDeletionResult = await deleteMessageImages(imageUrls);

                    if (!imageDeletionResult.success) {
                        console.warn(`⚠️ Mobile: Image deletion completed with some failures. Deleted: ${imageDeletionResult.deleted.length}, Failed: ${imageDeletionResult.failed.length}`);
                    }
                }
            } catch (imageError: any) {
                console.warn('Failed to delete images from Cloudinary, but continuing with message deletion:', imageError.message);
                // Continue with message deletion even if image deletion fails
            }

            // Check message types before deleting
            const isHandoverRequest = messageData.messageType === 'handover_request';
            const isClaimRequest = messageData.messageType === 'claim_request';

            // Delete the message
            await deleteDoc(messageRef);

            // Reset flags based on message type
            const conversationRef = doc(db, 'conversations', conversationId);

            if (isHandoverRequest) {
                await updateDoc(conversationRef, {
                    handoverRequested: false
                });
                console.log('🗑️ Mobile: Reset handoverRequested flag');
            } else if (isClaimRequest) {
                await updateDoc(conversationRef, {
                    claimRequested: false
                });
                console.log('🗑️ Mobile: Reset claimRequested flag');
            }

        } catch (error: any) {
            throw new Error(error.message || 'Failed to delete message');
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
                                profilePicture: null,
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

// Utility function to sanitize user data before saving to Firestore
export const sanitizeUserData = (userData: any): any => {
    if (!userData) return userData;

    const sanitized = { ...userData };

    // Ensure profilePicture is never undefined
    if (sanitized.profilePicture === undefined) {
        sanitized.profilePicture = null;
    }

    // Ensure all string fields are never undefined
    const stringFields = ['firstName', 'lastName', 'email', 'contactNum', 'studentId'];
    stringFields.forEach(field => {
        if (sanitized[field] === undefined) {
            sanitized[field] = '';
        }
    });

    return sanitized;
};

// Utility function to sanitize post data before saving to Firestore
export const sanitizePostData = (postData: any): any => {
    if (!postData) return postData;

    const sanitized = { ...postData };

    // Sanitize user object within post
    if (sanitized.user) {
        sanitized.user = sanitizeUserData(sanitized.user);
    }

    // Ensure other optional fields are never undefined
    if (sanitized.coordinates === undefined) {
        sanitized.coordinates = null;
    }

    if (sanitized.foundAction === undefined) {
        sanitized.foundAction = null;
    }

    return sanitized;
};

// Helper function to check if error is a permission error (expected during logout)
const isPermissionError = (error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code || '';

    // Check for common permission error patterns
    return (
        errorCode === 'permission-denied' ||
        errorCode === 'PERMISSION_DENIED' ||
        errorMessage.includes('Missing or insufficient permissions') ||
        errorMessage.includes('permission-denied') ||
        errorMessage.includes('PERMISSION_DENIED') ||
        errorMessage.includes('not authorized') ||
        errorMessage.includes('authentication required')
    );
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

            // Sanitize post data to ensure no undefined values are sent to Firestore
            const sanitizedPostData = sanitizePostData(postData);

            // Create post document
            const post: Post = {
                ...sanitizedPostData,
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
            if (isPermissionError(error)) {
                // This is expected during logout - don't log as error
                console.log('Posts listener permission error (expected during logout):', error.message);
            } else {
                console.error('Error fetching posts:', error);
            }
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
        }, (error) => {
            if (isPermissionError(error)) {
                // This is expected during logout - don't log as error
                console.log('Posts by type listener permission error (expected during logout):', error.message);
            } else {
                console.error('Error fetching posts by type:', error);
            }
            callback([]);
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
        }, (error) => {
            if (isPermissionError(error)) {
                // This is expected during logout - don't log as error
                console.log('Posts by category listener permission error (expected during logout):', error.message);
            } else {
                console.error('Error fetching posts by category:', error);
            }
            callback([]);
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
            if (isPermissionError(error)) {
                // This is expected during logout - don't log as error
                console.log('User posts listener permission error (expected during logout):', error.message);
            } else {
                console.error('Error fetching user posts:', error);
            }
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



    // Revert post resolution - change resolved post back to pending and reset related claim request
    async revertPostResolution(postId: string, adminId: string, reason?: string): Promise<void> {
        try {
            // STEP 3: Change post status back to pending
            await updateDoc(doc(db, 'posts', postId), {
                status: 'pending',
                updatedAt: serverTimestamp()
            });
            console.log('✅ Mobile: Post status reverted to pending:', postId);

            // STEP 4: Find and reset related claim/handover request
            // Query conversations that reference this postId
            const conversationsQuery = query(
                collection(db, 'conversations'),
                where('postId', '==', postId)
            );
            const conversationsSnap = await getDocs(conversationsQuery);

            if (!conversationsSnap.empty) {
                // Process each conversation (there should typically be only one)
                for (const conversationDoc of conversationsSnap.docs) {
                    const conversationId = conversationDoc.id;

                    // Query messages in this conversation to find claim/handover requests
                    const messagesQuery = query(
                        collection(db, 'conversations', conversationId, 'messages'),
                        where('messageType', 'in', ['claim_request', 'handover_request'])
                    );
                    const messagesSnap = await getDocs(messagesQuery);

                    // Reset the most recent claim/handover request
                    for (const messageDoc of messagesSnap.docs) {
                        const messageData = messageDoc.data();
                        const messageId = messageDoc.id;

                        if (messageData.claimData?.status === 'accepted' && messageData.claimData?.idPhotoConfirmed) {
                            // Reset claim request
                            await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
                                'claimData.status': 'pending_confirmation',
                                'claimData.idPhotoConfirmed': false,
                                'claimData.idPhotoConfirmedAt': null,
                                'claimData.idPhotoConfirmedBy': null,
                                updatedAt: serverTimestamp()
                            });
                            console.log('✅ Mobile: Claim request reset for message:', messageId);
                        } else if (messageData.handoverData?.status === 'accepted' && messageData.handoverData?.idPhotoConfirmed) {
                            // Reset handover request
                            await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
                                'handoverData.status': 'pending_confirmation',
                                'handoverData.idPhotoConfirmed': false,
                                'handoverData.idPhotoConfirmedAt': null,
                                'handoverData.idPhotoConfirmedBy': null,
                                updatedAt: serverTimestamp()
                            });
                            console.log('✅ Mobile: Handover request reset for message:', messageId);
                        }
                    }
                }
            }

            // STEP 5: Create audit log entry
            await addDoc(collection(db, 'audit_logs'), {
                action: 'revert_resolution',
                postId,
                adminId,
                reason: reason || 'Admin reverted resolution',
                timestamp: serverTimestamp()
            });
            console.log('✅ Mobile: Audit log created for revert action');

        } catch (error: any) {
            console.error('❌ Mobile: Failed to revert post resolution:', error);
            throw new Error(error.message || 'Failed to revert post resolution');
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
