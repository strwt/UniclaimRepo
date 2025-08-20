// ListenerManager.ts - Centralized management of all Firestore listeners
export type UnsubscribeFunction = () => void;

class ListenerManager {
    private listeners: Map<string, UnsubscribeFunction> = new Map();
    private listenerCount = 0;

    // Add a new listener and return a unique ID
    addListener(unsubscribeFn: UnsubscribeFunction, context: string = 'unknown'): string {
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
            } catch (error) {
                this.listeners.delete(listenerId);
                return false;
            }
        }
        return false;
    }

    // Remove all listeners
    removeAllListeners(): void {
        this.listeners.forEach((unsubscribeFn) => {
            try {
                unsubscribeFn();
            } catch (error) {
                // Silent error handling
            }
        });

        this.listeners.clear();
        this.listenerCount = 0;
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

    // Clean up listeners by context (e.g., 'MessageContext', 'AuthContext')
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
}

// Create a singleton instance
export const listenerManager = new ListenerManager();

// Export the class for testing purposes
export { ListenerManager };
