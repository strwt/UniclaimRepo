import { useState, useEffect, useRef } from 'react';
import { postService } from '../utils/firebase';
import type { Post } from '../types/type';

// Global cache to persist data between component unmounts
const globalPostCache = new Map<string, { posts: Post[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Custom hook for real-time posts with smart caching
export const usePosts = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const cacheKey = 'all-posts';

    // Check if we have valid cached data
    const cachedData = globalPostCache.get(cacheKey);
    const hasValidCache = cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION;

    useEffect(() => {
        // If we have valid cached data, use it immediately
        if (hasValidCache) {
            setPosts(cachedData.posts);
            setLoading(false);
            setIsInitialLoad(false);
        } else {
            setLoading(true);
        }

        // Subscribe to real-time updates
        const unsubscribe = postService.getAllPosts((fetchedPosts) => {
            setPosts(fetchedPosts);
            setLoading(false);
            setIsInitialLoad(false);

            // Cache the data
            globalPostCache.set(cacheKey, {
                posts: fetchedPosts,
                timestamp: Date.now()
            });
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return {
        posts,
        loading: isInitialLoad ? loading : false, // Only show loading on first load
        error,
        isInitialLoad
    };
};

// Custom hook for posts by type with caching
export const usePostsByType = (type: 'lost' | 'found') => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const cacheKey = `posts-${type}`;

    const cachedData = globalPostCache.get(cacheKey);
    const hasValidCache = cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION;

    useEffect(() => {
        if (hasValidCache) {
            setPosts(cachedData.posts);
            setLoading(false);
            setIsInitialLoad(false);
        } else {
            setLoading(true);
        }

        const unsubscribe = postService.getPostsByType(type, (fetchedPosts) => {
            setPosts(fetchedPosts);
            setLoading(false);
            setIsInitialLoad(false);

            globalPostCache.set(cacheKey, {
                posts: fetchedPosts,
                timestamp: Date.now()
            });
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [type]);

    return {
        posts,
        loading: isInitialLoad ? loading : false,
        isInitialLoad
    };
};

// Custom hook for posts by category
export const usePostsByCategory = (category: string) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!category) {
            setPosts([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = postService.getPostsByCategory(category, (fetchedPosts) => {
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [category]);

    return { posts, loading };
};

// Custom hook for user's posts
export const useUserPosts = (userEmail: string) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userEmail) {
            setPosts([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = postService.getUserPosts(userEmail, (fetchedPosts) => {
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userEmail]);

    return { posts, loading };
};

// Custom hook for user's posts with setPosts functionality
export const useUserPostsWithSet = (userEmail: string) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userEmail) {
            setPosts([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = postService.getUserPosts(userEmail, (fetchedPosts) => {
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userEmail]);

    return { posts, setPosts, loading };
};
