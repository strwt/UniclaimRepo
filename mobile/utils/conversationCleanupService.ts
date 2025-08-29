import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    writeBatch,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import cloudinaryService from './cloudinary';

// Interface for cleanup results
export interface CleanupResult {
    conversationsDeleted: number;
    messagesDeleted: number;
    imagesDeleted: number;
    errors: string[];
    success: boolean;
}

// Interface for conversation data during cleanup
interface ConversationData {
    id: string;
    createdAt: any;
    lastMessage?: {
        timestamp: any;
    };
}

// Interface for message data during cleanup
interface MessageData {
    id: string;
    messageType?: string;
    handoverData?: {
        idPhotoUrl?: string;
    };
    claimData?: {
        idPhotoUrl?: string;
        evidencePhotos?: { url: string }[];
    };
    verificationPhotos?: { url: string }[];
}

/**
 * Conversation Cleanup Service
 * Automatically deletes conversations older than 24 hours to free up Firebase storage
 */
export class ConversationCleanupService {
    private static instance: ConversationCleanupService;

    // 24 hours in milliseconds
    private readonly CLEANUP_THRESHOLD = 24 * 60 * 60 * 1000;

    // Minimum interval between cleanup runs (1 hour)
    private readonly MIN_CLEANUP_INTERVAL = 60 * 60 * 1000;

    private lastCleanupTime: number = 0;
    private isRunning: boolean = false;

    private constructor() { }

    public static getInstance(): ConversationCleanupService {
        if (!ConversationCleanupService.instance) {
            ConversationCleanupService.instance = new ConversationCleanupService();
        }
        return ConversationCleanupService.instance;
    }

    /**
     * Main cleanup function - deletes conversations older than 24 hours
     */
    public async cleanupOldConversations(): Promise<CleanupResult> {
        // Prevent multiple simultaneous cleanup runs
        if (this.isRunning) {
            console.log('🧹 Mobile: Cleanup already running, skipping...');
            return {
                conversationsDeleted: 0,
                messagesDeleted: 0,
                imagesDeleted: 0,
                errors: ['Cleanup already running'],
                success: false
            };
        }

        // Check if enough time has passed since last cleanup
        const now = Date.now();
        if (now - this.lastCleanupTime < this.MIN_CLEANUP_INTERVAL) {
            console.log('🧹 Mobile: Cleanup interval not reached, skipping...');
            return {
                conversationsDeleted: 0,
                messagesDeleted: 0,
                imagesDeleted: 0,
                errors: ['Cleanup interval not reached'],
                success: false
            };
        }

        this.isRunning = true;
        this.lastCleanupTime = now;

        try {
            console.log('🧹 Mobile: Starting 24-hour conversation cleanup...');

            const result = await this.performCleanup();

            console.log(`✅ Mobile: Cleanup completed: ${result.conversationsDeleted} conversations, ${result.messagesDeleted} messages, ${result.imagesDeleted} images deleted`);

            return result;
        } catch (error: any) {
            console.error('❌ Mobile: Cleanup failed:', error);
            return {
                conversationsDeleted: 0,
                messagesDeleted: 0,
                imagesDeleted: 0,
                errors: [error.message || 'Unknown error'],
                success: false
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Perform the actual cleanup process
     */
    private async performCleanup(): Promise<CleanupResult> {
        const result: CleanupResult = {
            conversationsDeleted: 0,
            messagesDeleted: 0,
            imagesDeleted: 0,
            errors: [],
            success: true
        };

        try {
            // Step 1: Find conversations older than 24 hours
            const oldConversations = await this.findOldConversations();

            if (oldConversations.length === 0) {
                console.log('🧹 Mobile: No old conversations found for cleanup');
                return result;
            }

            console.log(`🧹 Mobile: Found ${oldConversations.length} conversations older than 24 hours`);

            // Step 2: Process each old conversation
            for (const conversation of oldConversations) {
                try {
                    const conversationResult = await this.cleanupSingleConversation(conversation.id);

                    result.conversationsDeleted += 1;
                    result.messagesDeleted += conversationResult.messagesDeleted;
                    result.imagesDeleted += conversationResult.imagesDeleted;

                    console.log(`✅ Mobile: Cleaned up conversation ${conversation.id}: ${conversationResult.messagesDeleted} messages, ${conversationResult.imagesDeleted} images`);
                } catch (error: any) {
                    const errorMsg = `Failed to cleanup conversation ${conversation.id}: ${error.message}`;
                    console.error('❌ Mobile:', errorMsg);
                    result.errors.push(errorMsg);
                    result.success = false;
                }
            }

        } catch (error: any) {
            result.errors.push(`Cleanup process failed: ${error.message}`);
            result.success = false;
        }

        return result;
    }

    /**
     * Find conversations older than 24 hours
     */
    private async findOldConversations(): Promise<ConversationData[]> {
        const cutoffTime = new Date(Date.now() - this.CLEANUP_THRESHOLD);
        const cutoffTimestamp = Timestamp.fromDate(cutoffTime);

        // Query conversations created before the cutoff time
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('createdAt', '<', cutoffTimestamp)
        );

        const snapshot = await getDocs(q);
        const oldConversations: ConversationData[] = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            oldConversations.push({
                id: doc.id,
                createdAt: data.createdAt,
                lastMessage: data.lastMessage
            });
        });

        return oldConversations;
    }

