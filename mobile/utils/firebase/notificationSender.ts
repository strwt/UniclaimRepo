// Mobile notification sender service for sending notifications to users when posts are created
import { db } from './config';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { notificationService } from './notifications';

// Notification data structure
export interface PostNotificationData {
    type: 'new_post';
    title: string;
    body: string;
    postId: string;
    postTitle: string;
    postCategory: string;
    postLocation: string;
    postType: 'lost' | 'found';
    creatorId: string;
    creatorName: string;
}

export class NotificationSender {
    private static instance: NotificationSender;

    static getInstance(): NotificationSender {
        if (!NotificationSender.instance) {
            NotificationSender.instance = new NotificationSender();
        }
        return NotificationSender.instance;
    }

    // Send notification to all active users when a new post is created
    async sendNewPostNotification(postData: {
        id: string;
        title: string;
        category: string;
        location: string;
        type: 'lost' | 'found';
        creatorId: string;
        creatorName: string;
    }): Promise<void> {
        try {
            console.log('Sending new post notification for:', postData.title);

            // Get all active users (excluding the post creator)
            const usersSnapshot = await getDocs(
                query(
                    collection(db, 'users'),
                    where('status', '==', 'active')
                )
            );

            const notifications = [];

            // Create notification for each user (except the creator)
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const userId = userDoc.id;

                // Skip the post creator
                if (userId === postData.creatorId) {
                    continue;
                }

                // Check if user should receive this notification
                const shouldNotify = await this.shouldNotifyUser(userId, postData);
                if (!shouldNotify) {
                    continue;
                }

                // Create notification data
                const notificationData = {
                    userId,
                    type: 'new_post' as const,
                    title: this.generateNotificationTitle(postData),
                    body: this.generateNotificationBody(postData),
                    data: {
                        postId: postData.id,
                        postTitle: postData.title,
                        postCategory: postData.category,
                        postLocation: postData.location,
                        postType: postData.type,
                        creatorId: postData.creatorId,
                        creatorName: postData.creatorName
                    },
                    read: false,
                    createdAt: serverTimestamp(),
                    postId: postData.id
                };

                notifications.push(notificationData);
            }

            // Batch create all notifications
            if (notifications.length > 0) {
                const batch = notifications.map(notification =>
                    addDoc(collection(db, 'notifications'), notification)
                );

                await Promise.all(batch);
                console.log(`Sent ${notifications.length} new post notifications`);

                // Send push notifications to users' phones
                for (const notification of notifications) {
                    try {
                        await notificationService.sendPushNotification(
                            notification.userId,
                            notification.title,
                            notification.body,
                            {
                                type: notification.type,
                                postId: notification.postId,
                                postTitle: notification.postTitle,
                                postCategory: notification.postCategory,
                                postLocation: notification.postLocation,
                                postType: notification.postType
                            }
                        );
                    } catch (error) {
                        console.error('Error sending push notification to user:', notification.userId, error);
                    }
                }
            } else {
                console.log('No users to notify for this post');
            }

        } catch (error) {
            console.error('Error sending new post notifications:', error);
        }
    }

    // Check if a user should receive a notification based on their preferences
    private async shouldNotifyUser(userId: string, postData: any): Promise<boolean> {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                return false;
            }

            const userData = userDoc.data();
            const preferences = userData.notificationPreferences;

            // If no preferences set, default to true
            if (!preferences) {
                return true;
            }

            // Check if new post notifications are enabled
            if (!preferences.newPosts) {
                return false;
            }

            // Check quiet hours
            if (preferences.quietHours?.enabled) {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                const startTime = this.timeToMinutes(preferences.quietHours.start);
                const endTime = this.timeToMinutes(preferences.quietHours.end);

                if (startTime > endTime) {
                    // Quiet hours span midnight
                    if (currentTime >= startTime || currentTime <= endTime) {
                        return false;
                    }
                } else {
                    // Normal quiet hours
                    if (currentTime >= startTime && currentTime <= endTime) {
                        return false;
                    }
                }
            }

            // Check category filter
            if (preferences.categoryFilter && preferences.categoryFilter.length > 0) {
                if (!preferences.categoryFilter.includes(postData.category)) {
                    return false;
                }
            }

            // TODO: Add location-based filtering
            // This would require user location data and post location matching

            return true;
        } catch (error) {
            console.error('Error checking user notification preferences:', error);
            return true; // Default to sending if there's an error
        }
    }

    // Generate notification title based on post data
    private generateNotificationTitle(postData: any): string {
        if (postData.type === 'lost') {
            return `🔍 New Lost Item: ${postData.title}`;
        } else {
            return `🎯 New Found Item: ${postData.title}`;
        }
    }

    // Generate notification body based on post data
    private generateNotificationBody(postData: any): string {
        const location = postData.location || 'Unknown location';
        const category = postData.category || 'General';

        if (postData.type === 'lost') {
            return `Someone lost a ${category.toLowerCase()} at ${location}. Can you help?`;
        } else {
            return `Someone found a ${category.toLowerCase()} at ${location}. Is it yours?`;
        }
    }

    // Helper function to convert time string to minutes
    private timeToMinutes(timeString: string): number {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Send notification to specific users (for admin alerts, etc.)
    async sendNotificationToUsers(userIds: string[], notificationData: {
        type: 'admin_alert' | 'claim_update' | 'message';
        title: string;
        body: string;
        data?: any;
    }): Promise<void> {
        try {
            const notifications = userIds.map(userId => ({
                userId,
                ...notificationData,
                read: false,
                createdAt: serverTimestamp()
            }));

            const batch = notifications.map(notification =>
                addDoc(collection(db, 'notifications'), notification)
            );

            await Promise.all(batch);
            console.log(`Sent ${notifications.length} notifications to specific users`);
        } catch (error) {
            console.error('Error sending notifications to specific users:', error);
        }
    }
}

// Export singleton instance
export const notificationSender = NotificationSender.getInstance();
