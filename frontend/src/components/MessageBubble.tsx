import React, { useState } from 'react';
import type { Message } from '@/types/Post';
import ProfilePicture from './ProfilePicture';
import { useMessage } from '../context/MessageContext';

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
  const { deleteMessage, updateHandoverResponse } = useMessage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleHandoverResponse = async (status: 'accepted' | 'rejected') => {
    if (!onHandoverResponse) return;
    
    try {
      // Update the handover message with the response
      await updateHandoverResponse(conversationId, message.id, status);
      
      // Call the callback to update UI
      onHandoverResponse(message.id, status);
    } catch (error) {
      console.error('Failed to update handover response:', error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!isOwnMessage) return;
    
    try {
      setIsDeleting(true);
      await deleteMessage(conversationId, message.id);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      alert(`Failed to delete message: ${error.message}`);
    } finally {
      setIsDeleting(false);
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
          <div className="flex items-center justify-between">
            <div>
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
            
            {/* Delete button for own messages */}
            {isOwnMessage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                title="Delete message"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        
        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Message?</h3>
              <p className="text-gray-600 mb-4">This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMessage}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
