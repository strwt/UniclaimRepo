import React, { useState } from 'react';
import type { Conversation } from '@/types/Post';
import ConversationList from '../../components/ConversationList';
import ChatWindow from '../../components/ChatWindow';
import PageWrapper from '../../components/PageWrapper';

const MessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="mt-1 text-sm text-gray-500">
                Chat with other users about lost and found items
              </p>
            </div>
          </div>

          {/* Messages Layout */}
          <div className="flex h-[calc(100vh-200px)] bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Conversation List - Left Side */}
            <div className="w-full sm:w-80 lg:w-96 border-r border-gray-200">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
              />
            </div>

            {/* Chat Window - Right Side */}
            <div className="flex-1 hidden sm:block">
              <ChatWindow conversation={selectedConversation} />
            </div>

            {/* Mobile Chat Overlay */}
            {selectedConversation && (
              <div className="sm:hidden fixed inset-0 z-50 bg-white">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="font-medium text-gray-900">Back to Conversations</h3>
                    <div className="w-10"></div> {/* Spacer for centering */}
                  </div>
                  
                  {/* Mobile Chat */}
                  <div className="flex-1">
                    <ChatWindow conversation={selectedConversation} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default MessagesPage;
