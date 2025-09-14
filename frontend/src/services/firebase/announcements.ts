import { db } from './config';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';

// Announcement data interface
export interface Announcement {
    id: string;
    message: string;
    priority: 'normal' | 'urgent';
    isActive: boolean;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    expiresAt?: Timestamp; // Optional expiration date
}

// Create announcement data interface (for creating new announcements)
export interface CreateAnnouncementData {
    message: string;
    priority: 'normal' | 'urgent';
    isActive: boolean;
    createdBy: string;
    expiresAt?: Date; // Optional expiration date
}

// Update announcement data interface (for updating existing announcements)
export interface UpdateAnnouncementData {
    message?: string;
    priority?: 'normal' | 'urgent';
    isActive?: boolean;
    expiresAt?: Date;
}

export class AnnouncementService {
    private static instance: AnnouncementService;
    private readonly collectionName = 'announcements';

    private constructor() { }

    public static getInstance(): AnnouncementService {
        if (!AnnouncementService.instance) {
            AnnouncementService.instance = new AnnouncementService();
        }
        return AnnouncementService.instance;
    }

    // Create a new announcement
    async createAnnouncement(data: CreateAnnouncementData): Promise<string> {
        try {
            const announcementData = {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null
            };

            const docRef = await addDoc(collection(db, this.collectionName), announcementData);
            console.log('✅ Announcement created successfully:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creating announcement:', error);
            throw new Error('Failed to create announcement');
        }
    }

    // Get all announcements
    async getAllAnnouncements(): Promise<Announcement[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const announcements: Announcement[] = [];

            querySnapshot.forEach((doc) => {
                announcements.push({
                    id: doc.id,
                    ...doc.data()
                } as Announcement);
            });

            return announcements;
        } catch (error) {
            console.error('❌ Error fetching announcements:', error);
            throw new Error('Failed to fetch announcements');
        }
    }

    // Get active announcements only
    async getActiveAnnouncements(): Promise<Announcement[]> {
        try {
            const now = new Date();
            const q = query(
                collection(db, this.collectionName),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const announcements: Announcement[] = [];

            querySnapshot.forEach((doc) => {
                const announcement = {
                    id: doc.id,
                    ...doc.data()
                } as Announcement;

                // Check if announcement has expired
                if (announcement.expiresAt) {
                    const expirationDate = announcement.expiresAt.toDate();
                    if (expirationDate > now) {
                        announcements.push(announcement);
                    }
                } else {
                    // No expiration date, so it's still active
                    announcements.push(announcement);
                }
            });

            // Sort by priority after fetching (urgent first, then by creation date)
            return announcements.sort((a, b) => {
                if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
                if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });
        } catch (error) {
            console.error('❌ Error fetching active announcements:', error);
            throw new Error('Failed to fetch active announcements');
        }
    }

    // Get announcement by ID
    async getAnnouncementById(id: string): Promise<Announcement | null> {
        try {
            const docRef = doc(db, this.collectionName, id);
            const docSnap = await getDocs(query(collection(db, this.collectionName), where('__name__', '==', id)));

            if (docSnap.empty) {
                return null;
            }

            const announcement = {
                id: docSnap.docs[0].id,
                ...docSnap.docs[0].data()
            } as Announcement;

            return announcement;
        } catch (error) {
            console.error('❌ Error fetching announcement by ID:', error);
            throw new Error('Failed to fetch announcement');
        }
    }

    // Update an announcement
    async updateAnnouncement(id: string, data: UpdateAnnouncementData): Promise<void> {
        try {
            const docRef = doc(db, this.collectionName, id);
            const updateData = {
                ...data,
                updatedAt: serverTimestamp(),
                expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : undefined
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key as keyof typeof updateData] === undefined) {
                    delete updateData[key as keyof typeof updateData];
                }
            });

            await updateDoc(docRef, updateData);
            console.log('✅ Announcement updated successfully:', id);
        } catch (error) {
            console.error('❌ Error updating announcement:', error);
            throw new Error('Failed to update announcement');
        }
    }

    // Delete an announcement
    async deleteAnnouncement(id: string): Promise<void> {
        try {
            const docRef = doc(db, this.collectionName, id);
            await deleteDoc(docRef);
            console.log('✅ Announcement deleted successfully:', id);
        } catch (error) {
            console.error('❌ Error deleting announcement:', error);
            throw new Error('Failed to delete announcement');
        }
    }

    // Toggle announcement active status
    async toggleAnnouncementStatus(id: string): Promise<void> {
        try {
            const announcement = await this.getAnnouncementById(id);
            if (!announcement) {
                throw new Error('Announcement not found');
            }

            await this.updateAnnouncement(id, {
                isActive: !announcement.isActive
            });
        } catch (error) {
            console.error('❌ Error toggling announcement status:', error);
            throw new Error('Failed to toggle announcement status');
        }
    }

    // Subscribe to real-time updates for active announcements
    subscribeToActiveAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
        console.log('🔔 Creating announcement subscription...');

        const q = query(
            collection(db, this.collectionName),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (querySnapshot) => {
            console.log('📊 Query snapshot received:', querySnapshot.size, 'documents');

            const announcements: Announcement[] = [];
            const now = new Date();

            querySnapshot.forEach((doc) => {
                const announcement = {
                    id: doc.id,
                    ...doc.data()
                } as Announcement;

                // Check if announcement has expired
                if (announcement.expiresAt) {
                    const expirationDate = announcement.expiresAt.toDate();
                    if (expirationDate > now) {
                        announcements.push(announcement);
                    }
                } else {
                    // No expiration date, so it's still active
                    announcements.push(announcement);
                }
            });

            // Sort by priority after fetching (urgent first, then by creation date)
            const sortedAnnouncements = announcements.sort((a, b) => {
                if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
                if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });

            console.log('📢 Processed announcements:', sortedAnnouncements.length);
            callback(sortedAnnouncements);
        }, (error) => {
            console.error('❌ Error in announcement subscription:', error);
            // Call callback with empty array on error to clear loading state
            callback([]);
        });
    }

    // Get announcements by admin (for admin dashboard)
    async getAnnouncementsByAdmin(adminId: string): Promise<Announcement[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('createdBy', '==', adminId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const announcements: Announcement[] = [];

            querySnapshot.forEach((doc) => {
                announcements.push({
                    id: doc.id,
                    ...doc.data()
                } as Announcement);
            });

            return announcements;
        } catch (error) {
            console.error('❌ Error fetching announcements by admin:', error);
            throw new Error('Failed to fetch admin announcements');
        }
    }
}

// Export singleton instance
export const announcementService = AnnouncementService.getInstance();
