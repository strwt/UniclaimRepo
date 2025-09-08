// Notification service for web app using Firebase Cloud Messaging
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './config';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { SoundUtils } from '../../utils/soundUtils';

// Notification types
export interface NotificationData {
  id: string;
  userId: string;
  type: 'new_post' | 'message' | 'claim_update' | 'admin_alert';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: any;
  postId?: string;
  conversationId?: string;
}

// User notification preferences
export interface NotificationPreferences {
  newPosts: boolean;
  messages: boolean;
  claimUpdates: boolean;
  adminAlerts: boolean;
  locationFilter: boolean;
  categoryFilter: string[];
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private messaging: any = null;
  private fcmToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize Firebase Cloud Messaging
  async initializeMessaging(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return false;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // For now, skip FCM setup and just use browser notifications
      // This allows the notification system to work without push notifications
      console.log('Notification permission granted, using browser notifications');
      return true;
    } catch (error) {
      console.error('Error initializing messaging:', error);
      return false;
    }
  }

  // Save FCM token to user's document
  async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      // For now, just log that we would save the token
      // In a real implementation, you would save the FCM token here
      console.log('Would save FCM token for user:', userId, 'Token:', token);

      // Uncomment this when you have a proper VAPID key:
      // await updateDoc(doc(db, 'users', userId), {
      //   fcmToken: token,
      //   fcmTokenUpdatedAt: serverTimestamp()
      // });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  // Setup message listener for foreground notifications
  setupMessageListener(): void {
    // For now, skip FCM message listener setup
    // This will be enabled when FCM is properly configured
    console.log('Message listener setup skipped (FCM not configured)');
  }

  // Show browser notification
  async showNotification(title: string, body: string, data?: any): Promise<void> {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/uniclaim_logo.png',
        data
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Play notification sound
      try {
        const notificationType = data?.type || 'new_post';
        await SoundUtils.playNotificationSoundByType(notificationType);
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
  }

  // Get user's notifications
  async getUserNotifications(userId: string, limitCount: number = 20): Promise<NotificationData[]> {
    if (!userId) return [];

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificationData));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get user's notification preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.notificationPreferences || this.getDefaultPreferences();
      }
      return this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  // Update user's notification preferences
  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        notificationPreferences: preferences
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  // Delete a single notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      console.log('Successfully deleted notification:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all notifications for a user
  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
      console.log(`Successfully deleted ${snapshot.size} notifications for user:`, userId);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  // Get default notification preferences
  private getDefaultPreferences(): NotificationPreferences {
    return {
      newPosts: true,
      messages: true,
      claimUpdates: true,
      adminAlerts: true,
      locationFilter: false,
      categoryFilter: [],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }
}

export const notificationService = NotificationService.getInstance();
