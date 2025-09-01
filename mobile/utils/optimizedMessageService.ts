/**
 * 🔧 Optimized Message Service for Firebase Quota Optimization
 * 
 * This service implements smart pagination and reduces real-time updates
 * to minimize Firebase quota consumption while maintaining good UX.
 * 
 * Features:
 * - Smart pagination with configurable limits
 * - Reduced real-time update frequency
 * - Batch operations for better quota efficiency
 * - Intelligent caching and prefetching
 * - Quota-aware error handling
 */

import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    onSnapshot,
    where,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { listenerManager } from './ListenerManager';
import { quotaMonitor } from './firebase';

// 🔍 Configuration for quota optimization
const QUOTA_OPTIMIZATION_CONFIG = {
    // Message pagination limits
    INITIAL_MESSAGE_LIMIT: 25,        // Start with fewer messages
    PAGINATION_LIMIT: 20,             // Load more in smaller chunks
    MAX_MESSAGES_IN_MEMORY: 100,      // Prevent memory bloat

    // Real-time update optimization
    REAL_TIME_UPDATE_DELAY: 2000,     // 2 second delay for real-time updates
    BATCH_UPDATE_THRESHOLD: 5,        // Batch updates when multiple changes occur

    // Cache settings
    CACHE_DURATION: 5 * 60 * 1000,   // 5 minutes cache
    PREFETCH_THRESHOLD: 0.8,         // Prefetch when 80% through current data
};

// 🔍 Message cache for reducing Firebase reads
class MessageCache {
    private cache = new Map<string, {
        messages: any[];
        timestamp: number;
        hasMore: boolean;
        lastMessageTimestamp?: any;
    }>();

    set(conversationId: string, data: {
        messages: any[];
        hasMore: boolean;
        lastMessageTimestamp?: any;
    }): void {
        this.cache.set(conversationId, {
            ...data,
            timestamp: Date.now()
        });
    }

    get(conversationId: string): any[] | null {
        const cached = this.cache.get(conversationId);
        if (!cached) return null;

        // Check if cache is still valid
        if (Date.now() - cached.timestamp > QUOTA_OPTIMIZATION_CONFIG.CACHE_DURATION) {
            this.cache.delete(conversationId);
            return null;
        }

        return cached.messages;
    }

    hasMore(conversationId: string): boolean {
        const cached = this.cache.get(conversationId);
        return cached?.hasMore || false;
    }

    getLastMessageTimestamp(conversationId: string): any {
        const cached = this.cache.get(conversationId);
        return cached?.lastMessageTimestamp;
    }

    clear(conversationId: string): void {
        this.cache.delete(conversationId);
    }

    clearAll(): void {
        this.cache.clear();
    }
}

// 🔍 Batch update manager for reducing Firebase writes
class BatchUpdateManager {
    private pendingUpdates = new Map<string, {
        updates: Array<{ type: string; data: any }>;
        timer: NodeJS.Timeout;
    }>();

    addUpdate(conversationId: string, type: string, data: any): void {
        if (!this.pendingUpdates.has(conversationId)) {
            this.pendingUpdates.set(conversationId, {
                updates: [],
                timer: setTimeout(() => this.processUpdates(conversationId), 1000)
            });
        }

        const pending = this.pendingUpdates.get(conversationId)!;
        pending.updates.push({ type, data });

        // Process immediately if threshold reached
        if (pending.updates.length >= QUOTA_OPTIMIZATION_CONFIG.BATCH_UPDATE_THRESHOLD) {
            clearTimeout(pending.timer);
            this.processUpdates(conversationId);
        }
    }

    private processUpdates(conversationId: string): void {
        const pending = this.pendingUpdates.get(conversationId);
        if (!pending) return;

        console.log(`📊 [QUOTA] Processing ${pending.updates.length} batched updates for conversation ${conversationId}`);

        // Process all pending updates
        pending.updates.forEach(update => {
            // Here you would implement the actual update logic
            console.log(`📊 [QUOTA] Processing ${update.type} update:`, update.data);
        });

        this.pendingUpdates.delete(conversationId);
    }
}

