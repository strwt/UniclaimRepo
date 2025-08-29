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
  const [searchParams] = useSearchParams();

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  // Auto-select conversation from URL parameter
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId && !selectedConversation) {
      // Find the conversation in the list and select it
      // This will be handled by the ConversationList component
      // We'll pass the conversationId as a prop to auto-select
    }
  }, [searchParams, selectedConversation]);

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
          <div className="flex h-[calc(111vh-280px)] bg-white rounded-lg overflow-hidden mt-1">
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
              <ChatWindow conversation={selectedConversation} />
            </div>

            {/* Mobile Chat Overlay - Only on very small screens (xs) */}
            {selectedConversation && (
              <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                  <button
                    onClick={() => setSelectedConversation(null)}
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
                  <ChatWindow conversation={selectedConversation} />
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
