// ListenerManager.ts - Centralized management of all Firestore listeners
export type UnsubscribeFunction = () => void;

class ListenerManager {
    private listeners: Map<string, UnsubscribeFunction> = new Map();
    private listenerCount = 0;
    private isCleaningUp = false;

    // Add a new listener and return a unique ID
    addListener(unsubscribeFn: UnsubscribeFunction, context: string = 'unknown'): string {
        // Don't add listeners during cleanup
        if (this.isCleaningUp) {
            return '';
        }

        const listenerId = `${context}_${++this.listenerCount}`;
        this.listeners.set(listenerId, unsubscribeFn);
        return listenerId;
    }

    // Remove a specific listener by ID
    removeListener(listenerId: string): boolean {
        const unsubscribeFn = this.listeners.get(listenerId);
        if (unsubscribeFn) {
            try {
                unsubscribeFn();
                this.listeners.delete(listenerId);
                return true;
            } catch (error: any) {
                this.listeners.delete(listenerId);
                return false;
            }
        }
        return false;
    }

    // Remove all listeners with better error handling
    removeAllListeners(): void {
        if (this.isCleaningUp) {
            return;
        }

        this.isCleaningUp = true;

        const listenerIds = Array.from(this.listeners.keys());

        listenerIds.forEach((listenerId) => {
            try {
                const unsubscribeFn = this.listeners.get(listenerId);
                if (unsubscribeFn) {
                    unsubscribeFn();
                }
            } catch (error: any) {
                // Silent error handling
            }
        });

        this.listeners.clear();
        this.listenerCount = 0;
        this.isCleaningUp = false;
    }

    // Force cleanup and reset state (useful for debugging)
    forceCleanup(): void {
        this.isCleaningUp = false;
        this.removeAllListeners();
    }

    // Get count of active listeners
    getActiveListenerCount(): number {
        return this.listeners.size;
    }

    // Get all active listener IDs
    getActiveListenerIds(): string[] {
        return Array.from(this.listeners.keys());
    }

    // Check if a specific listener is active
    hasListener(listenerId: string): boolean {
        return this.listeners.has(listenerId);
    }

    // Clean up listeners by context (e.g., 'PostService', 'MessageContext')
    cleanupByContext(context: string): number {
        let removedCount = 0;
        const listenersToRemove: string[] = [];

        this.listeners.forEach((_, listenerId) => {
            if (listenerId.startsWith(context)) {
                listenersToRemove.push(listenerId);
            }
        });

        listenersToRemove.forEach(listenerId => {
            if (this.removeListener(listenerId)) {
                removedCount++;
            }
        });

        return removedCount;
    }

    // Check if cleanup is in progress
    isCleanupInProgress(): boolean {
        return this.isCleaningUp;
    }

    // Graceful reconnection after deletion operations
    async gracefulReconnectionAfterDeletion(context: string): Promise<void> {
        console.log(`🔧 ListenerManager: Graceful reconnection for ${context} after deletion...`);

        // Wait a bit to ensure deletion operations complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mark that cleanup is complete and listeners can be recreated
        this.isCleaningUp = false;

        console.log(`🔧 ListenerManager: ${context} listeners can now be recreated safely`);
    }
}

// Create a singleton instance
export const listenerManager = new ListenerManager();

// Export the class for testing purposes
export { ListenerManager };
