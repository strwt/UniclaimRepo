import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { Conversation } from "@/types/Post";
import ConversationList from "../../components/ConversationList";
import ChatWindow from "../../components/ChatWindow";
import PageWrapper from "../../components/PageWrapper";
import NavHeader from "../../components/NavHeadComp";

const MessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isGoingBack, setIsGoingBack] = useState(false);

  // Handle URL changes and clear selected conversation when no conversation is specified
  useEffect(() => {
    const conversationParam = searchParams.get("conversation");
    if (!conversationParam) {
      // No conversation in URL, clear the selected conversation
      setSelectedConversation(null);
    }
  }, [searchParams]);

  const handleSelectConversation = (conversation: Conversation) => {
    if (!isGoingBack) {
      setSelectedConversation(conversation);
    }
  };

  const handleBackToConversations = () => {
    // Prevent auto-selection while going back
    setIsGoingBack(true);

    // Clear the conversation parameter from URL
    setSearchParams(new URLSearchParams());

    // Clear the selected conversation state immediately
    setSelectedConversation(null);

    // Reset the flag after a short delay to allow normal operation
    setTimeout(() => {
      setIsGoingBack(false);
    }, 100);
  };

  // Auto-selection is now handled entirely by ConversationList component

  return (
    <PageWrapper title="Messages">
      <div className="max-h-40 bg-gray-50">
        <div className="max-w-8xl mx-auto">
          {/* Page Header */}
          <div className="hidden bg-white border-gray-200 lg:block">
            <div className="px-4 py-3 sm:px-6 lg:px-8">
              <h1 className="text-base font-bold text-gray-900">Messages</h1>
              <p className="mt-1 text-xs text-gray-500">
                Chat with other users about lost and found items
              </p>
            </div>
          </div>

          {/* mobile nav */}
          <NavHeader
            title="Message"
            description="Chat with other users about lost and found items"
          />

          {/* Messages Layout */}
          <div className="flex h-[calc(111.5vh-280px)] bg-white rounded-lg overflow-hidden mt-1">
            {/* Conversation List - Left Side */}
            <div className="w-full sm:w-72 md:w-80 lg:w-96 border-r border-gray-200 flex flex-col">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
                autoSelectConversationId={searchParams.get("conversation")}
              />
            </div>

            {/* Chat Window - Right Side - Visible on sm and up, hidden only on xs */}
            <div className="flex-1 hidden sm:flex flex-col h-full min-w-0">
              {selectedConversation ? (
                <ChatWindow 
                  conversation={selectedConversation} 
                  onClearConversation={() => setSelectedConversation(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center text-gray-500">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-sm text-gray-500">Choose a conversation from the list to start chatting</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Chat Overlay - Only on very small screens (xs) */}
            {selectedConversation && (
              <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                  <button
                    onClick={handleBackToConversations}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h3 className="font-medium text-gray-900">
                    Back to Conversations
                  </h3>
                  <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                {/* Mobile Chat */}
                <div className="flex-1 overflow-hidden">
                  <ChatWindow 
                    conversation={selectedConversation} 
                    onClearConversation={() => setSelectedConversation(null)}
                  />
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