    /**
     * Clean up a single conversation and all its messages
     */
    private async cleanupSingleConversation(conversationId: string): Promise<{ messagesDeleted: number; imagesDeleted: number }> {
        let messagesDeleted = 0;
        let imagesDeleted = 0;

        try {
            // Step 1: Get all messages in the conversation
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const messagesSnapshot = await getDocs(messagesRef);

            // Step 2: Delete images from Cloudinary first
            for (const messageDoc of messagesSnapshot.docs) {
                const messageData = messageDoc.data() as MessageData;
                const deletedCount = await this.deleteMessageImages(messageData);
                imagesDeleted += deletedCount;
            }

            // Step 3: Delete all messages using batch delete
            const batch = writeBatch(db);
            messagesSnapshot.docs.forEach(messageDoc => {
                batch.delete(messageDoc.ref);
                messagesDeleted++;
            });

            await batch.commit();

            // Step 4: Delete the conversation document
            const conversationRef = doc(db, 'conversations', conversationId);
            await deleteDoc(conversationRef);

        } catch (error: any) {
            console.error(`❌ Mobile: Failed to cleanup conversation ${conversationId}:`, error);
            throw error;
        }

        return { messagesDeleted, imagesDeleted };
    }

    /**
     * Delete all images associated with a message from Cloudinary
     */
    private async deleteMessageImages(messageData: MessageData): Promise<number> {
        let deletedCount = 0;
        const imageUrls: string[] = [];

        try {
            // Collect all image URLs from the message
            if (messageData.handoverData?.idPhotoUrl) {
                imageUrls.push(messageData.handoverData.idPhotoUrl);
            }

            if (messageData.claimData?.idPhotoUrl) {
                imageUrls.push(messageData.claimData.idPhotoUrl);
            }

            if (messageData.claimData?.evidencePhotos) {
                messageData.claimData.evidencePhotos.forEach(photo => {
                    imageUrls.push(photo.url);
                });
            }

            if (messageData.verificationPhotos) {
                messageData.verificationPhotos.forEach(photo => {
                    imageUrls.push(photo.url);
                });
            }

            // Delete images from Cloudinary
            for (const imageUrl of imageUrls) {
                try {
                    // Extract public ID from URL for Cloudinary deletion
                    const publicId = this.extractPublicIdFromUrl(imageUrl);
                    if (publicId) {
                        await cloudinaryService.deleteImage(publicId);
                        deletedCount++;
                    } else {
                        console.warn(`⚠️ Mobile: Could not extract public ID from URL: ${imageUrl}`);
                    }
                } catch (error: any) {
                    console.warn(`⚠️ Mobile: Failed to delete image ${imageUrl}:`, error.message);
                    // Continue with other images even if one fails
                }
            }

        } catch (error: any) {
            console.warn(`⚠️ Mobile: Error during image cleanup for message:`, error.message);
        }

        return deletedCount;
    }

    /**
     * Get cleanup statistics
     */
    public getCleanupStats(): { lastCleanup: number; isRunning: boolean } {
        return {
            lastCleanup: this.lastCleanupTime,
            isRunning: this.isRunning
        };
    }

    /**
 * Extract public ID from Cloudinary URL
 */
    private extractPublicIdFromUrl(imageUrl: string): string | null {
        try {
            // Handle different Cloudinary URL formats
            if (imageUrl.includes('cloudinary.com')) {
                // Extract the path after /upload/ and before the version or file extension
                const urlParts = imageUrl.split('/upload/');
                if (urlParts.length > 1) {
                    let publicId = urlParts[1];

                    // Remove version prefix if present (v1234567890/)
                    if (publicId.startsWith('v')) {
                        publicId = publicId.substring(publicId.indexOf('/') + 1);
                    }

                    // Remove file extension
                    const lastDotIndex = publicId.lastIndexOf('.');
                    if (lastDotIndex > 0) {
                        publicId = publicId.substring(0, lastDotIndex);
                    }

                    return publicId;
                }
            }
            return null;
        } catch (error) {
            console.warn('Mobile: Error extracting public ID from URL:', imageUrl, error);
            return null;
        }
    }

    /**
     * Force immediate cleanup (bypasses interval check)
     */
    public async forceCleanup(): Promise<CleanupResult> {
        this.lastCleanupTime = 0; // Reset last cleanup time
        return this.cleanupOldConversations();
    }
}

// Export singleton instance
export const conversationCleanupService = ConversationCleanupService.getInstance();
