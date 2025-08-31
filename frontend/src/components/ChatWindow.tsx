import React, { useState, useEffect, useRef } from "react";
import { useMessage } from "../context/MessageContext";
import type { Conversation, Message } from "@/types/Post";
import MessageBubble from "./MessageBubble";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import ProfilePicture from "./ProfilePicture";
import { messageService } from "../utils/firebase";
import ClaimVerificationModal from "./ClaimVerificationModal";
import HandoverVerificationModal from "./HandoverVerificationModal";
import { cloudinaryService } from "../utils/cloudinary";
import { useNavigate } from "react-router-dom";
import NoChat from "../assets/no_chat.png";

interface ChatWindowProps {
  conversation: Conversation | null;
  onClearConversation?: () => void; // New prop to clear selected conversation
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onClearConversation,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [isHandoverSubmitting, setIsHandoverSubmitting] = useState(false);
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    sendMessage,
    getConversationMessages,
    markConversationAsRead,
    markMessageAsRead,
    sendClaimRequest,
    conversations,
  } = useMessage();
  const { userData } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isScrolledUp =
      target.scrollTop < target.scrollHeight - target.clientHeight - 100;
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
    const unsubscribe = getConversationMessages(
      conversation.id,
      (loadedMessages) => {
        setMessages(loadedMessages);
        setIsLoading(false);

        // Mark conversation as read when messages are loaded
        if (userData && conversation?.unreadCounts?.[userData.uid] > 0 && conversation?.id) {
          markConversationAsRead(conversation.id);
        }
      }
    );

    return () => unsubscribe();
  }, [conversation, getConversationMessages, markConversationAsRead, userData]);

  // Mark conversation as read when new messages arrive while user is viewing
  useEffect(() => {
    if (!conversation?.id || !userData?.uid || !messages.length) return;

    // Check if there are unread messages in this conversation
    if (conversation?.unreadCounts?.[userData.uid] > 0) {
      // Mark conversation as read since user is actively viewing it
      markConversationAsRead(conversation.id);
    }
  }, [messages, conversation, userData, markConversationAsRead]);

  // Check if conversation still exists (wasn't deleted)
  useEffect(() => {
    if (!conversation) return;

    // Immediate check using local conversations state
    const conversationStillExists = conversations.some(
      (conv) => conv.id === conversation.id
    );
    if (!conversationStillExists) {
      navigate("/messages"); // Redirect to messages page
      return;
    }
  }, [conversation, conversations, navigate]);

  // Function to mark message as read when it comes into view
  const handleMessageSeen = async (messageId: string) => {
    if (!conversation?.id || !userData?.uid) return;
    
    try {
      // Mark the individual message as read
      await markMessageAsRead(conversation.id, messageId);
      
      // Also mark the conversation as read if it has unread messages
      if (conversation?.unreadCounts?.[userData.uid] > 0) {
        await markConversationAsRead(conversation.id);
      }
    } catch (error) {
      console.warn('Failed to mark message/conversation as read:', error);
    }
  };

  // Additional check for conversation existence in database (less frequent)
  useEffect(() => {
    if (!conversation) return;

    const checkConversationExists = async () => {
      try {
        // Try to access the conversation to see if it still exists
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("../utils/firebase");

        const conversationRef = doc(db, "conversations", conversation.id);
        const conversationSnap = await getDoc(conversationRef);

        // If conversation doesn't exist, it was deleted
        if (!conversationSnap.exists()) {
          navigate("/messages"); // Redirect to messages page
        }
      } catch (error: any) {
        // If we get a permission error, the conversation was likely deleted
        if (
          error.message?.includes("permission") ||
          error.message?.includes("not-found")
        ) {
          navigate("/messages"); // Redirect to messages page
        }
      }
    };

    // Check every 10 seconds if the conversation still exists (reduced frequency)
    const interval = setInterval(checkConversationExists, 10000);

    return () => clearInterval(interval);
  }, [conversation, navigate]);

  // Update existing conversations with missing post data
  useEffect(() => {
    if (!conversation || !userData) return;

    // Check if conversation has the new fields, if not, update it
    if (
      !conversation.postType ||
      !conversation.postStatus ||
      !conversation.postCreatorId
    ) {
      messageService
        .updateConversationPostData(conversation.id)
        .catch((error) => {
          console.error("Failed to update conversation post data:", error);
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
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      // You could add a toast notification here
    } finally {
      setIsSending(false);
    }
  };

  const handleHandoverResponse = (
    _messageId: string,
    _status: "accepted" | "rejected"
  ) => {
    // This function will be called when a handover response is made
    // The actual update is handled in the MessageBubble component
  };

  const handleClaimResponse = (
    _messageId: string,
    _status: "accepted" | "rejected"
  ) => {
    // This function will be called when a claim response is made
    // The actual update is handled in the MessageBubble component
  };

  const handleOpenHandoverModal = () => {
    setShowHandoverModal(true);
  };

  const handleCloseHandoverModal = () => {
    setShowHandoverModal(false);
  };

  const handleSubmitHandover = async (
    handoverReason: string,
    idPhotoFile: File | null,
    itemPhotoFiles: File[]
  ) => {
    if (
      !conversation ||
      !userData ||
      !idPhotoFile ||
      itemPhotoFiles.length === 0
    ) {
      return;
    }

    setIsHandoverSubmitting(true);
    try {
      // Upload ID photo to Cloudinary with validation
      console.log("📤 Uploading ID photo...");
      const idPhotoUrl = await cloudinaryService.uploadImage(
        idPhotoFile,
        "id_photos"
      );

      // Validate the uploaded ID photo URL
      if (
        !idPhotoUrl ||
        typeof idPhotoUrl !== "string" ||
        !idPhotoUrl.includes("cloudinary.com")
      ) {
        console.error("❌ Invalid ID photo URL returned:", idPhotoUrl);
        throw new Error("Invalid ID photo URL returned from upload");
      }

      console.log(
        "✅ ID photo uploaded and validated successfully:",
        idPhotoUrl.split("/").pop()
      );

      // Upload all item photos to Cloudinary with validation
      console.log(
        "📤 Starting item photo uploads...",
        itemPhotoFiles.length,
        "files"
      );

      const itemPhotoUploadPromises = itemPhotoFiles.map(
        async (photoFile, index) => {
          try {
            console.log(
              `📤 Uploading item photo ${index + 1}:`,
              photoFile.name
            );
            const photoUrl = await cloudinaryService.uploadImage(
              photoFile,
              "item_photos"
            );

            // Validate the uploaded URL
            if (
              !photoUrl ||
              typeof photoUrl !== "string" ||
              !photoUrl.includes("cloudinary.com")
            ) {
              console.error(
                `❌ Invalid photo URL returned for item photo ${index + 1}:`,
                photoUrl
              );
              throw new Error(`Invalid photo URL for item photo ${index + 1}`);
            }

            const photoObject = {
              url: photoUrl,
              uploadedAt: new Date(),
              description: "Item photo",
            };

            console.log(
              `✅ Item photo ${index + 1} uploaded successfully:`,
              photoUrl.split("/").pop()
            );
            return photoObject;
          } catch (error: any) {
            console.error(
              `❌ Failed to upload item photo ${index + 1}:`,
              error.message
            );
            throw new Error(
              `Failed to upload item photo ${index + 1}: ${error.message}`
            );
          }
        }
      );

      const uploadedItemPhotos = await Promise.all(itemPhotoUploadPromises);

      // Validate the final array
      console.log("🔍 Validating uploaded item photos array...");
      uploadedItemPhotos.forEach((photo, index) => {
        if (
          !photo?.url ||
          typeof photo.url !== "string" ||
          !photo.url.includes("cloudinary.com")
        ) {
          console.error(
            `❌ Invalid photo object in uploadedItemPhotos[${index}]:`,
            photo
          );
          throw new Error(`Invalid photo object at index ${index}`);
        }
        console.log(
          `✅ Photo ${index + 1} validation passed:`,
          photo.url.split("/").pop()
        );
      });

      console.log(
        "🎉 All item photos uploaded and validated successfully:",
        uploadedItemPhotos.length,
        "photos"
      );

      // Final validation before sending to Firestore
      console.log("🔍 Final validation before sending handover request...");
      console.log("🔍 ID photo URL:", idPhotoUrl ? "valid" : "invalid");
      console.log("🔍 Item photos array:", uploadedItemPhotos.length, "photos");

      // Validate all data before sending
      if (
        !idPhotoUrl ||
        typeof idPhotoUrl !== "string" ||
        !idPhotoUrl.includes("cloudinary.com")
      ) {
        throw new Error(
          "ID photo URL is invalid before sending handover request"
        );
      }

      if (
        !Array.isArray(uploadedItemPhotos) ||
        uploadedItemPhotos.length === 0
      ) {
        throw new Error(
          "Item photos array is invalid before sending handover request"
        );
      }

      uploadedItemPhotos.forEach((photo, index) => {
        if (
          !photo?.url ||
          typeof photo.url !== "string" ||
          !photo.url.includes("cloudinary.com")
        ) {
          throw new Error(
            `Item photo ${index + 1} is invalid before sending handover request`
          );
        }
      });

      console.log("✅ All data validated, sending handover request...");

      // Now send the handover request with verification photos
      await messageService.sendHandoverRequest(
        conversation.id,
        userData.uid,
        `${userData.firstName} ${userData.lastName}`,
        userData.profilePicture || userData.profileImageUrl || "",
        conversation.postId,
        conversation.postTitle,
        handoverReason,
        idPhotoUrl,
        uploadedItemPhotos
      );

      // Close modal and show success message
      setShowHandoverModal(false);
      alert("Handover request sent successfully!");
    } catch (error) {
      console.error("Failed to send handover request:", error);
      alert("Failed to send handover request. Please try again.");
    } finally {
      setIsHandoverSubmitting(false);
    }
  };

  const handleOpenClaimModal = () => {
    setShowClaimModal(true);
  };

  const handleCloseClaimModal = () => {
    setShowClaimModal(false);
  };

  const handleSubmitClaim = async (
    claimReason: string,
    idPhotoFile: File | null,
    evidencePhotos: File[]
  ) => {
    if (
      !conversation ||
      !userData ||
      !idPhotoFile ||
      !evidencePhotos ||
      evidencePhotos.length === 0
    ) {
      return;
    }

    setIsClaimSubmitting(true);
    try {
      // Upload ID photo to Cloudinary with validation
      console.log("📤 Uploading claim ID photo...");
      const idPhotoUrl = await cloudinaryService.uploadImage(
        idPhotoFile,
        "id_photos"
      );

      // Validate the uploaded ID photo URL
      if (
        !idPhotoUrl ||
        typeof idPhotoUrl !== "string" ||
        !idPhotoUrl.includes("cloudinary.com")
      ) {
        console.error("❌ Invalid claim ID photo URL returned:", idPhotoUrl);
        throw new Error("Invalid claim ID photo URL returned from upload");
      }

      console.log(
        "✅ Claim ID photo uploaded and validated successfully:",
        idPhotoUrl.split("/").pop()
      );

      // Upload all evidence photos to Cloudinary with validation
      console.log(
        "📤 Starting evidence photo uploads...",
        evidencePhotos.length,
        "files"
      );

      const photoUploadPromises = evidencePhotos.map(
        async (photoFile, index) => {
          try {
            console.log(
              `📤 Uploading evidence photo ${index + 1}:`,
              photoFile.name
            );
            const photoUrl = await cloudinaryService.uploadImage(
              photoFile,
              "evidence_photos"
            );

            // Validate the uploaded URL
            if (
              !photoUrl ||
              typeof photoUrl !== "string" ||
              !photoUrl.includes("cloudinary.com")
            ) {
              console.error(
                `❌ Invalid photo URL returned for evidence photo ${
                  index + 1
                }:`,
                photoUrl
              );
              throw new Error(
                `Invalid photo URL for evidence photo ${index + 1}`
              );
            }

            const photoObject = {
              url: photoUrl,
              uploadedAt: new Date(),
              description: "Evidence photo",
            };

            console.log(
              `✅ Evidence photo ${index + 1} uploaded successfully:`,
              photoUrl.split("/").pop()
            );
            return photoObject;
          } catch (error: any) {
            console.error(
              `❌ Failed to upload evidence photo ${index + 1}:`,
              error.message
            );
            throw new Error(
              `Failed to upload evidence photo ${index + 1}: ${error.message}`
            );
          }
        }
      );

      const uploadedEvidencePhotos = await Promise.all(photoUploadPromises);

      // Validate the final array
      console.log("🔍 Validating uploaded evidence photos array...");
      uploadedEvidencePhotos.forEach((photo, index) => {
        if (
          !photo?.url ||
          typeof photo.url !== "string" ||
          !photo.url.includes("cloudinary.com")
        ) {
          console.error(
            `❌ Invalid photo object in uploadedEvidencePhotos[${index}]:`,
            photo
          );
          throw new Error(`Invalid photo object at index ${index}`);
        }
        console.log(
          `✅ Evidence photo ${index + 1} validation passed:`,
          photo.url.split("/").pop()
        );
      });

      console.log(
        "🎉 All evidence photos uploaded and validated successfully:",
        uploadedEvidencePhotos.length,
        "photos"
      );
      console.log("📝 Claim reason provided:", claimReason);

      // Final validation before sending to Firestore
      console.log("🔍 Final validation before sending claim request...");
      console.log("🔍 ID photo URL:", idPhotoUrl ? "valid" : "invalid");
      console.log(
        "🔍 Evidence photos array:",
        uploadedEvidencePhotos.length,
        "photos"
      );

      // Validate all data before sending
      if (
        !idPhotoUrl ||
        typeof idPhotoUrl !== "string" ||
        !idPhotoUrl.includes("cloudinary.com")
      ) {
        throw new Error("ID photo URL is invalid before sending claim request");
      }

      if (
        !Array.isArray(uploadedEvidencePhotos) ||
        uploadedEvidencePhotos.length === 0
      ) {
        throw new Error(
          "Evidence photos array is invalid before sending claim request"
        );
      }

      uploadedEvidencePhotos.forEach((photo, index) => {
        if (
          !photo?.url ||
          typeof photo.url !== "string" ||
          !photo.url.includes("cloudinary.com")
        ) {
          throw new Error(
            `Evidence photo ${
              index + 1
            } is invalid before sending claim request`
          );
        }
      });

      console.log("✅ All claim data validated, sending claim request...");

      // Now send the claim request with both ID photo and evidence photos
      await sendClaimRequest(
        conversation.id,
        userData.uid,
        `${userData.firstName} ${userData.lastName}`,
        userData.profilePicture || userData.profileImageUrl || "",
        conversation.postId,
        conversation.postTitle,
        claimReason,
        idPhotoUrl,
        uploadedEvidencePhotos
      );

      // Close modal and show success message
      setShowClaimModal(false);
      alert("Claim request sent successfully!");
    } catch (error) {
      console.error("Failed to send claim request:", error);
      alert("Failed to send claim request. Please try again.");
    } finally {
      setIsClaimSubmitting(false);
    }
  };

  const getOtherParticipantName = (conversation: Conversation) => {
    if (!userData) return "Unknown User";

    const otherParticipants = Object.entries(conversation.participants)
      .filter(([uid]) => uid !== userData.uid) // Exclude current user
      .map(([, participant]) =>
        `${participant.firstName} ${participant.lastName}`.trim()
      )
      .filter((name) => name.length > 0);

    return otherParticipants.length > 0
      ? otherParticipants.join(", ")
      : "Unknown User";
  };

  const getOtherParticipantProfilePicture = (conversation: Conversation) => {
    if (!userData) return null;

    const otherParticipant = Object.entries(conversation.participants).find(
      ([uid]) => uid !== userData.uid
    );

    return otherParticipant
      ? otherParticipant[1].profilePicture ||
          otherParticipant[1].profileImageUrl
      : null;
  };

  // Check if handover button should be shown
  const shouldShowHandoverButton = () => {
    if (!conversation || !userData) return false;

    // Only show for lost items
    if (conversation.postType !== "lost") return false;

    // Only show if post is still pending
    if (conversation.postStatus !== "pending") return false;

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
    if (conversation.postType !== "found") {
      return false;
    }

    // Only show if post is still pending
    if (conversation.postStatus !== "pending") {
      return false;
    }

    // Only show if found action is "keep" (Found and Keep posts)
    if (conversation.foundAction !== "keep") {
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
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center text-center text-gray-500">
          <img src={NoChat} alt="no_message" className="size-60" />
          <p className="text-lg font-medium mb-3">Select a conversation</p>
          <p className="text-sm">
            Choose a conversation from the list to start chatting
          </p>
        </div>
      </div>
    );
  }

  const handleConfirmIdPhotoSuccess = (messageId: string): void => {
    // The onClearConversation is already being called in MessageBubble
    // This function is just for any additional cleanup if needed
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {conversation.postTitle}
              </h3>
              {/* Post Type Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                  conversation.postType === "found"
                    ? "bg-green-300 text-green-800"
                    : "bg-orange-300 text-orange-800"
                }`}
              >
                {conversation.postType === "found" ? "FOUND" : "LOST"}
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
              onClick={handleOpenHandoverModal}
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
        className="overflow-y-auto p-4 bg-white scroll-smooth hover:scrollbar-thin hover:scrollbar-thumb-gray-300 hover:scrollbar-track-gray-100 relative"
        style={{
          scrollBehavior: "smooth",
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
                 showSenderName={
                   Object.keys(conversation.participants).length > 2
                 }
                 conversationId={conversation.id}
                 currentUserId={userData?.uid || ""}
                 postOwnerId={conversation.postCreatorId}
                 onHandoverResponse={handleHandoverResponse}
                 onClaimResponse={handleClaimResponse}
                 onConfirmIdPhotoSuccess={handleConfirmIdPhotoSuccess}
                 onClearConversation={onClearConversation}
                 onMessageSeen={() => handleMessageSeen(message.id)}
               />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-2 bg-white border border-zinc-300 text-white rounded-full shadow-lg hover:bg-zinc-200 transition-colors duration-200 z-10"
            title="Scroll to bottom"
          >
            <svg
              className="size-4"
              fill="none"
              stroke="#000000"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Message Input - Sticky at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white mt-auto">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              maxLength={200}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-navyblue focus:border-transparent ${
                newMessage.length > 180 
                  ? newMessage.length >= 200 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-yellow-300 focus:ring-yellow-500'
                  : 'border-gray-300'
              }`}
              disabled={isSending}
            />
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {newMessage.length}/200
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || newMessage.length > 200}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>

      {/* Claim Verification Modal */}
      <ClaimVerificationModal
        isOpen={showClaimModal}
        onClose={handleCloseClaimModal}
        onSubmit={handleSubmitClaim}
        itemTitle={conversation?.postTitle || ""}
        isLoading={isClaimSubmitting}
        onSuccess={() => {
          // This will be called after successful form submission
          // The form is already cleared by the modal component
          console.log("Claim form submitted and cleared successfully");
        }}
      />

      {/* Handover Verification Modal */}
      <HandoverVerificationModal
        isOpen={showHandoverModal}
        onClose={handleCloseHandoverModal}
        onSubmit={handleSubmitHandover}
        itemTitle={conversation?.postTitle || ""}
        isLoading={isHandoverSubmitting}
        onSuccess={() => {
          // This will be called after successful form submission
          // The form is already cleared by the modal component
          console.log("Handover form submitted and cleared successfully");
        }}
      />
    </div>
  );
};

export default ChatWindow;
