import { useState, useEffect } from 'react';
import { postService } from '../utils/firebase';
import type { Post } from '../types/type';

// Custom hook for real-time posts
export const usePosts = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        // Subscribe to real-time updates
        const unsubscribe = postService.getAllPosts((fetchedPosts) => {
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return { posts, loading, error };
};

// Custom hook for posts by type
export const usePostsByType = (type: 'lost' | 'found') => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        const unsubscribe = postService.getPostsByType(type, (fetchedPosts) => {
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [type]);

    return { posts, loading };
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
