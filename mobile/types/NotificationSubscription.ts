// Notification subscription types for optimized notification delivery (Mobile)
export interface NotificationSubscription {
    userId: string;
    preferences: {
        newPosts: boolean;
        messages: boolean;
        claimUpdates: boolean;
        adminAlerts: boolean;
        categories: string[];        // ["electronics", "books", "clothing"]
        locations: string[];         // ["campus_a", "library", "gym"]
        quietHours: {
            enabled: boolean;
            start: string;            // "22:00"
            end: string;              // "08:00"
        };
        soundEnabled: boolean;
    };
    lastUpdated: any;             // Firestore timestamp
    isActive: boolean;            // User is active and should receive notifications
}

// Default subscription preferences for new users
export const DEFAULT_SUBSCRIPTION_PREFERENCES = {
    newPosts: true,
    messages: true,
    claimUpdates: true,
    adminAlerts: true,
    categories: [],               // Empty = interested in all categories
    locations: [],                // Empty = interested in all locations
    quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00"
    },
    soundEnabled: true
};

// Helper type for creating subscriptions
export interface CreateSubscriptionData {
    userId: string;
    preferences?: Partial<NotificationSubscription['preferences']>;
    isActive?: boolean;
}

// Helper type for updating subscriptions
export interface UpdateSubscriptionData {
    preferences?: Partial<NotificationSubscription['preferences']>;
    isActive?: boolean;
}