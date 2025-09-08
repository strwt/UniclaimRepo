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
      <div className="">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="hidden px-4 py-3 sm:px-6 lg:px-8 lg:flex items-center justify-between fixed left-20 top-18 right-0 z-10 bg-gray-50 border-b border-zinc-200">
            <div className="">
              <h1 className="text-base font-medium text-gray-900">Messages</h1>
            </div>
            <div className="">
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
          <div className="flex h-[calc(100vh-115px)] sm:h-[calc(100vh-135px)] md:h-[calc(100vh-145px)] lg:h-[calc(100vh-155px)] xl:h-[calc(100vh-158px)] overflow-hidden lg:mt-30">
            {/* Conversation List - Left Side */}
            <div className="w-full lg:max-w-sm border-r border-gray-200 flex flex-col">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
              />
            </div>

            {/* Chat Window - Right Side - Visible on sm and up, hidden only on xs */}
            <div className="flex-1 hidden lg:flex flex-col">
              <ChatWindow 
                conversation={selectedConversation} 
                onClearConversation={() => {
                  setSelectedConversation(null);
                  setSearchParams({});
                }}
              />
            </div>

            {/* Mobile Chat Overlay - Only on very small screens (xs) */}
            {selectedConversation && (
              <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
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
                    onClearConversation={() => {
                      setSelectedConversation(null);
                      setSearchParams({});
                    }}
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
