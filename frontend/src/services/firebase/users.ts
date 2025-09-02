// User service for Firebase - handles user profile management and profile picture recovery
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

// Import Firebase instances and types
import { db } from './config';
import type { UserData } from './types';

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
