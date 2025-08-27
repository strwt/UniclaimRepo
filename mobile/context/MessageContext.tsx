import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { messageService } from "../utils/firebase";
import type { Conversation, Message } from "../types/type";

interface MessageContextType {
  conversations: Conversation[];
  loading: boolean;
  sendMessage: (conversationId: string, senderId: string, senderName: string, text: string, senderProfilePicture?: string) => Promise<void>;
  createConversation: (postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: any, postOwnerUserData?: any) => Promise<string>;
  getConversationMessages: (conversationId: string, callback: (messages: Message[]) => void) => () => void;
  getConversation: (conversationId: string) => Promise<any>; // Add getConversation function
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>; // New: Delete message function
  refreshConversations: () => Promise<void>; // Add refresh function
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children, userId }: { children: ReactNode; userId: string | null }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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
      setConversations(loadedConversations);
      setLoading(false);
    }, (error) => {
      console.error('Mobile MessageContext: Listener error:', error);
      setLoading(false);
      
      // If there's an error, try to refresh conversations manually
      if (error?.code === 'permission-denied' || error?.code === 'not-found') {
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

  // Simple refresh function that fetches current conversations
  const refreshConversations = async (): Promise<void> => {
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
      throw new Error(error.message || 'Failed to refresh conversations');
    }
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
    throw new Error('useMessage must be used within MessageProvider');
  }
  return context;
};
