import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { messageService } from "../utils/firebase";
import { useAuth } from "./AuthContext";
import type { Conversation, Message } from "../types/type";

interface MessageContextType {
  conversations: Conversation[];
  loading: boolean;
  sendMessage: (conversationId: string, senderId: string, senderName: string, text: string, senderProfilePicture?: string) => Promise<void>;
  createConversation: (postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: any, postOwnerUserData?: any) => Promise<string>;
  getConversationMessages: (conversationId: string, callback: (messages: Message[]) => void) => () => void;
  getConversation: (conversationId: string) => Promise<any>; // Add getConversation function
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>; // New: Delete message function
  updateHandoverResponse: (conversationId: string, messageId: string, status: 'accepted' | 'rejected') => Promise<void>; // New: Update handover response
  confirmHandoverIdPhoto: (conversationId: string, messageId: string) => Promise<void>; // New: Confirm ID photo function
  sendClaimRequest: (conversationId: string, senderId: string, senderName: string, senderProfilePicture: string, postId: string, postTitle: string) => Promise<void>; // New: Send claim request
  updateClaimResponse: (conversationId: string, messageId: string, status: 'accepted' | 'rejected') => Promise<void>; // New: Update claim response
  confirmClaimIdPhoto: (conversationId: string, messageId: string) => Promise<void>; // New: Confirm claim ID photo
  refreshConversations: () => Promise<void>; // Add refresh function
  markConversationAsRead: (conversationId: string, userId: string) => Promise<void>; // New: Mark conversation as read
  getUnreadConversationCount: (userId: string) => number; // New: Get count of conversations with unread messages
  getTotalUnreadMessageCount: (userId: string) => number; // New: Get total count of unread messages
  getConversationUnreadCount: (conversationId: string, userId: string) => number; // New: Get unread count for specific conversation
  getUnreadConversationsSummary: (userId: string) => { count: number; conversations: Array<{ id: string; postTitle: string; unreadCount: number; lastMessage?: any }> }; // New: Get detailed unread summary
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children, userId }: { children: ReactNode; userId: string | null }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  // Load user conversations
  useEffect(() => {
    // Admin users don't need conversations loaded
    if (isAdmin) {
      console.log('Admin user detected - skipping conversation loading');
      setConversations([]);
      setLoading(false);
      return;
    }

    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Simple listener that automatically handles conversation updates
    const unsubscribe = messageService.getUserConversations(userId, (loadedConversations) => {
      setConversations(loadedConversations);
      setLoading(false);
    }, (error) => {
      console.error('Mobile MessageContext: Listener error:', error);
      setLoading(false);

      // Only try to refresh for permission errors (not for admin users)
      if (error?.code === 'permission-denied' || error?.code === 'not-found') {
        console.log('Permission error detected, attempting refresh...');
        refreshConversations().catch(refreshError => {
          console.error('Refresh also failed:', refreshError);
          // If refresh fails, just set empty conversations
          setConversations([]);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId, isAdmin]);

  const sendMessage = async (conversationId: string, senderId: string, senderName: string, text: string, senderProfilePicture?: string): Promise<void> => {
    // Admin users shouldn't send messages through the mobile app
    if (isAdmin) {
      throw new Error('Admin users cannot send messages through the mobile app. Please use the admin interface.');
    }

    try {
      await messageService.sendMessage(conversationId, senderId, senderName, text, senderProfilePicture);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  };

  const createConversation = async (postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: any, postOwnerUserData?: any): Promise<string> => {
    // Admin users shouldn't create conversations through the mobile app
    if (isAdmin) {
      throw new Error('Admin users cannot create conversations through the mobile app. Please use the admin interface.');
    }

    try {
      return await messageService.createConversation(postId, postTitle, postOwnerId, currentUserId, currentUserData, postOwnerUserData);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create conversation');
    }
  };

  const getConversationMessages = (conversationId: string, callback: (messages: Message[]) => void) => {
    return messageService.getConversationMessages(conversationId, callback);
  };

  const getConversation = async (conversationId: string) => {
    try {
      return await messageService.getConversation(conversationId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get conversation');
    }
  };

  const deleteMessage = async (conversationId: string, messageId: string): Promise<void> => {
    try {
      await messageService.deleteMessage(conversationId, messageId, userId!);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete message');
    }
  };

  const confirmHandoverIdPhoto = async (conversationId: string, messageId: string): Promise<void> => {
    try {
      await messageService.confirmHandoverIdPhoto(conversationId, messageId, userId!);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to confirm handover ID photo');
    }
  };

  const updateHandoverResponse = async (conversationId: string, messageId: string, status: 'accepted' | 'rejected'): Promise<void> => {
    try {
      await messageService.updateHandoverResponse(conversationId, messageId, status, userId!);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update handover response');
    }
  };

  const sendClaimRequest = async (conversationId: string, senderId: string, senderName: string, senderProfilePicture: string, postId: string, postTitle: string): Promise<void> => {
    try {
      await messageService.sendClaimRequest(conversationId, senderId, senderName, senderProfilePicture, postId, postTitle);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send claim request');
    }
  };

  const updateClaimResponse = async (conversationId: string, messageId: string, status: 'accepted' | 'rejected'): Promise<void> => {
    try {
      await messageService.updateClaimResponse(conversationId, messageId, status, userId!);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update claim response');
    }
  };

  const confirmClaimIdPhoto = async (conversationId: string, messageId: string): Promise<void> => {
    try {
      await messageService.confirmClaimIdPhoto(conversationId, messageId, userId!);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to confirm claim ID photo');
    }
  };

  // Simple refresh function that fetches current conversations
  const refreshConversations = async (): Promise<void> => {
    // Admin users don't need conversation refresh
    if (isAdmin) {
      console.log('Admin user detected - skipping conversation refresh');
      setConversations([]);
      setLoading(false);
      return;
    }

    if (!userId) return;

    try {
      setLoading(true);

      // Use a one-time query to get current state
      const currentConversations = await messageService.getCurrentConversations(userId);

      setConversations(currentConversations);
      setLoading(false);
    } catch (error: any) {
      console.error('🔧 Mobile MessageContext: Refresh failed:', error);
      setLoading(false);

      // For permission errors, don't throw - just log and continue
      if (error?.code === 'permission-denied') {
        console.log('Permission denied during refresh - this is expected for some users');
        setConversations([]);
        return;
      }

      throw new Error(error.message || 'Failed to refresh conversations');
    }
  };

  // Mark conversation as read for a specific user
  const markConversationAsRead = async (conversationId: string, userId: string): Promise<void> => {
    // Admin users don't need to mark conversations as read
    if (isAdmin) {
      console.log('Admin user detected - skipping mark as read');
      return;
    }

    if (!userId) return;

    try {
      // Update the conversation's unread count for this user
      await messageService.markConversationAsRead(conversationId, userId);
      
      // Update local state to reflect the change
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCounts: { ...conv.unreadCounts, [userId]: 0 } }
            : conv
        )
      );
    } catch (error: any) {
      console.error('Failed to mark conversation as read:', error);
      // Don't throw error - just log it
    }
  };

  // Get count of conversations with unread messages for a specific user
  const getUnreadConversationCount = (userId: string): number => {
    if (!userId || isAdmin) return 0;
    
    return conversations.filter(conv => 
      conv.unreadCounts?.[userId] > 0
    ).length;
  };

  // Get total count of unread messages for a specific user (optional - for future use)
  const getTotalUnreadMessageCount = (userId: string): number => {
    if (!userId || isAdmin) return 0;
    
    return conversations.reduce((total, conv) => 
      total + (conv.unreadCounts?.[userId] || 0), 0
    );
  };

  // Get unread count for a specific conversation (useful for chat headers)
  const getConversationUnreadCount = (conversationId: string, userId: string): number => {
    if (!userId || isAdmin) return 0;
    
    const conversation = conversations.find(conv => conv.id === conversationId);
    return conversation?.unreadCounts?.[userId] || 0;
  };

  // Get unread conversations summary (useful for notifications or other UI elements)
  const getUnreadConversationsSummary = (userId: string) => {
    if (!userId || isAdmin) return { count: 0, conversations: [] };
    
    const unreadConversations = conversations.filter(conv => 
      conv.unreadCounts?.[userId] > 0
    );
    
    return {
      count: unreadConversations.length,
      conversations: unreadConversations.map(conv => ({
        id: conv.id,
        postTitle: conv.postTitle,
        unreadCount: conv.unreadCounts?.[userId] || 0,
        lastMessage: conv.lastMessage
      }))
    };
  };

  return (
    <MessageContext.Provider
      value={{
        conversations,
        loading,
        sendMessage,
        createConversation,
        getConversationMessages,
        getConversation,
        deleteMessage,
        updateHandoverResponse,
        confirmHandoverIdPhoto,
        sendClaimRequest,
        updateClaimResponse,
        confirmClaimIdPhoto,
        refreshConversations,
        markConversationAsRead,
        getUnreadConversationCount,
        getTotalUnreadMessageCount,
        getConversationUnreadCount,
        getUnreadConversationsSummary,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within MessageProvider');
  }
  return context;
};
