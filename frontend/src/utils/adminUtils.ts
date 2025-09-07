// Utility functions for admin-related operations
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Cache for admin status to avoid repeated database calls
const adminStatusCache = new Map<string, boolean>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a user is an admin by looking up their role in the users collection
 * Uses caching to avoid repeated database calls
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    // Check cache first
    const cached = adminStatusCache.get(userId);
    const cacheTime = cacheExpiry.get(userId);

    if (cached !== undefined && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
        return cached;
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdmin = userData.role === 'admin';

            // Cache the result
            adminStatusCache.set(userId, isAdmin);
            cacheExpiry.set(userId, Date.now());

            return isAdmin;
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }

    return false;
}

/**
 * Check if a user is an admin based on their email (fallback method)
 */
export async function isUserAdminByEmail(email: string): Promise<boolean> {
    // Check cache first
    const cached = adminStatusCache.get(email);
    const cacheTime = cacheExpiry.get(email);

    if (cached !== undefined && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
        return cached;
    }

    try {
        // Query users collection by email
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const isAdmin = userData.role === 'admin';

            // Cache the result
            adminStatusCache.set(email, isAdmin);
            cacheExpiry.set(email, Date.now());

            return isAdmin;
        }
    } catch (error) {
        console.error('Error checking admin status by email:', error);
    }

    return false;
}

/**
 * Clear the admin status cache (useful for testing or when user roles change)
 */
export function clearAdminStatusCache(): void {
    adminStatusCache.clear();
    cacheExpiry.clear();
}
