import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { messageService } from "../utils/firebase";
import type { Conversation, Message } from "@/types/Post";

interface MessageContextType {
  conversations: Conversation[];
  loading: boolean;
  totalUnreadCount: number;
  sendMessage: (conversationId: string, senderId: string, senderName: string, text: string, senderProfilePicture?: string) => Promise<void>;
  createConversation: (postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: any, postOwnerUserData?: any) => Promise<string>;
  getConversationMessages: (conversationId: string, callback: (messages: Message[]) => void) => () => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  markMessageAsRead: (conversationId: string, messageId: string) => Promise<void>;
  refreshConversations: () => Promise<void>; // Simplified refresh function
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children, userId }: { children: ReactNode; userId: string | null }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

  // Load user conversations
  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Simple listener that automatically handles conversation updates
    const unsubscribe = messageService.getUserConversations(userId, (loadedConversations) => {
      console.log('🔧 MessageContext: Received conversations update:', loadedConversations.length);
      setConversations(loadedConversations);
      setLoading(false);
    }, (error) => {
      console.error('🔧 MessageContext: Listener error:', error);
      setLoading(false);
      
      // If there's an error, try to refresh conversations manually
      if (error?.code === 'permission-denied' || error?.code === 'not-found') {
        console.log('🔧 MessageContext: Permission or not-found error, will refresh manually');
        refreshConversations();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const sendMessage = async (conversationId: string, senderId: string, senderName: string, text: string, senderProfilePicture?: string): Promise<void> => {
    try {
      await messageService.sendMessage(conversationId, senderId, senderName, text, senderProfilePicture);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send message');
    }
  };

  const createConversation = async (postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: any, postOwnerUserData?: any): Promise<string> => {
    try {
      return await messageService.createConversation(postId, postTitle, postOwnerId, currentUserId, currentUserData, postOwnerUserData);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create conversation');
    }
  };

  const getConversationMessages = (conversationId: string, callback: (messages: Message[]) => void) => {
    return messageService.getConversationMessages(conversationId, callback);
  };

  const markConversationAsRead = async (conversationId: string): Promise<void> => {
    try {
      await messageService.markConversationAsRead(conversationId, userId!);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark conversation as read');
    }
  };

  const markMessageAsRead = async (conversationId: string, messageId: string): Promise<void> => {
    try {
      await messageService.markMessageAsRead(conversationId, messageId, userId!);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark conversation as read');
    }
  };

  // Simple refresh function that fetches current conversations
  const refreshConversations = async (): Promise<void> => {
    if (!userId) return;
    
    try {
      console.log('🔧 MessageContext: Refreshing conversations...');
      setLoading(true);
      
      // Use a one-time query to get current state
      const currentConversations = await messageService.getCurrentConversations(userId);
      console.log('🔧 MessageContext: Refresh result:', currentConversations.length, 'conversations');
      
      setConversations(currentConversations);
      setLoading(false);
    } catch (error: any) {
      console.error('🔧 MessageContext: Refresh failed:', error);
      setLoading(false);
      throw new Error(error.message || 'Failed to refresh conversations');
    }
  };

  return (
    <MessageContext.Provider
      value={{
        conversations,
        loading,
        totalUnreadCount,
        sendMessage,
        createConversation,
        getConversationMessages,
        markConversationAsRead,
        markMessageAsRead,
        refreshConversations,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within MessageProvider");
  }
  return context;
};
