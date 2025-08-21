import { db } from './firebase';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

export const postUpdateService = {
    /**
     * Update all posts created by a specific user to include their current profile picture
     * This ensures old posts show the user's current profile picture
     */
    async updateUserPostsWithProfilePicture(userId: string, profilePictureUrl: string): Promise<void> {
        try {
            console.log(`Updating posts for user ${userId} with profile picture`);

            // Query all posts created by this user
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, where('creatorId', '==', userId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log('No posts found for user');
                return;
            }

            // Use batch write for better performance
            const batch = writeBatch(db);
            let updateCount = 0;

            querySnapshot.forEach((docSnapshot) => {
                const postData = docSnapshot.data();

                // Only update if the post doesn't have a profile picture or it's different
                if (!postData.user?.profilePicture || postData.user.profilePicture !== profilePictureUrl) {
                    batch.update(docSnapshot.ref, {
                        'user.profilePicture': profilePictureUrl,
                        updatedAt: new Date()
                    });
                    updateCount++;
                }
            });

            if (updateCount > 0) {
                await batch.commit();
                console.log(`Updated ${updateCount} posts with new profile picture`);
            } else {
                console.log('All posts already have the current profile picture');
            }

        } catch (error: any) {
            console.error('Error updating posts with profile picture:', error);
            throw new Error(`Failed to update posts: ${error.message}`);
        }
    },

    /**
     * Update a specific post's user information
     */
    async updatePostUserInfo(postId: string, userInfo: {
        firstName?: string;
        lastName?: string;
        email?: string;
        contactNum?: string;
        studentId?: string;
        profilePicture?: string;
    }): Promise<void> {
        try {
            const postRef = doc(db, 'posts', postId);

            const updateData: any = {};
            Object.entries(userInfo).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateData[`user.${key}`] = value;
                }
            });

            if (Object.keys(updateData).length > 0) {
                updateData.updatedAt = new Date();
                await updateDoc(postRef, updateData);
                console.log(`Updated post ${postId} with user info`);
            }

        } catch (error: any) {
            console.error('Error updating post user info:', error);
            throw new Error(`Failed to update post: ${error.message}`);
        }
    }
};
