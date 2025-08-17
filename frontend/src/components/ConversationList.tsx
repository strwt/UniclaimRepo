import React from 'react';
import { useMessage } from '../context/MessageContext';
import type { Conversation } from '../types/Post';
import LoadingSpinner from './LoadingSpinner';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId
}) => {
  const { conversations, loading } = useMessage();

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

  const getParticipantNames = (conversation: Conversation) => {
    const participants = Object.values(conversation.participants);
    return participants.map(p => `${p.firstName} ${p.lastName}`).join(', ');
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.postTitle}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {getParticipantNames(conversation)}
                  </p>
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
