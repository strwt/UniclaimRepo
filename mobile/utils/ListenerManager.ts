/**
 * 🔧 Enhanced Listener Manager for Firebase Quota Optimization
 * 
 * This utility prevents duplicate listeners and ensures proper cleanup
 * to minimize Firebase quota consumption, especially for messaging.
 * 
 * Features:
 * - Prevents duplicate listeners for the same data
 * - Automatic cleanup on unmount
 * - Centralized listener tracking
 * - Quota optimization
 * - Specialized messaging listener management
 * - Listener pooling for shared data
 */

class ListenerManager {
    private static instance: ListenerManager;
    private activeListeners: Map<string, () => void> = new Map();
    private listenerCounts: Map<string, number> = new Map();

    // 🔍 NEW: Specialized tracking for messaging listeners
    private messageListeners: Map<string, {
        unsubscribe: () => void;
        callbacks: Set<(data: any) => void>;
        lastActivity: number;
        type: 'conversation' | 'messages' | 'user-conversations';
    }> = new Map();

    private constructor() {
        // 🔍 NEW: Start periodic cleanup of inactive message listeners
        this.startPeriodicMessageListenerCleanup();
    }

    static getInstance(): ListenerManager {
        if (!ListenerManager.instance) {
            ListenerManager.instance = new ListenerManager();
        }
        return ListenerManager.instance;
    }

    /**
     * 🔍 NEW: Start a messaging listener with deduplication
     * This prevents multiple listeners for the same conversation/messages
     */
    startMessageListener(
        key: string,
        type: 'conversation' | 'messages' | 'user-conversations',
        startListener: () => () => void,
        callback: (data: any) => void
    ): () => void {
        const existing = this.messageListeners.get(key);

        if (existing) {
            // ✅ Listener already exists, just add callback
            console.log(`📊 [QUOTA] Reusing existing ${type} listener: ${key}`);
            existing.callbacks.add(callback);
            existing.lastActivity = Date.now();

            // Return cleanup function that removes this specific callback
            return () => this.removeMessageCallback(key, callback);
        }

        // 🆕 Start new listener
        console.log(`📊 [QUOTA] Starting new ${type} listener: ${key}`);
        const unsubscribe = startListener();

        this.messageListeners.set(key, {
            unsubscribe,
            callbacks: new Set([callback]),
            lastActivity: Date.now(),
            type
        });

        // Return cleanup function that removes this specific callback
        return () => this.removeMessageCallback(key, callback);
    }

    /**
     * 🔍 NEW: Remove a specific callback from a message listener
     */
    private removeMessageCallback(key: string, callback: (data: any) => void): void {
        const existing = this.messageListeners.get(key);
        if (!existing) return;

        existing.callbacks.delete(callback);
        existing.lastActivity = Date.now();

        // If no more callbacks, remove the entire listener
        if (existing.callbacks.size === 0) {
            console.log(`📊 [QUOTA] No more callbacks for ${existing.type} listener: ${key}, cleaning up`);
            existing.unsubscribe();
            this.messageListeners.delete(key);
        }
    }

