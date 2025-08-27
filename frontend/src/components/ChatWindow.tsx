import React, { useState, useEffect, useRef } from 'react';
import { useMessage } from '../context/MessageContext';
import type { Conversation, Message } from '@/types/Post';
import MessageBubble from './MessageBubble';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import ProfilePicture from './ProfilePicture';
import { messageService } from '../utils/firebase';

interface ChatWindowProps {
  conversation: Conversation | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, getConversationMessages, markConversationAsRead } = useMessage();
  const { userData } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    const unsubscribe = getConversationMessages(conversation.id, (loadedMessages) => {
      setMessages(loadedMessages);
      setIsLoading(false);
      
      // Mark conversation as read when messages are loaded
      if (userData && conversation.unreadCount && conversation.unreadCount > 0) {
        markConversationAsRead(conversation.id);
      }
    });

    return () => unsubscribe();
  }, [conversation, getConversationMessages, markConversationAsRead, userData]);

  // Update existing conversations with missing post data
  useEffect(() => {
    if (!conversation || !userData) return;

    // Check if conversation has the new fields, if not, update it
    if (!conversation.postType || !conversation.postStatus || !conversation.postCreatorId) {
      messageService.updateConversationPostData(conversation.id)
        .catch(error => {
          console.error('Failed to update conversation post data:', error);
        });
    }
  }, [conversation, userData]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conversation || !userData || !newMessage.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(
        conversation.id,
        userData.uid,
        `${userData.firstName} ${userData.lastName}`,
        newMessage.trim(),
        userData.profilePicture || userData.profileImageUrl
      );
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // You could add a toast notification here
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipantName = (conversation: Conversation) => {
    if (!userData) return 'Unknown User';
    
    const otherParticipants = Object.entries(conversation.participants)
      .filter(([uid]) => uid !== userData.uid) // Exclude current user
      .map(([, participant]) => `${participant.firstName} ${participant.lastName}`.trim())
      .filter(name => name.length > 0);
    
    return otherParticipants.length > 0 ? otherParticipants.join(', ') : 'Unknown User';
  };

  const getOtherParticipantProfilePicture = (conversation: Conversation) => {
    if (!userData) return null;
    
    const otherParticipant = Object.entries(conversation.participants)
      .find(([uid]) => uid !== userData.uid);
    
    return otherParticipant ? (otherParticipant[1].profilePicture || otherParticipant[1].profileImageUrl) : null;
  };

  // Check if handover button should be shown
  const shouldShowHandoverButton = () => {
    if (!conversation || !userData) return false;
    
    // Only show for lost items
    if (conversation.postType !== 'lost') return false;
    
    // Only show if post is still pending
    if (conversation.postStatus !== 'pending') return false;
    
    // Don't show if current user is the post creator
    if (conversation.postCreatorId === userData.uid) return false;
    
    return true;
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center  mt-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose a conversation from the list to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full  mt-11.5">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{conversation.postTitle}</h3>
            <div className="flex items-center gap-3 mt-1">
              <ProfilePicture
                src={getOtherParticipantProfilePicture(conversation)}
                alt="participant profile"
                size="sm"
              />
              <p className="text-sm text-gray-500">
                {getOtherParticipantName(conversation)}
              </p>
            </div>
          </div>
          
          {/* Handover Item Button */}
          {shouldShowHandoverButton() && (
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Handover Item
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0 border border-gray-200 rounded bg-blue-100"
        style={{ 
          minHeight: '200px'
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Test message to ensure scrolling works */}
            <div className="text-xs text-gray-400 text-center mb-4">
              Messages loaded: {messages.length}
            </div>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === userData?.uid}
                showSenderName={Object.keys(conversation.participants).length > 2}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 mt-auto bg-red-100">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
