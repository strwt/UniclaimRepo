// Posts service for lost and found items
import { db } from './config';
import {
    doc,
    collection,
    addDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    where,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';

// Post service
export const postService = {
    // Get all posts
    getAllPosts(callback: (posts: any[]) => void) {
        const q = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        });
    },

    // Get posts by type
    getPostsByType(type: string, callback: (posts: any[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('type', '==', type),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        });
    },

    // Get user posts
    getUserPosts(userEmail: string, callback: (posts: any[]) => void) {
        console.log('🔍 [DEBUG] getUserPosts: Querying posts for user:', userEmail);

        const q = query(
            collection(db, 'posts'),
            where('user.email', '==', userEmail),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q,
            (snapshot) => {
                const posts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('🔍 [DEBUG] getUserPosts: Found posts count:', posts.length);
                console.log('🔍 [DEBUG] getUserPosts: Sample posts:', posts.slice(0, 2).map((p: any) => ({ id: p.id, title: p.title, userEmail: p.user?.email })));
                callback(posts);
            },
            (error) => {
                console.error('❌ [ERROR] getUserPosts: Query failed:', error);
                // Return empty array on error to prevent app crash
                callback([]);
            }
        );
    },

    // Get post by ID
    async getPostById(postId: string): Promise<any> {
        try {
            const postDoc = await getDoc(doc(db, 'posts', postId));
            if (postDoc.exists()) {
                return { id: postDoc.id, ...postDoc.data() };
            }
            return null;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get post');
        }
    },

    // Get resolved posts
    getResolvedPosts(callback: (posts: any[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('status', '==', 'resolved'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        });
    },

    // Create new post
    async createPost(postData: any): Promise<string> {
        try {
            // Calculate expiry date (30 days from creation)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            // Ensure all required fields are present for web compatibility
            const enhancedPostData = {
                ...postData,
                // Ensure status is set to pending for new posts
                status: postData.status || 'pending',
                // Add lifecycle management fields that web expects
                isExpired: false,
                movedToUnclaimed: false,
                originalStatus: postData.status || 'pending',
                // Set expiry date for 30-day lifecycle system
                expiryDate: expiryDate,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const postRef = await addDoc(collection(db, 'posts'), enhancedPostData);
            return postRef.id;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create post');
        }
    },

    // Update post
    async updatePost(postId: string, updates: any): Promise<void> {
        try {
            await updateDoc(doc(db, 'posts', postId), {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to update post');
        }
    },

    // Delete post
    async deletePost(postId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, 'posts', postId));
        } catch (error: any) {
            throw new Error(error.message || 'Failed to delete post');
        }
    },

    // Get posts by category
    getPostsByCategory(category: string, callback: (posts: any[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        });
    },

    // Get posts by location
    getPostsByLocation(location: string, callback: (posts: any[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('location', '==', location),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        });
    },

    // Get posts by status
    getPostsByStatus(status: string, callback: (posts: any[]) => void) {
        const q = query(
            collection(db, 'posts'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        });
    },

    // Search posts by title or description
    searchPosts(searchTerm: string, callback: (posts: any[]) => void) {
        // Note: Firestore doesn't support full-text search natively
        // This is a simple implementation - for production, consider using Algolia or similar
        const q = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const allPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter posts that contain the search term in title or description
            const filteredPosts = allPosts.filter((post: any) => {
                const title = (post.title || '').toLowerCase();
                const description = (post.description || '').toLowerCase();
                const search = searchTerm.toLowerCase();

                return title.includes(search) || description.includes(search);
            });

            callback(filteredPosts);
        });
    },

    // Mark post as resolved
    async markPostAsResolved(postId: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'posts', postId), {
                status: 'resolved',
                resolvedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to mark post as resolved');
        }
    },

    // Get recent posts (last 24 hours)
    getRecentPosts(callback: (posts: any[]) => void) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const q = query(
            collection(db, 'posts'),
            where('createdAt', '>=', yesterday),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        });
    }
};
