import React from 'react';
import type { Message } from '@/types/Post';
import ProfilePicture from './ProfilePicture';
import { messageService } from '../utils/firebase';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSenderName?: boolean;
  conversationId: string;
  currentUserId: string;
  onHandoverResponse?: (messageId: string, status: 'accepted' | 'rejected') => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showSenderName = false,
  conversationId,
  currentUserId,
  onHandoverResponse
}) => {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleHandoverResponse = async (status: 'accepted' | 'rejected') => {
    if (!onHandoverResponse) return;
    
    try {
      // Update the handover message with the response
      await messageService.updateHandoverResponse(
        conversationId,
        message.id,
        status,
        currentUserId
      );
      
      // Call the callback to update UI
      onHandoverResponse(message.id, status);
    } catch (error) {
      console.error('Failed to update handover response:', error);
    }
  };

  const renderHandoverRequest = () => {
    if (message.messageType !== 'handover_request') return null;
    
    const handoverData = message.handoverData;
    if (!handoverData) return null;

    // Only show buttons if the handover is still pending and current user is not the sender
    const canRespond = handoverData.status === 'pending' && !isOwnMessage;

    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800 mb-2">
          <strong>Handover Request:</strong> {handoverData.postTitle}
        </div>
        
        {canRespond ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleHandoverResponse('accepted')}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleHandoverResponse('rejected')}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="text-xs text-blue-600">
            Status: <span className="capitalize font-medium">{handoverData.status}</span>
            {handoverData.status !== 'pending' && (
              <span className="ml-2">
                {handoverData.respondedAt && `at ${formatTime(handoverData.respondedAt)}`}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHandoverResponse = () => {
    if (message.messageType !== 'handover_response') return null;
    
    const handoverData = message.handoverData;
    if (!handoverData) return null;

    const statusColor = handoverData.status === 'accepted' ? 'text-green-600' : 'text-red-600';
    const statusIcon = handoverData.status === 'accepted' ? '✅' : '❌';

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className={`text-sm ${statusColor} flex items-center gap-2`}>
          <span>{statusIcon}</span>
          <span className="capitalize font-medium">{handoverData.status}</span>
          {handoverData.responseMessage && (
            <span className="text-gray-600">- {handoverData.responseMessage}</span>
          )}
        </div>
      </div>
    );
  };

  const renderSystemMessage = () => {
    if (message.messageType !== 'system') return null;
    
    return (
      <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-sm text-yellow-800">
          <span className="font-medium">System:</span> {message.text}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {showSenderName && !isOwnMessage && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 ml-2">
            <ProfilePicture
              src={message.senderProfilePicture}
              alt="sender profile"
              size="xs"
            />
            <span>{message.senderName}</span>
          </div>
        )}
        
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-200 text-gray-800 rounded-bl-md'
          }`}
        >
          <p className="text-sm break-words">{message.text}</p>
          
          {/* Render special message types */}
          {renderHandoverRequest()}
          {renderHandoverResponse()}
          {renderSystemMessage()}
        </div>
        
        <div className={`text-xs text-gray-400 mt-1 ${
          isOwnMessage ? 'text-right mr-2' : 'ml-2'
        }`}>
          {formatTime(message.timestamp)}
          {isOwnMessage && (
            <span className="ml-2">
              {message.readBy && message.readBy.length > 1 ? (
                <span className="text-blue-500" title="Read">✓✓</span>
              ) : (
                <span className="text-gray-400" title="Delivered">✓</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
