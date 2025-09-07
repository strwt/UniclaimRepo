import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { Post } from '../types/type';

// Cache for admin status
const adminStatusCache = new Map<string, boolean>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Hook to get admin status for all users in posts
 * This pre-fetches admin status to avoid async calls in PostCard components
 */
export const useAdminStatus = (posts: Post[]) => {
    const [adminStatuses, setAdminStatuses] = useState<Map<string, boolean>>(new Map());

    // Create a stable key for the current set of posts
    const postsKey = useMemo(() => {
        return posts.map(post => post.user?.email || '').filter(Boolean).sort().join(',');
    }, [posts]);

    useEffect(() => {
        const fetchAdminStatuses = async () => {
            if (!posts.length) return;

            // Get unique user emails from posts
            const userEmails = new Set<string>();
            posts.forEach(post => {
                if (post.user?.email) {
                    userEmails.add(post.user.email);
                }
            });

            const newAdminStatuses = new Map<string, boolean>();

            // Check cache first and fetch missing ones
            const emailsToFetch: string[] = [];

            for (const email of userEmails) {
                const cached = adminStatusCache.get(email);
                const cacheTime = cacheTimestamps.get(email);

                if (cached !== undefined && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
                    newAdminStatuses.set(email, cached);
                } else {
                    emailsToFetch.push(email);
                }
            }

            // Fetch admin status for emails not in cache
            if (emailsToFetch.length > 0) {
                try {
                    const q = query(
                        collection(db, 'users'),
                        where('email', 'in', emailsToFetch)
                    );

                    const querySnapshot = await getDocs(q);

                    querySnapshot.docs.forEach(doc => {
                        const userData = doc.data();
                        const email = userData.email;
                        const isAdmin = userData.role === 'admin';

                        // Cache the result
                        adminStatusCache.set(email, isAdmin);
                        cacheTimestamps.set(email, Date.now());
                        newAdminStatuses.set(email, isAdmin);
                    });

                    // Set default false for emails not found in database
                    emailsToFetch.forEach(email => {
                        if (!newAdminStatuses.has(email)) {
                            adminStatusCache.set(email, false);
                            cacheTimestamps.set(email, Date.now());
                            newAdminStatuses.set(email, false);
                        }
                    });

                } catch (error) {
                    console.error('Error fetching admin statuses:', error);
                    // Set default false for all emails on error
                    emailsToFetch.forEach(email => {
                        newAdminStatuses.set(email, false);
                    });
                }
            }

            setAdminStatuses(newAdminStatuses);
        };

        fetchAdminStatuses();
    }, [postsKey]); // Use postsKey instead of posts to avoid infinite loops

    return adminStatuses;
};
