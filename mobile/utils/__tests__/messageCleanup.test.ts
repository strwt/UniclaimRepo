/**
 * 🔒 Message Cleanup Test
 * 
 * This test verifies that the 50-message limit cleanup functionality works correctly.
 * It tests the cleanupOldMessages function to ensure it properly deletes old messages.
 */

import { messageService } from '../firebase';

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getDocs: jest.fn(),
    deleteDoc: jest.fn(),
}));

describe('Message Cleanup Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should cleanup old messages when count exceeds 50', async () => {
        // Mock data for 55 messages
        const mockMessages = Array.from({ length: 55 }, (_, i) => ({
            id: `msg_${i}`,
            ref: { path: `conversations/conv1/messages/msg_${i}` },
            data: () => ({
                text: `Message ${i}`,
                timestamp: new Date(2024, 0, i + 1)
            })
        }));

        // Mock getDocs to return 55 messages
        const { getDocs } = require('firebase/firestore');
        getDocs.mockResolvedValue({
            docs: mockMessages
        });

        // Mock deleteDoc to return resolved promise
        const { deleteDoc } = require('firebase/firestore');
        deleteDoc.mockResolvedValue(undefined);

        // Call cleanup function
        await messageService.cleanupOldMessages('conv1');

        // Verify that 5 oldest messages were deleted
        expect(deleteDoc).toHaveBeenCalledTimes(5);

        // Verify the correct messages were deleted (oldest first)
        expect(deleteDoc).toHaveBeenCalledWith(mockMessages[0].ref);
        expect(deleteDoc).toHaveBeenCalledWith(mockMessages[1].ref);
        expect(deleteDoc).toHaveBeenCalledWith(mockMessages[2].ref);
        expect(deleteDoc).toHaveBeenCalledWith(mockMessages[3].ref);
        expect(deleteDoc).toHaveBeenCalledWith(mockMessages[4].ref);
    });

    test('should not cleanup when message count is 50 or less', async () => {
        // Mock data for 50 messages
        const mockMessages = Array.from({ length: 50 }, (_, i) => ({
            id: `msg_${i}`,
            ref: { path: `conversations/conv1/messages/msg_${i}` },
            data: () => ({
                text: `Message ${i}`,
                timestamp: new Date(2024, 0, i + 1)
            })
        }));

        // Mock getDocs to return 50 messages
        const { getDocs } = require('firebase/firestore');
        getDocs.mockResolvedValue({
            docs: mockMessages
        });

        // Mock deleteDoc
        const { deleteDoc } = require('firebase/firestore');
        deleteDoc.mockResolvedValue(undefined);

        // Call cleanup function
        await messageService.cleanupOldMessages('conv1');

        // Verify that no messages were deleted
        expect(deleteDoc).not.toHaveBeenCalled();
    });

    test('should handle cleanup errors gracefully', async () => {
        // Mock getDocs to throw an error
        const { getDocs } = require('firebase/firestore');
        getDocs.mockRejectedValue(new Error('Database error'));

        // Mock deleteDoc
        const { deleteDoc } = require('firebase/firestore');
        deleteDoc.mockResolvedValue(undefined);

        // Call cleanup function - should not throw error
        await expect(messageService.cleanupOldMessages('conv1')).resolves.not.toThrow();

        // Verify that no messages were deleted due to error
        expect(deleteDoc).not.toHaveBeenCalled();
    });
});
