/**
 * 🔧 Tests for Batch Message Service
 * 
 * This file tests the batching functionality to ensure it works correctly
 * and reduces Firebase requests as expected.
 */

import { batchMessageService } from '../batchMessageService';

// Mock Firebase for testing
jest.mock('../firebase', () => ({
    db: {},
}));

describe('BatchMessageService', () => {
    beforeEach(() => {
        // Clear any existing batches before each test
        jest.clearAllTimers();
    });

    afterEach(() => {
        // Cleanup after each test
        batchMessageService.destroy();
    });

    describe('markMessageAsRead', () => {
        it('should queue a single message for batching', async () => {
            const conversationId = 'test-conversation-1';
            const messageId = 'test-message-1';

            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await batchMessageService.markMessageAsRead(conversationId, messageId);

            // Should log that message was queued
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('📊 [BATCH] Message test-message-1 queued for batch read receipt')
            );

            consoleSpy.mockRestore();
        });

        it('should queue multiple messages for the same conversation', async () => {
            const conversationId = 'test-conversation-2';
            const messageIds = ['msg-1', 'msg-2', 'msg-3'];

            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Queue multiple messages
            for (const messageId of messageIds) {
                await batchMessageService.markMessageAsRead(conversationId, messageId);
            }

            // Should log each message being queued
            expect(consoleSpy).toHaveBeenCalledTimes(3);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('📊 [BATCH] Message msg-1 queued for batch read receipt')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('📊 [BATCH] Message msg-2 queued for batch read receipt')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('📊 [BATCH] Message msg-3 queued for batch read receipt')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('markAllUnreadMessagesAsRead', () => {
        it('should handle empty message arrays', async () => {
            const conversationId = 'test-conversation-3';
            const userId = 'test-user-1';

            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await batchMessageService.markAllUnreadMessagesAsRead(conversationId, userId);

            // Should not log anything for empty arrays
            expect(consoleSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('📊 [BATCH] Marking')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getStatus', () => {
        it('should return service status', () => {
            const status = batchMessageService.getStatus();

            expect(status).toHaveProperty('readReceiptQueue');
            expect(status).toHaveProperty('config');
            expect(status.config).toHaveProperty('READ_RECEIPT_BATCH_SIZE');
            expect(status.config).toHaveProperty('READ_RECEIPT_BATCH_DELAY');
        });
    });

    describe('cleanup', () => {
        it('should cleanup resources on destroy', () => {
            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            batchMessageService.destroy();

            // Should not throw any errors
            expect(() => batchMessageService.destroy()).not.toThrow();

            consoleSpy.mockRestore();
        });
    });
});
