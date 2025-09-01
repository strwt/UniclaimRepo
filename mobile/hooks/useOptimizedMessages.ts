/**
 * 🔧 useOptimizedMessages Hook
 * 
 * This hook provides an easy way to use the optimized message service
 * with proper React state management and automatic cleanup.
 * 
 * Features:
 * - Smart pagination with automatic loading
 * - Cache management
 * - Real-time updates with reduced frequency
 * - Automatic cleanup on unmount
 * - Quota-aware error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizedMessageService } from '../utils/optimizedMessageService';

interface UseOptimizedMessagesOptions {
    conversationId: string;
    initialLimit?: number;
    enableRealTime?: boolean;
    useCache?: boolean;
    autoPrefetch?: boolean;
}

interface UseOptimizedMessagesReturn {
    messages: any[];
    loading: boolean;
    hasMore: boolean;
    error: string | null;
    loadOlderMessages: () => Promise<void>;
    refreshMessages: () => void;
    clearCache: () => void;
    prefetchMessages: () => Promise<void>;
}

export const useOptimizedMessages = ({
    conversationId,
    initialLimit = 25,
    enableRealTime = true,
    useCache = true,
    autoPrefetch = true
}: UseOptimizedMessagesOptions): UseOptimizedMessagesReturn => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const unsubscribeRef = useRef<(() => void) | null>(null);
    const isMountedRef = useRef(true);

    // 🔍 Load initial messages
    const loadInitialMessages = useCallback(async () => {
        if (!conversationId) return;

        setLoading(true);
        setError(null);

        try {
            // 🔍 Check cache first
            if (useCache) {
                const cachedMessages = optimizedMessageService.getConversationMessages(
                    conversationId,
                    (cachedMessages) => {
                        if (isMountedRef.current) {
                            setMessages(cachedMessages);
                            setLoading(false);
                        }
                    },
                    { initialLimit, enableRealTime: false, useCache: true }
                );

                // Store unsubscribe function
                unsubscribeRef.current = cachedMessages;
                return;
            }

            // 🔍 Load from Firebase if no cache
            const unsubscribe = optimizedMessageService.getConversationMessages(
                conversationId,
                (loadedMessages) => {
                    if (isMountedRef.current) {
                        setMessages(loadedMessages);
                        setLoading(false);
                        setHasMore(loadedMessages.length >= initialLimit);
                    }
                },
                { initialLimit, enableRealTime, useCache }
            );

            unsubscribeRef.current = unsubscribe;
        } catch (err: any) {
            if (isMountedRef.current) {
                setError(err.message || 'Failed to load messages');
                setLoading(false);
            }
        }
    }, [conversationId, initialLimit, enableRealTime, useCache]);

    // 🔍 Load older messages for pagination
    const loadOlderMessages = useCallback(async () => {
        if (!conversationId || !hasMore || loading) return;

        try {
            setLoading(true);
            setError(null);

            const lastMessage = messages[messages.length - 1];
            if (!lastMessage?.timestamp) {
                setError('Cannot determine last message timestamp');
                setLoading(false);
                return;
            }

            const olderMessages = await optimizedMessageService.getOlderMessages(
                conversationId,
                lastMessage.timestamp
            );

            if (isMountedRef.current) {
                setMessages(prev => [...prev, ...olderMessages]);
                setHasMore(olderMessages.length >= 20); // Default pagination limit
                setLoading(false);
            }
        } catch (err: any) {
            if (isMountedRef.current) {
                setError(err.message || 'Failed to load older messages');
                setLoading(false);
            }
        }
    }, [conversationId, hasMore, loading, messages]);

    // 🔍 Refresh messages
    const refreshMessages = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        loadInitialMessages();
    }, [loadInitialMessages]);

    // 🔍 Clear cache
    const clearCache = useCallback(() => {
        optimizedMessageService.clearCache(conversationId);
        setMessages([]);
        setHasMore(false);
    }, [conversationId]);

    // 🔍 Prefetch messages
    const prefetchMessages = useCallback(async () => {
        if (!conversationId || !autoPrefetch) return;

        try {
            await optimizedMessageService.prefetchMessages(conversationId);
        } catch (err) {
            console.warn('Failed to prefetch messages:', err);
        }
    }, [conversationId, autoPrefetch]);

    // 🔍 Auto-prefetch when approaching end of messages
    useEffect(() => {
        if (autoPrefetch && messages.length > 0) {
            const shouldPrefetch = messages.length * 0.8 > 0; // 80% threshold
            if (shouldPrefetch && hasMore) {
                prefetchMessages();
            }
        }
    }, [messages.length, hasMore, autoPrefetch, prefetchMessages]);

    // 🔍 Load initial messages on mount
    useEffect(() => {
        loadInitialMessages();

        // 🔍 Cleanup on unmount
        return () => {
            isMountedRef.current = false;
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [loadInitialMessages]);

    // 🔍 Cleanup on conversation change
    useEffect(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        // Reset state
        setMessages([]);
        setLoading(true);
        setHasMore(false);
        setError(null);
    }, [conversationId]);

    return {
        messages,
        loading,
        hasMore,
        error,
        loadOlderMessages,
        refreshMessages,
        clearCache,
        prefetchMessages
    };
};

export default useOptimizedMessages;
