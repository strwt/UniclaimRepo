// Minimal notification service to test exports
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

export interface NotificationPreferences {
    newPosts: boolean;
    messages: boolean;
    claimUpdates: boolean;
    adminAlerts: boolean;
    locationFilter: boolean;
    categoryFilter: string[];
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
}

export class NotificationService {
    static getInstance() {
        return new NotificationService();
    }

    async getUserNotifications() {
        return [];
    }

    async getUnreadCount() {
        return 0;
    }

    async markNotificationAsRead() {
        // Mock implementation
    }

    async markAllNotificationsAsRead() {
        // Mock implementation
    }

    async showNotification() {
        // Mock implementation
    }
}

export const notificationService = NotificationService.getInstance();