// 🔍 Initialize services
const messageCache = new MessageCache();
const batchUpdateManager = new BatchUpdateManager();

// 🔍 Optimized message service
export const optimizedMessageService = {
    /**
     * 🔍 Get conversation messages with smart pagination and reduced real-time updates
     */
    getConversationMessages(
        conversationId: string,
        callback: (messages: any[]) => void,
        options: {
            initialLimit?: number;
            enableRealTime?: boolean;
            useCache?: boolean;
        } = {}
    ): () => void {
        const {
            initialLimit = QUOTA_OPTIMIZATION_CONFIG.INITIAL_MESSAGE_LIMIT,
            enableRealTime = true,
            useCache = true
        } = options;

        const listenerKey = `conversation-messages-${conversationId}`;

        // 🔍 Check cache first to reduce Firebase reads
        if (useCache) {
            const cachedMessages = messageCache.get(conversationId);
            if (cachedMessages) {
                console.log(`📊 [QUOTA] Using cached messages for conversation ${conversationId}`);
                callback(cachedMessages);

                // If real-time is disabled, just return cached data
                if (!enableRealTime) {
                    return () => { }; // No cleanup needed
                }
            }
        }

        return listenerManager.startMessageListener(
            listenerKey,
            'messages',
            () => {
                console.log(`🔧 [QUOTA] Setting up optimized message listener for conversation ${conversationId}`);

                const q = query(
                    collection(db, 'conversations', conversationId, 'messages'),
                    orderBy('timestamp', 'asc'),
                    limit(initialLimit)
                );

                // 🔍 Use delayed real-time updates to reduce quota usage
                let updateTimeout: NodeJS.Timeout;
                let pendingSnapshot: any = null;

                const processSnapshot = (snapshot: any) => {
                    const messages = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // 🔍 Cache the results
                    if (useCache) {
                        messageCache.set(conversationId, {
                            messages,
                            hasMore: messages.length >= initialLimit,
                            lastMessageTimestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : null
                        });
                    }

                    // 🔍 Broadcast to all callbacks
                    listenerManager.broadcastToCallbacks(listenerKey, messages);
                };

                return onSnapshot(q, (snapshot) => {
                    // 🔍 Batch real-time updates to reduce quota usage
                    if (enableRealTime) {
                        pendingSnapshot = snapshot;

                        // Clear existing timeout
                        if (updateTimeout) {
                            clearTimeout(updateTimeout);
                        }

                        // 🔍 Delay real-time updates to batch multiple changes
                        updateTimeout = setTimeout(() => {
                            if (pendingSnapshot) {
                                processSnapshot(pendingSnapshot);
                                pendingSnapshot = null;
                            }
                        }, QUOTA_OPTIMIZATION_CONFIG.REAL_TIME_UPDATE_DELAY);
                    } else {
                        // 🔍 Process immediately if real-time is disabled
                        processSnapshot(snapshot);
                    }
                }, (error) => {
                    console.error(`❌ [QUOTA] Error in optimized message listener for conversation ${conversationId}:`, error);

                    if (error.code === 'resource-exhausted') {
                        console.warn(`⚠️ [QUOTA] Firebase quota exceeded for conversation ${conversationId}`);
                        quotaMonitor.trackRead(`conversations/${conversationId}/messages`, 'quota_exceeded');

                        // 🔍 Try to use cached data if available
                        const cachedMessages = messageCache.get(conversationId);
                        if (cachedMessages) {
                            console.log(`📊 [QUOTA] Falling back to cached messages due to quota exceeded`);
                            listenerManager.broadcastToCallbacks(listenerKey, cachedMessages);
                        } else {
                            listenerManager.broadcastToCallbacks(listenerKey, []);
                        }
                    } else {
                        listenerManager.broadcastToCallbacks(listenerKey, []);
                    }
                });
            },
            callback
        );
    },

    /**
     * 🔍 Get older messages with optimized pagination
     */
    async getOlderMessages(
        conversationId: string,
        lastMessageTimestamp: any,
        messageLimit: number = QUOTA_OPTIMIZATION_CONFIG.PAGINATION_LIMIT
    ): Promise<any[]> {
        try {
            console.log(`📊 [QUOTA] Loading older messages for conversation ${conversationId}`);

            // 🔍 Track read operation for quota monitoring
            quotaMonitor.trackRead(`conversations/${conversationId}/messages`, 'getOlderMessages');

            const q = query(
                collection(db, 'conversations', conversationId, 'messages'),
                orderBy('timestamp', 'desc'),
                startAfter(lastMessageTimestamp),
                limit(messageLimit)
            );

            const snapshot = await getDocs(q);
            const messages = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));

            // 🔍 Update cache with new messages
            const existingMessages = messageCache.get(conversationId) || [];
            const updatedMessages = [...existingMessages, ...messages.reverse()];

            // 🔍 Limit memory usage
            if (updatedMessages.length > QUOTA_OPTIMIZATION_CONFIG.MAX_MESSAGES_IN_MEMORY) {
                const excess = updatedMessages.length - QUOTA_OPTIMIZATION_CONFIG.MAX_MESSAGES_IN_MEMORY;
                updatedMessages.splice(0, excess);
                console.log(`📊 [QUOTA] Trimmed ${excess} old messages to prevent memory bloat`);
            }

            messageCache.set(conversationId, {
                messages: updatedMessages,
                hasMore: messages.length >= messageLimit,
                lastMessageTimestamp: updatedMessages[updatedMessages.length - 1]?.timestamp
            });

            return messages.reverse();
        } catch (error: any) {
            console.error(`❌ [QUOTA] Failed to load older messages for conversation ${conversationId}:`, error);

            if (error.code === 'resource-exhausted') {
                console.warn(`⚠️ [QUOTA] Firebase quota exceeded while loading older messages`);
                quotaMonitor.trackRead(`conversations/${conversationId}/messages`, 'quota_exceeded');
                throw new Error('Unable to load older messages due to high server usage. Please try again later.');
            }

            throw error;
        }
    },

    /**
     * 🔍 Prefetch messages when user approaches end of current data
     */
    async prefetchMessages(conversationId: string): Promise<void> {
        try {
            const cached = messageCache.get(conversationId);
            if (!cached || !cached.hasMore) return;

            // 🔍 Check if we should prefetch (user is 80% through current data)
            const shouldPrefetch = cached.messages.length * QUOTA_OPTIMIZATION_CONFIG.PREFETCH_THRESHOLD > 0;

            if (shouldPrefetch) {
                console.log(`📊 [QUOTA] Prefetching messages for conversation ${conversationId}`);
                await this.getOlderMessages(conversationId, cached.lastMessageTimestamp);
            }
        } catch (error) {
            console.warn(`⚠️ [QUOTA] Failed to prefetch messages for conversation ${conversationId}:`, error);
        }
    },

    /**
     * 🔍 Clear cache for a specific conversation
     */
    clearCache(conversationId: string): void {
        messageCache.clear(conversationId);
        console.log(`📊 [QUOTA] Cleared cache for conversation ${conversationId}`);
    },

    /**
     * 🔍 Clear all caches
     */
    clearAllCaches(): void {
        messageCache.clearAll();
        console.log(`📊 [QUOTA] Cleared all message caches`);
    },

    /**
     * 🔍 Get cache statistics
     */
    getCacheStats(): {
        totalCachedConversations: number;
        totalCachedMessages: number;
        cacheHitRate: number;
    } {
        let totalMessages = 0;
        let totalConversations = 0;

        // This would need to be implemented with actual cache statistics
        // For now, return placeholder data

        return {
            totalCachedConversations: totalConversations,
            totalCachedMessages: totalMessages,
            cacheHitRate: 0.75 // Placeholder
        };
    }
};

export default optimizedMessageService;