    /**
     * 🔍 NEW: Broadcast data to all callbacks for a specific listener
     */
    broadcastToCallbacks(key: string, data: any): void {
        const existing = this.messageListeners.get(key);
        if (!existing) return;

        existing.lastActivity = Date.now();
        existing.callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Error in message listener callback for ${key}:`, error);
            }
        });
    }

    /**
     * 🔍 NEW: Get messaging listener statistics
     */
    getMessageListenerStats(): {
        totalMessageListeners: number;
        activeMessageListeners: Array<{
            key: string;
            type: string;
            callbackCount: number;
            lastActivity: number;
        }>;
    } {
        const totalMessageListeners = this.messageListeners.size;
        const activeMessageListeners = Array.from(this.messageListeners.entries()).map(([key, listener]) => ({
            key,
            type: listener.type,
            callbackCount: listener.callbacks.size,
            lastActivity: listener.lastActivity
        }));

        return { totalMessageListeners, activeMessageListeners };
    }

    /**
 * 🔍 NEW: Clean up inactive message listeners (older than 5 minutes)
 */
    cleanupInactiveMessageListeners(): void {
        const now = Date.now();
        const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

        for (const [key, listener] of this.messageListeners.entries()) {
            if (now - listener.lastActivity > inactiveThreshold && listener.callbacks.size === 0) {
                console.log(`📊 [QUOTA] Cleaning up inactive ${listener.type} listener: ${key}`);
                listener.unsubscribe();
                this.messageListeners.delete(key);
            }
        }
    }

    /**
     * 🔍 NEW: Start periodic cleanup of inactive message listeners
     */
    private startPeriodicMessageListenerCleanup(): void {
        // Clean up every 2 minutes
        setInterval(() => {
            this.cleanupInactiveMessageListeners();
        }, 2 * 60 * 1000); // 2 minutes
    }

    /**
     * Start a listener if it doesn't already exist
     * @param key Unique identifier for the listener
     * @param startListener Function that starts the listener and returns unsubscribe function
     * @returns Unsubscribe function
     */
    startListener(key: string, startListener: () => () => void): () => void {
        // Check if listener already exists
        if (this.activeListeners.has(key)) {
            console.log(`📊 [QUOTA] Listener ${key} already active, reusing existing listener`);
            this.incrementListenerCount(key);

            // Return a cleanup function that decrements the count
            return () => this.decrementListenerCount(key);
        }

        // Start new listener
        console.log(`📊 [QUOTA] Starting new listener: ${key}`);
        const unsubscribe = startListener();

        // Store the listener and its cleanup function
        this.activeListeners.set(key, unsubscribe);
        this.listenerCounts.set(key, 1);

        // Return cleanup function that removes the listener completely
        return () => this.removeListener(key);
    }

    /**
     * Remove a listener completely
     * @param key Listener identifier
     */
    private removeListener(key: string): void {
        const unsubscribe = this.activeListeners.get(key);
        if (unsubscribe) {
            console.log(`📊 [QUOTA] Removing listener: ${key}`);
            unsubscribe();
            this.activeListeners.delete(key);
            this.listenerCounts.delete(key);
        }
    }

    /**
     * Increment listener count (when reusing existing listener)
     * @param key Listener identifier
     */
    private incrementListenerCount(key: string): void {
        const count = this.listenerCounts.get(key) || 0;
        this.listenerCounts.set(key, count + 1);
    }

    /**
     * Decrement listener count (when component unmounts)
     * @param key Listener identifier
     */
    private decrementListenerCount(key: string): void {
        const count = this.listenerCounts.get(key) || 0;
        if (count <= 1) {
            // Last component using this listener, remove it completely
            this.removeListener(key);
        } else {
            this.listenerCounts.set(key, count - 1);
        }
    }

    /**
     * Get current listener statistics
     */
    getListenerStats(): { totalListeners: number; activeListeners: Array<{ key: string; count: number }> } {
        const totalListeners = this.activeListeners.size;
        const activeListeners = Array.from(this.listenerCounts.entries()).map(([key, count]) => ({
            key,
            count
        }));

        return { totalListeners, activeListeners };
    }

    /**
     * Clean up all listeners (useful for testing or app shutdown)
     */
    cleanupAllListeners(): void {
        console.log(`📊 [QUOTA] Cleaning up all ${this.activeListeners.size} listeners`);
        this.activeListeners.forEach((unsubscribe, key) => {
            unsubscribe();
        });
        this.activeListeners.clear();
        this.listenerCounts.clear();

        // 🔍 NEW: Also clean up message listeners
        console.log(`📊 [QUOTA] Cleaning up all ${this.messageListeners.size} message listeners`);
        this.messageListeners.forEach((listener, key) => {
            listener.unsubscribe();
        });
        this.messageListeners.clear();
    }

    /**
     * Check if a specific listener is active
     * @param key Listener identifier
     */
    isListenerActive(key: string): boolean {
        return this.activeListeners.has(key);
    }

    /**
     * 🔍 NEW: Check if a specific message listener is active
     * @param key Message listener identifier
     */
    isMessageListenerActive(key: string): boolean {
        return this.messageListeners.has(key);
    }

    /**
     * 🔍 NEW: Get total listener count including message listeners
     */
    getTotalListenerCount(): number {
        return this.activeListeners.size + this.messageListeners.size;
    }

    /**
     * 🔍 NEW: Debug method to show current listener status
     */
    debugListenerStatus(): void {
        console.log('📊 [QUOTA] === LISTENER MANAGER STATUS ===');
        console.log(`📊 [QUOTA] Total regular listeners: ${this.activeListeners.size}`);
        console.log(`📊 [QUOTA] Total message listeners: ${this.messageListeners.size}`);
        console.log(`📊 [QUOTA] Total listeners: ${this.getTotalListenerCount()}`);

        if (this.messageListeners.size > 0) {
            console.log('📊 [QUOTA] Active message listeners:');
            this.messageListeners.forEach((listener, key) => {
                console.log(`  - ${key} (${listener.type}): ${listener.callbacks.size} callbacks, last activity: ${new Date(listener.lastActivity).toLocaleTimeString()}`);
            });
        }
        console.log('📊 [QUOTA] ================================');
    }
}

export const listenerManager = ListenerManager.getInstance();
export default ListenerManager;
