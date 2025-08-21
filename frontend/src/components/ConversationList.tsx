import React, { useEffect } from 'react';
import { useMessage } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import type { Conversation } from '../types/Post';
import LoadingSpinner from './LoadingSpinner';
import ProfilePicture from './ProfilePicture';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  autoSelectConversationId?: string | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
  autoSelectConversationId
}) => {
  const { conversations, loading } = useMessage();
  const { userData } = useAuth();

  // NEW: Debug conversations state changes
  useEffect(() => {
    console.log('🔧 ConversationList: Conversations state updated:', {
      count: conversations.length,
      conversations: conversations.map(conv => ({ id: conv.id, postId: conv.postId }))
    });
  }, [conversations]);

  // Auto-select conversation when component mounts or conversations change
  useEffect(() => {
    if (autoSelectConversationId && conversations.length > 0 && !selectedConversationId) {
      const conversationToSelect = conversations.find(conv => conv.id === autoSelectConversationId);
      if (conversationToSelect) {
        onSelectConversation(conversationToSelect);
      }
    }
  }, [autoSelectConversationId, conversations, selectedConversationId, onSelectConversation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-6xl mb-4">💬</div>
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm text-gray-400">Start chatting about lost and found items!</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Get the other participant's name (exclude current user)
  const getOtherParticipantName = (conversation: Conversation, currentUserId: string) => {
    const otherParticipants = Object.entries(conversation.participants)
      .filter(([uid]) => uid !== currentUserId) // Exclude current user
      .map(([, participant]) => `${participant.firstName} ${participant.lastName}`.trim())
      .filter(name => name.length > 0);
    
    return otherParticipants.length > 0 ? otherParticipants.join(', ') : 'Unknown User';
  };

  // Get the other participant's profile picture (exclude current user)
  const getOtherParticipantProfilePicture = (conversation: Conversation, currentUserId: string) => {
    const otherParticipant = Object.entries(conversation.participants)
      .find(([uid]) => uid !== currentUserId);
    
    return otherParticipant ? otherParticipant[1].profilePicture : null;
  };

  return (
    <div className="bg-white border-r border-gray-200 w-full max-w-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
        <p className="text-sm text-gray-500">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
      </div>
      
      <div className="overflow-y-auto h-[calc(100vh-200px)]">
        {conversations.map((conversation) => {
          const isSelected = selectedConversationId === conversation.id;
          const hasUnread = conversation.unreadCount && conversation.unreadCount > 0;
          
          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                                 <div className="flex items-center gap-3 flex-1 min-w-0">
                   <ProfilePicture
                     src={userData ? getOtherParticipantProfilePicture(conversation, userData.uid) : null}
                     alt="participant profile"
                     size="md"
                     className="flex-shrink-0"
                   />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.postTitle}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {userData ? getOtherParticipantName(conversation, userData.uid) : 'Unknown User'}
                    </p>
                  </div>
                </div>
                {hasUnread && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              
              {conversation.lastMessage && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                    {conversation.lastMessage.text}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTimestamp(conversation.lastMessage.timestamp)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
