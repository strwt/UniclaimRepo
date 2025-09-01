/**
 * 🔧 Tests for Smart Listener Manager
 * 
 * This file tests the smart listener management functionality to ensure it
 * correctly tracks conversation activity and manages Firebase listeners.
 */

import { smartListenerManager } from '../smartListenerManager';

// Mock the ListenerManager
jest.mock('../ListenerManager', () => ({
    listenerManager: {
        getSuspendedListener: jest.fn(),
        resumeListener: jest.fn(),
        suspendListener: jest.fn(),
    },
}));

describe('SmartListenerManager', () => {
    beforeEach(() => {
        // Clear any existing data before each test
        jest.clearAllTimers();
    });

    afterEach(() => {
        // Cleanup after each test
        smartListenerManager.destroy();
    });

    describe('markConversationActive', () => {
        it('should mark a new conversation as active', () => {
            const conversationId = 'test-conversation-1';

            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            smartListenerManager.markConversationActive(conversationId);

            // Should log that conversation was marked as active
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('📱 [SMART] Conversation test-conversation-1 marked as active')
            );

            // Check if conversation is tracked as active
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(true);

            consoleSpy.mockRestore();
        });

        it('should update existing conversation activity', () => {
            const conversationId = 'test-conversation-2';

            // Mark conversation as active twice
            smartListenerManager.markConversationActive(conversationId);
            smartListenerManager.markConversationActive(conversationId);

            // Should still be active
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(true);

            // Should have updated activity time
            const status = smartListenerManager.getConversationStatus(conversationId);
            expect(status).toBeTruthy();
            expect(status?.isActive).toBe(true);
        });
    });

    describe('markConversationInactive', () => {
        it('should mark conversation as inactive', () => {
            const conversationId = 'test-conversation-3';

            // First mark as active
            smartListenerManager.markConversationActive(conversationId);
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(true);

            // Then mark as inactive
            smartListenerManager.markConversationInactive(conversationId);
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(false);

            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            smartListenerManager.markConversationInactive(conversationId);

            // Should log that conversation was marked as inactive
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('📱 [SMART] Conversation test-conversation-3 marked as inactive')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('updateConversationActivity', () => {
        it('should update conversation activity with message data', () => {
            const conversationId = 'test-conversation-4';
            const messageCount = 15;
            const lastMessageTime = Date.now();

            // Mark conversation as active first
            smartListenerManager.markConversationActive(conversationId);

            // Update activity
            smartListenerManager.updateConversationActivity(conversationId, messageCount, lastMessageTime);

            // Check if activity was updated
            const status = smartListenerManager.getConversationStatus(conversationId);
            expect(status).toBeTruthy();
            expect(status?.messageCount).toBe(messageCount);
            expect(status?.lastMessageTime).toBe(lastMessageTime);
        });

        it('should reactivate inactive conversation when activity updates', () => {
            const conversationId = 'test-conversation-5';

            // Mark as active then inactive
            smartListenerManager.markConversationActive(conversationId);
            smartListenerManager.markConversationInactive(conversationId);
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(false);

            // Update activity - should reactivate
            smartListenerManager.updateConversationActivity(conversationId, 5, Date.now());
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(true);
        });
    });

    describe('getActiveConversationStats', () => {
        it('should return correct statistics', () => {
            // Add multiple conversations
            smartListenerManager.markConversationActive('conv-1');
            smartListenerManager.markConversationActive('conv-2');
            smartListenerManager.markConversationInactive('conv-2');

            const stats = smartListenerManager.getActiveConversationStats();

            expect(stats.totalActive).toBe(1);
            expect(stats.totalSuspended).toBe(0);
            expect(stats.totalPending).toBe(1);
            expect(stats.memoryUsage).toBe(2);
        });
    });

    describe('getActiveConversationIds', () => {
        it('should return only active conversation IDs', () => {
            smartListenerManager.markConversationActive('conv-1');
            smartListenerManager.markConversationActive('conv-2');
            smartListenerManager.markConversationInactive('conv-2');

            const activeIds = smartListenerManager.getActiveConversationIds();

            expect(activeIds).toContain('conv-1');
            expect(activeIds).not.toContain('conv-2');
            expect(activeIds.length).toBe(1);
        });
    });

    describe('cleanup', () => {
        it('should cleanup resources on destroy', () => {
            // Add some conversations
            smartListenerManager.markConversationActive('conv-1');
            smartListenerManager.markConversationActive('conv-2');

            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            smartListenerManager.destroy();

            // Should log destruction message
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🗑️ [SMART] Smart listener manager destroyed')
            );

            // Should not throw errors on subsequent calls
            expect(() => smartListenerManager.destroy()).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe('conversation lifecycle', () => {
        it('should handle complete conversation lifecycle', () => {
            const conversationId = 'lifecycle-test';

            // 1. Mark as active
            smartListenerManager.markConversationActive(conversationId);
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(true);

            // 2. Update activity
            smartListenerManager.updateConversationActivity(conversationId, 10, Date.now());
            const status = smartListenerManager.getConversationStatus(conversationId);
            expect(status?.messageCount).toBe(10);

            // 3. Mark as inactive
            smartListenerManager.markConversationInactive(conversationId);
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(false);

            // 4. Reactivate through activity
            smartListenerManager.updateConversationActivity(conversationId, 15, Date.now());
            expect(smartListenerManager.isConversationActive(conversationId)).toBe(true);
        });
    });
});
