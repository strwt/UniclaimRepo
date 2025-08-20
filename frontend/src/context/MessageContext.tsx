import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { messageService } from "../utils/firebase";
import { listenerManager } from "../utils/ListenerManager";
import type { Conversation, Message } from "@/types/Post";

interface MessageContextType {
  conversations: Conversation[];
  loading: boolean;
  totalUnreadCount: number;
  sendMessage: (conversationId: string, senderId: string, senderName: string, text: string) => Promise<void>;
  createConversation: (postId: string, postTitle: string, postOwnerId: string, currentUserId: string, currentUserData: any, postOwnerUserData?: any) => Promise<string>;
  getConversationMessages: (conversationId: string, callback: (messages: Message[]) => void) => () => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  markMessageAsRead: (conversationId: string, messageId: string) => Promise<void>;
  cleanupListeners: () => void; // Add cleanupListeners to the interface
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children, userId }: { children: ReactNode; userId: string | null }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentListenerId, setCurrentListenerId] = useState<string | null>(null);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

  // Load user conversations
  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      // Clean up any existing listener
      if (currentListenerId) {
        listenerManager.removeListener(currentListenerId);
        setCurrentListenerId(null);
      }
      return;
    }

    setLoading(true);
    
    // Clean up previous listener if it exists
    if (currentListenerId) {
      listenerManager.removeListener(currentListenerId);
    }

    const unsubscribe = messageService.getUserConversations(userId, (loadedConversations) => {
      setConversations(loadedConversations);
      setLoading(false);
    });

    // Register the listener with the ListenerManager
    const listenerId = listenerManager.addListener(unsubscribe, 'MessageContext');
    setCurrentListenerId(listenerId);

    return () => {
      if (currentListenerId) {
        listenerManager.removeListener(currentListenerId);
        setCurrentListenerId(null);
      }
    };
  }, [userId]);

  // Cleanup function to be called from outside (e.g., during logout)
  const cleanupListeners = () => {
    if (currentListenerId) {
      listenerManager.removeListener(currentListenerId);
      setCurrentListenerId(null);
    }
    // Also clean up any other MessageContext listeners
    listenerManager.cleanupByContext('MessageContext');
  };

  const sendMessage = async (conversationId: string, senderId: string, senderName: string, text: string): Promise<void> => {
    try {
      await messageService.sendMessage(conversationId, senderId, senderName, text);
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
      throw new Error(error.message || 'Failed to mark message as read');
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
        cleanupListeners, // Expose cleanup function
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
