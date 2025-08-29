import React, { useState, useEffect, useRef } from 'react';
import { useMessage } from '../context/MessageContext';
import type { Conversation, Message } from '@/types/Post';
import MessageBubble from './MessageBubble';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import ProfilePicture from './ProfilePicture';
import { messageService } from '../utils/firebase';
import ClaimVerificationModal from './ClaimVerificationModal';
import { cloudinaryService } from '../utils/cloudinary';

interface ChatWindowProps {
  conversation: Conversation | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, getConversationMessages, markConversationAsRead, sendClaimRequest } = useMessage();
  const { userData } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isScrolledUp = target.scrollTop < target.scrollHeight - target.clientHeight - 100;
    setShowScrollToBottom(isScrolledUp);
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
      if (userData && conversation.unreadCounts?.[userData.uid] > 0) {
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

  const handleHandoverResponse = (_messageId: string, _status: 'accepted' | 'rejected') => {
    // This function will be called when a handover response is made
    // The actual update is handled in the MessageBubble component
  };

  const handleClaimResponse = (_messageId: string, _status: 'accepted' | 'rejected') => {
    // This function will be called when a claim response is made
    // The actual update is handled in the MessageBubble component
  };

  const handleHandoverRequest = async () => {
    if (!conversation || !userData) return;

    try {
      await messageService.sendHandoverRequest(
        conversation.id,
        userData.uid,
        `${userData.firstName} ${userData.lastName}`,
        userData.profilePicture || userData.profileImageUrl || '',
        conversation.postId,
        conversation.postTitle
      );
    } catch (error) {
      console.error('Failed to send handover request:', error);
      // You could add a toast notification here
    }
  };



  const handleOpenClaimModal = () => {
    setShowClaimModal(true);
  };

  const handleCloseClaimModal = () => {
    setShowClaimModal(false);
  };

  const handleSubmitClaim = async (claimReason: string, idPhotoFile: File | null) => {
    if (!conversation || !userData || !idPhotoFile) {
      return;
    }

    setIsClaimSubmitting(true);
    try {
      // First, upload the ID photo to Cloudinary using the existing service
      const idPhotoUrl = await cloudinaryService.uploadImage(idPhotoFile, 'id_photos');
      
      console.log('ID photo uploaded successfully:', idPhotoUrl);
      console.log('Claim reason provided:', claimReason);
      
      // Now send the claim request with the ID photo URL
      await sendClaimRequest(
        conversation.id,
        userData.uid,
        `${userData.firstName} ${userData.lastName}`,
        userData.profilePicture || userData.profileImageUrl || '',
        conversation.postId,
        conversation.postTitle,
        claimReason,
        idPhotoUrl
      );
      
      // Close modal and show success message
      setShowClaimModal(false);
      alert('Claim request sent successfully!');
    } catch (error) {
      console.error('Failed to send claim request:', error);
      alert('Failed to send claim request. Please try again.');
    } finally {
      setIsClaimSubmitting(false);
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

  // Check if claim item button should be shown
  const shouldShowClaimItemButton = () => {
    if (!conversation || !userData) {
      return false;
    }

    // Only show for found items
    if (conversation.postType !== 'found') {
      return false;
    }

    // Only show if post is still pending
    if (conversation.postStatus !== 'pending') {
      return false;
    }

    // Only show if found action is "keep" (Found and Keep posts)
    if (conversation.foundAction !== 'keep') {
      return false;
    }

    // Don't show if current user is the post creator
    if (conversation.postCreatorId === userData.uid) {
      return false;
    }

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
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{conversation.postTitle}</h3>
              {/* Post Type Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                conversation.postType === 'found' 
                  ? 'bg-green-300 text-green-800' 
                  : 'bg-orange-300 text-orange-800'
              }`}>
                {conversation.postType === 'found' ? 'FOUND' : 'LOST'}
              </span>
            </div>
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
            <button 
              onClick={handleHandoverRequest}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Handover Item
            </button>
          )}

          {/* Claim Item Button */}
          {shouldShowClaimItemButton() && (
            <button 
              onClick={handleOpenClaimModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Claim Item
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="overflow-y-auto p-4 bg-gray-50 scroll-smooth hover:scrollbar-thin hover:scrollbar-thumb-gray-300 hover:scrollbar-track-gray-100 relative flex-1 min-h-0"
        style={{ 
          scrollBehavior: 'smooth'
        }}
        onScroll={handleScroll}
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
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === userData?.uid}
                showSenderName={Object.keys(conversation.participants).length > 2}
                conversationId={conversation.id}
                currentUserId={userData?.uid || ''}
                onHandoverResponse={handleHandoverResponse}
                onClaimResponse={handleClaimResponse}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200 z-10"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 mt-auto">
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

      {/* Claim Verification Modal */}
      <ClaimVerificationModal
        isOpen={showClaimModal}
        onClose={handleCloseClaimModal}
        onSubmit={handleSubmitClaim}
        itemTitle={conversation?.postTitle || ''}
        isLoading={isClaimSubmitting}
      />
    </div>
  );
};

export default ChatWindow;
