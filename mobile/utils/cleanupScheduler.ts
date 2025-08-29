import { conversationCleanupService } from './conversationCleanupService';

/**
 * Cleanup Scheduler
 * Automatically runs conversation cleanup every hour to free up Firebase storage
 */
export class CleanupScheduler {
    private static instance: CleanupScheduler;
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    // Run cleanup every hour (60 minutes)
    private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

    private constructor() { }

    public static getInstance(): CleanupScheduler {
        if (!CleanupScheduler.instance) {
            CleanupScheduler.instance = new CleanupScheduler();
        }
        return CleanupScheduler.instance;
    }

    /**
     * Start the automatic cleanup scheduler
     */
    public start(): void {
        if (this.isRunning) {
            console.log('🕐 Mobile: Cleanup scheduler already running');
            return;
        }

        console.log('🕐 Mobile: Starting automatic cleanup scheduler (runs every hour)');

        // Run initial cleanup after a short delay
        setTimeout(() => {
            this.runCleanup();
        }, 5000); // Wait 5 seconds before first run

        // Set up recurring cleanup
        this.intervalId = setInterval(() => {
            this.runCleanup();
        }, this.CLEANUP_INTERVAL);

        this.isRunning = true;
    }

    /**
     * Stop the automatic cleanup scheduler
     */
    public stop(): void {
        if (!this.isRunning) {
            console.log('🕐 Mobile: Cleanup scheduler not running');
            return;
        }

        console.log('🕐 Mobile: Stopping automatic cleanup scheduler');

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
    }

    /**
     * Run cleanup and handle any errors
     */
    private async runCleanup(): Promise<void> {
        try {
            console.log('🕐 Mobile: Scheduled cleanup triggered');
            const result = await conversationCleanupService.cleanupOldConversations();

            if (result.success) {
                console.log(`🕐 Mobile: Scheduled cleanup completed: ${result.conversationsDeleted} conversations deleted`);
            } else {
                console.warn(`🕐 Mobile: Scheduled cleanup completed with errors:`, result.errors);
            }
        } catch (error: any) {
            console.error('🕐 Mobile: Scheduled cleanup failed:', error.message);
            // Don't stop the scheduler on errors - just log them
        }
    }

    /**
     * Get scheduler status
     */
    public getStatus(): { isRunning: boolean; interval: number } {
        return {
            isRunning: this.isRunning,
            interval: this.CLEANUP_INTERVAL
        };
    }

    /**
     * Force immediate cleanup (bypasses scheduler)
     */
    public async forceCleanup(): Promise<void> {
        console.log('🕐 Mobile: Force cleanup triggered by scheduler');
        await this.runCleanup();
    }
}

// Export singleton instance
export const cleanupScheduler = CleanupScheduler.getInstance();

// Auto-start the scheduler when this module is imported
// This ensures cleanup runs automatically in the background
console.log('🕐 Mobile: Initializing cleanup scheduler...');
cleanupScheduler.start();
