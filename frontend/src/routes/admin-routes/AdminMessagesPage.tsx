import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { Conversation } from "@/types/Post";
import AdminConversationList from "../../components/AdminConversationList";
import AdminChatWindow from "../../components/AdminChatWindow";
import PageWrapper from "../../components/PageWrapper";
import NavHeader from "../../components/NavHeadComp";

const AdminMessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isGoingBack, setIsGoingBack] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "unread" | "handover" | "claim"
  >("all");

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

  return (
    <PageWrapper title="Admin Messages">
      <div className="">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="hidden p-4 sm:px-6 lg:px-8 lg:flex items-center justify-between fixed left-20 top-18 right-0 z-10 bg-gray-50 border-b border-zinc-200">
            <div className="flex flex-row gap-3 items-center">
              <h1 className="text-base font-medium text-gray-900">
                Admin Messages
              </h1>
              <div className="bg-blue-100 text-blue-800 text-[10px] py-1 px-2 rounded-full">
                Admin View
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 mt-1">
                Monitor and manage all user conversations
              </p>
            </div>
          </div>

          {/* mobile nav */}
          <NavHeader
            title="Admin Messages"
            description="Monitor and manage all user conversations"
          />

          {/* Messages Layout */}
          <div className="flex h-[calc(100vh-115px)] sm:h-[calc(100vh-135px)] md:h-[calc(100vh-145px)] lg:h-[calc(100vh-155px)] xl:h-[calc(100vh-158px)] overflow-hidden lg:mt-30">
            {/* Desktop Layout */}
            <div className="hidden lg:flex w-full">
              {/* Conversations List - Desktop */}
              <div className="w-1/3 border-r border-gray-200 bg-white">
                <div className="p-7 border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800">
                    All Conversations
                  </h2>
                  <p className="text-sm text-gray-500">
                    Admin oversight of user communications
                  </p>

                  {/* Search and Filter Controls */}
                  <div className="mt-4 space-y-3">
                    {/* Search Input */}
                    <div>
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navyblue focus:border-transparent"
                      />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-row gap-1">
                      <button
                        onClick={() => setFilterType("all")}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          filterType === "all"
                            ? "bg-navyblue text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilterType("unread")}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          filterType === "unread"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Unread
                      </button>
                      <button
                        onClick={() => setFilterType("handover")}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          filterType === "handover"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Handover
                      </button>
                      <button
                        onClick={() => setFilterType("claim")}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          filterType === "claim"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <AdminConversationList
                    onSelectConversation={handleSelectConversation}
                    selectedConversationId={selectedConversation?.id}
                    searchQuery={searchQuery}
                    filterType={filterType}
                  />
                </div>
              </div>

              {/* Chat Window - Desktop */}
              <div className="flex-1 bg-white">
                {selectedConversation ? (
                  <AdminChatWindow
                    conversation={selectedConversation}
                    onClearConversation={() => {
                      setSelectedConversation(null);
                      setSearchParams({});
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No conversation selected
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Choose a conversation from the list to view messages
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden flex w-full">
              {!selectedConversation ? (
                /* Mobile Conversations List */
                <div className="w-full bg-white">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">
                      All Conversations
                    </h2>
                    <p className="text-sm text-gray-500">
                      Admin oversight of user communications
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <AdminConversationList
                      onSelectConversation={handleSelectConversation}
                      selectedConversationId={selectedConversation?.id}
                      searchQuery={searchQuery}
                      filterType={filterType}
                    />
                  </div>
                </div>
              ) : (
                /* Mobile Chat Overlay */
                <div className="fixed inset-0 z-50 bg-white flex flex-col">
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
                      Admin View - {selectedConversation.postTitle}
                    </h3>
                    <div className="w-10"></div> {/* Spacer for centering */}
                  </div>

                  {/* Mobile Chat */}
                  <div className="flex-1 overflow-hidden">
                    <AdminChatWindow
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
      </div>
    </PageWrapper>
  );
};

export default AdminMessagesPage;
