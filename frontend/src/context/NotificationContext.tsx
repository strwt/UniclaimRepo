// Notification context for managing notification state
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/firebase/notifications';
import { SoundUtils } from '../utils/soundUtils';

// Inline type definition to avoid import issues
interface NotificationData {
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

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  showNotification: (title: string, body: string, data?: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, userData } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userData?.uid) {
      // Add a small delay to ensure authentication is fully processed
      const timer = setTimeout(() => {
        loadNotifications();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, userData?.uid]);

  // Set up real-time listener for notifications
  useEffect(() => {
    if (!isAuthenticated || !userData?.uid) return;

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, userData?.uid]);

  // Handle playing notification sounds asynchronously
  const playNotificationSounds = async (newNotifications: any[], userId: string) => {
    try {
      const userPreferences = await notificationService.getNotificationPreferences(userId);
      if (userPreferences.soundEnabled) {
        newNotifications.forEach(async (notification) => {
          try {
            await SoundUtils.playNotificationSoundByType(notification.type);
          } catch (error) {
            console.error('Error playing notification sound:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error checking sound preferences:', error);
      // Fallback: play sound if we can't check preferences
      newNotifications.forEach(async (notification) => {
        try {
          await SoundUtils.playNotificationSoundByType(notification.type);
        } catch (error) {
          console.error('Error playing notification sound:', error);
        }
      });
    }
  };

  const loadNotifications = async () => {
    if (!userData?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      const userNotifications = await notificationService.getUserNotifications(userData.uid, 50);
      
      // Check for new notifications and play sound
      setNotifications(prevNotifications => {
        const newNotifications = userNotifications.filter(newNotif => 
          !prevNotifications.some(prevNotif => prevNotif.id === newNotif.id)
        );
        
        // Play sound for new notifications (if enabled in preferences)
        if (newNotifications.length > 0) {
          // Handle sound playing asynchronously outside of setState
          playNotificationSounds(newNotifications, userData.uid);
        }
        
        return userNotifications;
      });
      
      const unread = await notificationService.getUnreadCount(userData.uid);
      setUnreadCount(unread);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!userData?.uid) return;

    try {
      await notificationService.markAllNotificationsAsRead(userData.uid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const showNotification = async (title: string, body: string, data?: any) => {
    try {
      await notificationService.showNotification(title, body, data);
    } catch (err: any) {
      console.error('Error showing notification:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state - remove the deleted notification
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(notif => notif.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  };

  const deleteAllNotifications = async () => {
    if (!userData?.uid) return;

    try {
      await notificationService.deleteAllNotifications(userData.uid);
      
      // Update local state - clear all notifications
      setNotifications([]);
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error deleting all notifications:', err);
      setError('Failed to delete all notifications');
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
