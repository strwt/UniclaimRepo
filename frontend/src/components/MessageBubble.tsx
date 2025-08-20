import React from 'react';
import type { Message } from '@/types/Post';
import ProfilePicture from './ProfilePicture';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSenderName?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showSenderName = false
}) => {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
