import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  SafeAreaView,
  Text,
  FlatList,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Linking,
  ScrollView
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useMessage } from "@/context/MessageContext";
import { useAuth } from "@/context/AuthContext";
import type { Message, RootStackParamList } from "@/types/type";
import ImagePicker from "@/components/ImagePicker";

type ChatRouteProp = RouteProp<RootStackParamList, "Chat">;
type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList, "Chat">;

const MessageBubble = ({
  message,
  isOwnMessage,
  conversationId,
  currentUserId,
  isCurrentUserPostOwner,
  onHandoverResponse,
  onClaimResponse,
  onConfirmIdPhotoSuccess,
  onMessageSeen,
  onImageClick,
}: {
  message: Message;
  isOwnMessage: boolean;
  conversationId: string;
  currentUserId: string;
  isCurrentUserPostOwner?: boolean;
  onHandoverResponse?: (
    messageId: string,
    status: "accepted" | "rejected"
  ) => void;
  onClaimResponse?: (
    messageId: string,
    status: "accepted" | "rejected"
  ) => void;
  onConfirmIdPhotoSuccess?: (messageId: string) => void;
  onMessageSeen?: () => void;
  onImageClick?: (imageUrl: string, altText: string) => void;
}) => {
  const {
    deleteMessage,
    confirmHandoverIdPhoto,
    confirmClaimIdPhoto,
    updateClaimResponse,
  } = useMessage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showIdPhotoModal, setShowIdPhotoModal] = useState(false);
  const [isUploadingIdPhoto, setIsUploadingIdPhoto] = useState(false);
  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // For mobile, visibility detection is handled by FlatList's onViewableItemsChanged
  // This component just provides the callback interface

  const handleHandoverResponse = async (status: "accepted" | "rejected") => {
    if (!onHandoverResponse) return;

    if (status === "accepted") {
      setShowIdPhotoModal(true);
      return;
    }

    try {
      const { messageService } = await import("@/utils/firebase");
      await messageService.updateHandoverResponse(
        conversationId,
        message.id,
        status,
        currentUserId
      );
      onHandoverResponse(message.id, status);
    } catch (error) {
      console.error("Failed to update handover response:", error);
    }
  };

  const handleIdPhotoUpload = async (photoUri: string) => {
    try {
      setIsUploadingIdPhoto(true);

      // Upload ID photo to Cloudinary
      const { cloudinaryService } = await import("@/utils/cloudinary");
      const uploadedUrl = await cloudinaryService.uploadImage(
        photoUri,
        "id_photos"
      );

      // Update handover response with ID photo
      const { messageService } = await import("@/utils/firebase");
      await messageService.updateHandoverResponse(
        conversationId,
        message.id,
        "accepted",
        currentUserId,
        uploadedUrl
      );

      onHandoverResponse?.(message.id, "accepted");
      setShowIdPhotoModal(false);

      Alert.alert(
        "Success",
        "ID photo uploaded successfully! The item owner will now review and confirm."
      );
    } catch (error: any) {
      console.error("Failed to upload ID photo:", error);
      Alert.alert("Upload Error", "Failed to upload ID photo. Please try again.");
    } finally {
      setIsUploadingIdPhoto(false);
    }
  };

  const handleConfirmIdPhoto = async () => {
    try {
      await confirmHandoverIdPhoto(conversationId, message.id);
    } catch (error: any) {
      console.error("Failed to confirm ID photo:", error);
      Alert.alert("Error", "Failed to confirm ID photo. Please try again.");
    }
  };

  const handleClaimResponse = async (status: "accepted" | "rejected") => {
    if (!onClaimResponse) return;

    if (status === "accepted") {
      setShowIdPhotoModal(true);
      return;
    }

    try {
      await updateClaimResponse(conversationId, message.id, status);
      onClaimResponse(message.id, status);
    } catch (error) {
      console.error("Failed to update claim response:", error);
      Alert.alert("Error", "Failed to update claim response. Please try again.");
    }
  };

  const handleClaimIdPhotoUpload = async (photoUri: string) => {
    try {
      setIsUploadingIdPhoto(true);

      // Upload ID photo to Cloudinary
      const { cloudinaryService } = await import("@/utils/cloudinary");
      const uploadedUrl = await cloudinaryService.uploadImage(
        photoUri,
        "id_photos"
      );

      // Update claim response with ID photo
      const { messageService } = await import("@/utils/firebase");
      await messageService.updateClaimResponse(
        conversationId,
        message.id,
        "accepted",
        currentUserId,
        uploadedUrl
      );

      onClaimResponse?.(message.id, "accepted");
      setShowIdPhotoModal(false);

      Alert.alert(
        "Success",
        "ID photo uploaded successfully! The post owner will now review and confirm your claim."
      );
    } catch (error: any) {
      console.error("Failed to upload claim ID photo:", error);
      Alert.alert("Upload Error", "Failed to upload ID photo. Please try again.");
    } finally {
      setIsUploadingIdPhoto(false);
    }
  };

  const handleConfirmClaimIdPhoto = async () => {
    try {
      await confirmClaimIdPhoto(conversationId, message.id);
      // Call the callback to update UI
      onClaimResponse?.(message.id, "accepted");

      // Call the success callback for navigation
      onConfirmIdPhotoSuccess?.(message.id);
    } catch (error: any) {
      console.error("Failed to confirm claim ID photo:", error);
      Alert.alert("Error", "Failed to confirm ID photo. Please try again.");
    }
  };

  const handleDeleteMessage = async () => {
    if (!isOwnMessage) return;

    Alert.alert(
      "Delete Message",
      "This action cannot be undone. Are you sure you want to delete this message?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteMessage(conversationId, message.id);
            } catch (error: any) {
              Alert.alert(
                "Error",
                `Failed to delete message: ${error.message}`
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderHandoverRequest = () => {
    if (message.messageType !== "handover_request") return null;

    const handoverData = message.handoverData;
    if (!handoverData) return null;

    const canRespond = handoverData.status === "pending" && !isOwnMessage;
    const canConfirm = handoverData.status === "pending_confirmation" && !!isCurrentUserPostOwner;
    const isCompleted = handoverData.status === "accepted" || handoverData.status === "rejected";

    return (
      <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Text className="text-sm text-blue-800 mb-2">
          <Text className="font-bold">Handover Request:</Text>{" "}
          {handoverData.postTitle}
        </Text>

        {/* Show ID photo if uploaded */}
        {handoverData.idPhotoUrl && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">Finder ID Photo:</Text>
            <TouchableOpacity
              onPress={() => {
                if (handoverData.idPhotoUrl && onImageClick) {
                  // Use image modal like web version
                  onImageClick(handoverData.idPhotoUrl, "Finder ID Photo");
                }
              }}
            >
              <Image
                source={{ uri: handoverData.idPhotoUrl }}
                className="w-24 h-16 rounded"
                resizeMode="cover"
              />
              <Text className="text-xs text-blue-500 text-center mt-1">
                Tap to view full size
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show owner's ID photo if uploaded */}
        {handoverData.ownerIdPhoto && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">Owner ID Photo:</Text>
            <TouchableOpacity
              onPress={() => {
                if (handoverData.ownerIdPhoto && onImageClick) {
                  // Use image modal like web version
                  onImageClick(handoverData.ownerIdPhoto, "Owner ID Photo");
                }
              }}
            >
              <Image
                source={{ uri: handoverData.ownerIdPhoto }}
                className="w-24 h-16 rounded"
                resizeMode="cover"
              />
              <Text className="text-xs text-blue-500 text-center mt-1">
                Tap to view full size
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show item photos if uploaded */}
        {handoverData.itemPhotos && handoverData.itemPhotos.length > 0 && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1 font-medium">
              Item Photos:
            </Text>
            <View className="gap-2">
              {handoverData.itemPhotos.map((photo, index) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      if (onImageClick) {
                        // Use image modal like web version
                        onImageClick(photo.url, `Item Photo ${index + 1}`);
                      }
                    }}
                  >
                    <Image
                      source={{ uri: photo.url }}
                      className="w-full h-32 rounded"
                      resizeMode="cover"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Item photo {index + 1}
                    </Text>
                    <Text className="text-xs text-blue-500 text-center mt-1">
                      Tap to view full size
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action buttons */}
        {canRespond ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleHandoverResponse("accepted")}
              className="px-3 py-1 bg-green-500 rounded-md"
            >
              <Text className="text-white text-xs">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleHandoverResponse("rejected")}
              className="px-3 py-1 bg-red-500 rounded-md"
            >
              <Text className="text-white text-xs">Reject</Text>
            </TouchableOpacity>
          </View>
        ) : canConfirm ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleConfirmIdPhoto}
              className="px-3 py-1 bg-blue-500 rounded-md"
            >
              <Text className="text-white text-xs">Confirm ID Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleHandoverResponse("rejected")}
              className="px-3 py-1 bg-red-500 rounded-md"
            >
              <Text className="text-white text-xs">Reject Handover</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-xs text-blue-600">
            Status:{" "}
            <Text className="capitalize font-medium">
              {handoverData.status}
            </Text>
            {isCompleted && handoverData.respondedAt && (
              <Text className="ml-2">
                at {formatTime(handoverData.respondedAt)}
              </Text>
            )}
            {handoverData.status === "accepted" &&
              handoverData.idPhotoConfirmed && (
                <Text className="ml-2 text-green-600">
                  ✓ ID Photo Confirmed
                </Text>
              )}
            {handoverData.status === "accepted" &&
              handoverData.itemPhotosConfirmed && (
                <Text className="ml-2 text-green-600">
                  ✓ Item Photos Confirmed
                </Text>
              )}
          </Text>
        )}
      </View>
    );
  };

  const renderHandoverResponse = () => {
    if (message.messageType !== "handover_response") return null;

    const handoverData = message.handoverData;
    if (!handoverData) return null;

    const statusColor =
      handoverData.status === "accepted" ? "text-green-600" : "text-red-600";
    const statusIcon = handoverData.status === "accepted" ? "✅" : "❌";

    return (
      <View className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <View className={`flex-row items-center gap-2`}>
          <Text>{statusIcon}</Text>
          <Text className={`text-sm ${statusColor} capitalize font-medium`}>
            {handoverData.status}
          </Text>
          {handoverData.responseMessage && (
            <Text className="text-gray-600 text-sm">
              - {handoverData.responseMessage}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderClaimRequest = () => {
    if (message.messageType !== "claim_request") return null;

    const claimData = message.claimData;
    if (!claimData) return null;

    const canRespond = claimData.status === "pending" && !isOwnMessage;
    const canConfirm = claimData.status === "pending_confirmation" && !!isCurrentUserPostOwner;
    const isCompleted = claimData.status === "accepted" || claimData.status === "rejected";

    return (
      <View className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <Text className="text-sm text-purple-800 mb-2">
          <Text className="font-bold">Claim Request:</Text>{" "}
          {claimData.postTitle}
        </Text>

        {/* Show claim reason if provided */}
        {claimData.claimReason && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1 font-medium">
              Claim Reason:
            </Text>
            <Text className="text-sm text-gray-800">
              {claimData.claimReason}
            </Text>
          </View>
        )}

        {/* Show claimer's ID photo if uploaded */}
        {claimData.idPhotoUrl && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">
              Claimer ID Photo:
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (claimData.idPhotoUrl) {
                  // For mobile, we'll use a simple alert with option to view
                  Alert.alert(
                    "View Claimer ID Photo",
                    "Would you like to view the full-size claimer ID photo?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "View Full Size",
                        onPress: () => {
                          // Open in device's default image viewer
                          if (claimData.idPhotoUrl) {
                            Linking.openURL(claimData.idPhotoUrl);
                          }
                        },
                      },
                    ]
                  );
                }
              }}
            >
              <Image
                source={{ uri: claimData.idPhotoUrl }}
                className="w-24 h-16 rounded"
                resizeMode="cover"
              />
              <Text className="text-xs text-blue-500 text-center mt-1">
                Tap to view full size
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show owner's ID photo if uploaded */}
        {claimData.ownerIdPhoto && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">Owner ID Photo:</Text>
            <TouchableOpacity
              onPress={() => {
                if (claimData.ownerIdPhoto) {
                  // For mobile, we'll use a simple alert with option to view
                  Alert.alert(
                    "View Owner ID Photo",
                    "Would you like to view the full-size owner ID photo?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "View Full Size",
                        onPress: () => {
                          // Open in device's default image viewer
                          if (claimData.ownerIdPhoto) {
                            Linking.openURL(claimData.ownerIdPhoto);
                          }
                        },
                      },
                    ]
                  );
                }
              }}
            >
              <Image
                source={{ uri: claimData.ownerIdPhoto }}
                className="w-24 h-16 rounded"
                resizeMode="cover"
              />
              <Text className="text-xs text-blue-500 text-center mt-1">
                Tap to view full size
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show evidence photos if uploaded */}
        {claimData.evidencePhotos && claimData.evidencePhotos.length > 0 && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1 font-medium">
              Evidence Photos:
            </Text>
            <View className="gap-2">
              {claimData.evidencePhotos.map((photo, index) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        `View Evidence Photo ${index + 1}`,
                        "Would you like to view the full-size evidence photo?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "View Full Size",
                            onPress: () => {
                              Linking.openURL(photo.url);
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Image
                      source={{ uri: photo.url }}
                      className="w-full h-32 rounded"
                      resizeMode="cover"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Evidence photo {index + 1}
                    </Text>
                    <Text className="text-xs text-blue-500 text-center mt-1">
                      Tap to view full size
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Show legacy verification photos if exists (for backward compatibility) */}
        {claimData.verificationPhotos &&
          claimData.verificationPhotos.length > 0 &&
          !claimData.evidencePhotos && (
            <View className="mb-3 p-2 bg-white rounded border">
              <Text className="text-xs text-gray-600 mb-1 font-medium">
                Verification Photos:
              </Text>
              <View className="gap-2">
                {claimData.verificationPhotos.map((photo, index) => (
                  <View key={index}>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          `View Verification Photo ${index + 1}`,
                          "Would you like to view the full-size verification photo?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "View Full Size",
                              onPress: () => {
                                Linking.openURL(photo.url);
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        className="w-full h-32 rounded"
                        resizeMode="cover"
                      />
                      <Text className="text-xs text-gray-500 mt-1">
                        Verification photo {index + 1}
                      </Text>
                      <Text className="text-xs text-blue-500 text-center mt-1">
                        Tap to view full size
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* Action buttons */}
        {canRespond ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleClaimResponse("accepted")}
              className="px-3 py-1 bg-green-500 rounded-md"
            >
              <Text className="text-white text-xs">Accept Claim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleClaimResponse("rejected")}
              className="px-3 py-1 bg-red-500 rounded-md"
            >
              <Text className="text-white text-xs">Reject Claim</Text>
            </TouchableOpacity>
          </View>
        ) : canConfirm ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleConfirmClaimIdPhoto}
              className="px-3 py-1 bg-blue-500 rounded-md"
            >
              <Text className="text-white text-xs">Confirm ID Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleClaimResponse("rejected")}
              className="px-3 py-1 bg-red-500 rounded-md"
            >
              <Text className="text-white text-xs">Reject Claim</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-xs text-purple-600">
            Status:{" "}
            <Text className="capitalize font-medium">{claimData.status}</Text>
            {isCompleted && claimData.respondedAt && (
              <Text className="ml-2">
                at {formatTime(claimData.respondedAt)}
              </Text>
            )}
            {claimData.status === "accepted" && claimData.idPhotoConfirmed && (
              <Text className="ml-2 text-green-600">✓ ID Photo Confirmed</Text>
            )}
            {claimData.status === "accepted" &&
              claimData.evidencePhotosConfirmed && (
                <Text className="ml-2 text-green-600">
                  ✓ Evidence Photos Confirmed
                </Text>
              )}
            {claimData.status === "accepted" &&
              claimData.idPhotoConfirmed &&
              !claimData.evidencePhotosConfirmed && (
                <Text className="ml-2 text-green-600">
                  ✓ ID Photo Confirmed
                </Text>
              )}
            {claimData.status === "accepted" &&
              claimData.photosConfirmed &&
              !claimData.evidencePhotosConfirmed && (
                <Text className="ml-2 text-green-600">
                  ✓ Verification Photos Confirmed
                </Text>
              )}
          </Text>
        )}
      </View>
    );
  };

  const renderClaimResponse = () => {
    if (message.messageType !== "claim_response") return null;

    const claimData = message.claimData;
    if (!claimData) return null;

    const statusColor =
      claimData.status === "accepted" ? "text-green-600" : "text-red-600";
    const statusIcon = claimData.status === "accepted" ? "✅" : "❌";

    return (
      <View className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <View className={`flex-row items-center gap-2`}>
          <Text>{statusIcon}</Text>
          <Text className={`text-sm ${statusColor} capitalize font-medium`}>
            Claim {claimData.status}
          </Text>
          {claimData.responseMessage && (
            <Text className="text-gray-600 text-sm">
              - {claimData.responseMessage}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderSystemMessage = () => {
    if (message.messageType !== "system") return null;

    return (
      <View className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
        <Text className="text-sm text-yellow-800">
          <Text className="font-medium">System:</Text> {message.text}
        </Text>
      </View>
    );
  };

  // ID Photo Modal using ImagePicker component
  const renderIdPhotoModal = () => {
    if (!showIdPhotoModal) return null;

    const uploadHandler =
      message.messageType === "claim_request"
        ? handleClaimIdPhotoUpload
        : handleIdPhotoUpload;

    return (
      <ImagePicker
        onImageSelect={uploadHandler}
        onClose={() => setShowIdPhotoModal(false)}
        isUploading={isUploadingIdPhoto}
      />
    );
  };

  return (
    <View className={`mb-3 ${isOwnMessage ? "items-end" : "items-start"}`}>
      {renderIdPhotoModal()}
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isOwnMessage
            ? "bg-blue-500 rounded-br-md"
            : "bg-gray-200 rounded-bl-md"
        }`}
      >
        <Text
          className={`text-base ${
            isOwnMessage ? "text-white" : "text-gray-800"
          }`}
        >
          {message.text}
        </Text>

        {/* Render special message types */}
        {renderHandoverRequest()}
        {renderHandoverResponse()}
        {renderClaimRequest()}
        {renderClaimResponse()}
        {renderSystemMessage()}
      </View>
      <View className="flex-row items-center justify-between mt-1 mx-2">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </Text>
          {isOwnMessage && (
            <View>
              {message.readBy && message.readBy.length > 1 ? (
                <Ionicons name="eye" size={12} color="#3b82f6" />
              ) : (
                <Ionicons name="checkmark" size={12} color="#9ca3af" />
              )}
            </View>
          )}
        </View>

        {/* Delete button for own messages */}
        {isOwnMessage && (
          <TouchableOpacity
            onPress={handleDeleteMessage}
            disabled={isDeleting}
            className="ml-2 p-1"
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={isDeleting ? "#9ca3af" : "#ef4444"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function Chat() {
  const navigation = useNavigation<ChatNavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const {
    conversationId: initialConversationId,
    postTitle,
    postId,
    postOwnerId,
    postOwnerUserData,
  } = route.params;

  const {
    sendMessage,
    createConversation,
    getConversationMessages,
    getOlderMessages,
    getConversation,
    markConversationAsRead,
    markMessageAsRead,
    markAllUnreadMessagesAsRead,
    getConversationUnreadCount,
  } = useMessage();
  const { user, userData } = useAuth();

  // ENHANCED DEBUGGING - Step 1: Add comprehensive logging
  console.log('=== CHAT DEBUG START ===');
  console.log('Route params:', {
    initialConversationId,
    postTitle,
    postId,
    postOwnerId,
    hasPostOwnerUserData: !!postOwnerUserData,
    postOwnerUserDataKeys: postOwnerUserData ? Object.keys(postOwnerUserData) : []
  });
  console.log('User state:', {
    hasUser: !!user,
    hasUserData: !!userData,
    userId: user?.uid,
    userDataKeys: userData ? Object.keys(userData) : []
  });
  console.log('Message context functions:', {
    hasCreateConversation: !!createConversation,
    hasGetConversationMessages: !!getConversationMessages,
    hasGetConversation: !!getConversation
  });
  console.log('=== CHAT DEBUG END ===');

  // Debug logging for navigation parameters
  console.log('Chat - Navigation Parameters:', {
    initialConversationId,
    postTitle,
    postId,
    postOwnerId,
    postOwnerUserData: postOwnerUserData ? 'Present' : 'Missing',
    hasUser: !!user,
    hasUserData: !!userData,
  });

  // Comprehensive data validation and sanitization utilities
  const validationUtils = {
    // Validate Firebase document ID format
    isValidFirebaseId: (id: string): boolean => {
      if (!id || typeof id !== 'string') return false;
      // Firebase IDs can be 1-1500 characters and contain alphanumeric, hyphens, underscores
      // Real Firebase IDs often include timestamps and descriptive prefixes
      return /^[a-zA-Z0-9_-]{1,1500}$/.test(id);
    },

    // Validate user ID format
    isValidUserId: (id: string): boolean => {
      if (!id || typeof id !== 'string') return false;
      // Firebase Auth UIDs can vary in length, typically 20-28 characters
      // Allow alphanumeric characters with reasonable length constraints
      return /^[a-zA-Z0-9]{20,30}$/.test(id);
    },

    // Sanitize text input
    sanitizeText: (text: string): string => {
      if (!text || typeof text !== 'string') return '';
      // Remove potentially dangerous characters and trim whitespace
      return text
        .trim()
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .replace(/\s+/g, ' ') // Normalize whitespace
        .substring(0, 200); // Limit length
    },

    // Validate message content
    isValidMessage: (text: string): { isValid: boolean; error?: string } => {
      if (!text || typeof text !== 'string') {
        return { isValid: false, error: 'Message cannot be empty' };
      }
      
      const sanitized = validationUtils.sanitizeText(text);
      if (sanitized.length === 0) {
        return { isValid: false, error: 'Message contains only invalid characters' };
      }
      
      if (sanitized.length > 200) {
        return { isValid: false, error: 'Message is too long (max 200 characters)' };
      }
      
      return { isValid: true };
    },

    // Validate conversation parameters
    validateConversationParams: (params: {
      postId: string;
      postTitle: string;
      postOwnerId: string;
      currentUserId: string;
    }): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!validationUtils.isValidFirebaseId(params.postId)) {
        errors.push('Invalid post ID format');
      }
      
      if (!params.postTitle || params.postTitle.trim().length === 0) {
        errors.push('Post title is required');
      }
      
      if (!validationUtils.isValidUserId(params.postOwnerId)) {
        errors.push('Invalid post owner ID format');
      }
      
      if (!validationUtils.isValidUserId(params.currentUserId)) {
        errors.push('Invalid current user ID format');
      }
      
      // Note: Self-conversation check is now handled at the component level
      // to provide better user experience and prevent this validation error
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },

    // Sanitize user data
    sanitizeUserData: (userData: any): any => {
      if (!userData || typeof userData !== 'object') return null;
      
      return {
        uid: validationUtils.isValidUserId(userData.uid) ? userData.uid : null,
        firstName: validationUtils.sanitizeText(userData.firstName || ''),
        lastName: validationUtils.sanitizeText(userData.lastName || ''),
        email: userData.email && typeof userData.email === 'string' ? userData.email.toLowerCase().trim() : null,
        profilePicture: userData.profilePicture && typeof userData.profilePicture === 'string' ? userData.profilePicture : null
      };
    },

    // Validate message object
    validateMessage: (message: any): { isValid: boolean; error?: string } => {
      if (!message || typeof message !== 'object') {
        return { isValid: false, error: 'Invalid message object' };
      }
      
      if (!validationUtils.isValidFirebaseId(message.id)) {
        return { isValid: false, error: 'Invalid message ID' };
      }
      
      if (!validationUtils.isValidUserId(message.senderId)) {
        return { isValid: false, error: 'Invalid sender ID' };
      }
      
      const messageValidation = validationUtils.isValidMessage(message.text);
      if (!messageValidation.isValid) {
        return messageValidation;
      }
      
      if (!message.timestamp) {
        return { isValid: false, error: 'Message timestamp is required' };
      }
      
      return { isValid: true };
    }
  };
  
  // Enhanced parameter debugging with actual values (after validationUtils is declared)
  console.log('🔍 Parameter Debug Details:', {
    postTitle: {
      value: postTitle,
      type: typeof postTitle,
      length: postTitle?.length || 0,
      trimmed: postTitle?.trim().length || 0
    },
    postId: {
      value: postId,
      type: typeof postId,
      length: postId?.length || 0,
      isValidFormat: postId ? validationUtils.isValidFirebaseId(postId) : false
    },
    postOwnerId: {
      value: postOwnerId,
      type: typeof postOwnerId,
      length: postOwnerId?.length || 0,
      isValidFormat: postOwnerId ? validationUtils.isValidUserId(postOwnerId) : false
    },
    currentUserId: {
      value: user?.uid,
      type: typeof user?.uid,
      length: user?.uid?.length || 0,
      isValidFormat: user?.uid ? validationUtils.isValidUserId(user.uid) : false
    }
  });

  // Note: React Native Reanimated warnings about reading 'value' during render
  // are likely coming from navigation dependencies or other components.
  // These performance optimizations should help reduce render issues.

  // Enhanced navigation parameter validation with detailed logging
  const validateNavigationParams = () => {
    console.log('🔍 Starting parameter validation...');
    console.log('📋 Parameters to validate:', {
      postTitle: postTitle || 'MISSING',
      postId: postId || 'MISSING', 
      postOwnerId: postOwnerId || 'MISSING',
      currentUserId: user?.uid || 'MISSING'
    });
    
    // Check for missing parameters
    const missingParams = [];
    if (!postTitle) missingParams.push('postTitle');
    if (!postId) missingParams.push('postId');
    if (!postOwnerId) missingParams.push('postOwnerId');
    
    if (missingParams.length > 0) {
      console.log('❌ Missing parameters:', missingParams);
      logError('validation', new Error(`Missing required navigation parameters: ${missingParams.join(', ')}`), userData);
      return false;
    }
    console.log('✅ All required parameters present');
    
            // Validate parameter formats with detailed feedback
        console.log('🔧 Validating parameter formats...');
        
        // Check individual parameters
        const postIdValid = validationUtils.isValidFirebaseId(postId!);
        const postTitleValid = postTitle!.trim().length > 0;
        const postOwnerIdValid = validationUtils.isValidUserId(postOwnerId!);
        const currentUserIdValid = validationUtils.isValidUserId(user?.uid || '');
        
        console.log('🔍 Individual parameter checks:');
        console.log('  - postId:', postIdValid ? '✅ Valid' : '❌ Invalid');
        console.log('  - postTitle:', postTitleValid ? '✅ Valid' : '❌ Invalid');
        console.log('  - postOwnerId:', postOwnerIdValid ? '✅ Valid' : '❌ Invalid');
        console.log('  - currentUserId:', currentUserIdValid ? '✅ Valid' : '❌ Invalid');
        
        if (!postIdValid || !postTitleValid || !postOwnerIdValid || !currentUserIdValid) {
          const errors = [];
          if (!postIdValid) errors.push('Invalid post ID format');
          if (!postTitleValid) errors.push('Post title is required');
          if (!postOwnerIdValid) errors.push('Invalid post owner ID format');
          if (!currentUserIdValid) errors.push('Invalid current user ID format');
          
          logError('validation', new Error(`Invalid parameter format: ${errors.join(', ')}`), userData);
          return false;
        }
        
        console.log('✅ All parameter formats are valid');
        
        // Final check: prevent self-conversation
        if (postOwnerId === user?.uid) {
          console.log('❌ Self-conversation detected in validation');
          logError('validation', new Error('Cannot start conversation with yourself'), userData);
          return false;
        }
        
        return true;
  };

  // Simplified state management - consolidated conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Simplified conversation state - easier to manage and debug
  const [conversationId, setConversationId] = useState<string>(initialConversationId || "");
  const [conversationData, setConversationData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  
  // Conversation creation tracking (simplified)
  const [conversationCreationAttempts, setConversationCreationAttempts] = useState<number>(0);
  const [conversationCreationFailed, setConversationCreationFailed] = useState<boolean>(false);
  
  // Simple helper to check if conversation is ready
  const isConversationReady = useMemo(() => 
    !!conversationId && !loading && !conversationError, 
    [conversationId, loading, conversationError]
  );

  // Validate navigation parameters on mount
  useEffect(() => {
    // Skip validation if we already have a conversation ID (existing conversation)
    if (initialConversationId) {
      console.log('✅ Existing conversation detected, skipping validation');
      return;
    }
    
    if (!validateNavigationParams()) {
      // Check if it's a self-conversation attempt
      if (postOwnerId === user?.uid) {
        Alert.alert(
          'Cannot Start Chat',
          'You cannot start a conversation with yourself. This post belongs to you.',
          [{ text: 'Go Back', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      Alert.alert(
        'Navigation Error',
        'Missing required information to start chat. Please go back and try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [initialConversationId, postOwnerId, user?.uid, navigation]);

  // Simple message loading when conversation changes (like web version)
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    console.log('📱 Loading messages for conversation:', conversationId);
    setIsInitialLoad(true);
    
    const unsubscribe = getConversationMessages(conversationId, (loadedMessages) => {
      console.log('📨 Messages loaded:', {
        count: loadedMessages.length,
        conversationId
      });
      
      // Validate and sanitize loaded messages
      const validatedMessages = loadedMessages
        .map(message => {
          const validation = validationUtils.validateMessage(message);
          if (!validation.isValid) {
            console.log('⚠️ Invalid message found:', message.id, validation.error);
            return null;
          }
          return {
            ...message,
            text: validationUtils.sanitizeText(message.text)
          };
        })
        .filter((message): message is Message => message !== null);
      
      setMessages(validatedMessages);
      setIsInitialLoad(false);
      
      // Check if we have more messages to load (web version uses 50-message limit)
      if (validatedMessages.length < 50) {
        setHasMoreMessages(false);
      } else {
        setHasMoreMessages(true);
      }
      
      // Scroll to bottom on initial load
      if (isInitialLoad) {
        scrollToBottom();
      }
    }, 50); // Use 50-message limit like web version

    return () => unsubscribe();
  }, [conversationId, getConversationMessages]);

  // Load conversation data when conversation changes
  useEffect(() => {
    if (!conversationId) return;

    console.log('🔄 Getting conversation data...');
    getConversation(conversationId).then((data) => {
      console.log('✅ Conversation data loaded:', data);
      setConversationData(data);
    }).catch((error) => {
      console.log('❌ Failed to get conversation data:', error);
      logError('conversation', error, userData);
    });
  }, [conversationId, getConversation, userData]);

  // Mark conversation as read when messages are loaded
  useEffect(() => {
    if (!conversationId || !userData?.uid || messages.length === 0) return;

    try {
      console.log('🔄 Marking conversation as read...');
      markConversationAsRead(conversationId, userData.uid);
      console.log('✅ Marked conversation as read');
    } catch (error) {
      console.log('❌ Failed to mark conversation as read:', error);
    }
  }, [conversationId, userData, messages.length, markConversationAsRead]);

  // Simple conversation state logging
  useEffect(() => {
    console.log('Chat - Conversation state changed:', {
      id: conversationId,
      loading,
      error: conversationError,
      data: conversationData
    });
  }, [conversationId, loading, conversationError, conversationData]);

  // Simple message state management - no complex tracking needed
  const flatListRef = useRef<FlatList>(null);



  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isScrolledUp = contentOffset.y < contentSize.height - layoutMeasurement.height - 100;
    setShowScrollToBottom(isScrolledUp);
  }, []);

  // Pagination state
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Scroll to bottom state
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  // Verification modal states (like web version)
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);
  const [isHandoverSubmitting, setIsHandoverSubmitting] = useState(false);
  
  // Image modal state (like web version)
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    altText: string;
  } | null>(null);
  
  // Enhanced toast notification state with better user feedback
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
    duration?: number;
    action?: {
      label: string;
      onPress: () => void;
    };
  } | null>(null);
  
  // Error handling state
  const [errors, setErrors] = useState<{
    conversation: string | null;
    messages: string | null;
    sendMessage: string | null;
    general: string | null;
  }>({
    conversation: null,
    messages: null,
    sendMessage: null,
    general: null
  });

  // Debug state
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Simple state management
  
  // Enhanced logging and error handling
  const logDebug = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}`;
    
    console.log('Chat Debug:', logEntry);
    
    if (debugMode) {
      setDebugLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
    }
  };

  // Enhanced error recovery functions with better user feedback
  const clearError = (context: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [context]: null }));
    logDebug(`Error cleared for context: ${context}`);
  };

  const retryOperation = async (operation: () => Promise<void>, context: string) => {
    try {
      logDebug(`Retrying operation: ${context}`);
      clearError(context as keyof typeof errors);
      await operation();
      showToast(`Operation retried successfully!`, 'success', 3000);
    } catch (error: any) {
      logError(context, error, userData);
      showToast(`Retry failed: ${error?.message || 'Unknown error'}`, 'error', 5000, {
        label: 'Try Again',
        onPress: () => retryOperation(operation, context)
      });
    }
  };

  // Enhanced toast functions with better user experience
  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 4000,
    action?: { label: string; onPress: () => void }
  ) => {
    setToast({ message, type, visible: true, duration, action });
    
    // Auto-hide toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToast(prev => prev?.message === message ? null : prev);
      }, duration);
    }
  };

  const hideToast = () => setToast(null);

  const resetAllErrors = () => {
    setErrors({
      conversation: null,
      messages: null,
      sendMessage: null,
      general: null
    });
    logDebug('All errors cleared');
  };

  const logError = (context: string, error: any, userData?: any) => {
    const errorInfo = {
      context,
      error: error?.message || error?.toString() || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      conversationId,
      userId: userData?.uid,
      postId,
      postOwnerId
    };
    
    console.error('Chat Error:', errorInfo);
    
    // Store error in debug logs
    if (debugMode) {
      setDebugLogs(prev => [...prev.slice(-49), `ERROR: ${JSON.stringify(errorInfo)}`]);
    }
    
    // Set appropriate error state
    setErrors(prev => ({
      ...prev,
      [context]: errorInfo.error
    }));
  };

  // Toast notification helper - now using enhanced showToast function defined above
  
  // Simplified conversation setup - no complex guards needed
  
     // Check if handover button should be shown
  const shouldShowHandoverButton = () => {
    if (!userData || !postOwnerId) return false;
    if (postOwnerId === userData.uid) return false;
    if (conversationData?.postType !== "lost") return false;
    if (conversationData?.postStatus !== "pending") return false;
    return true;
  };

  // Check if claim item button should be shown
  const shouldShowClaimItemButton = () => {
    if (!userData || !postOwnerId) return false;
    if (postOwnerId === userData.uid) return false;
    if (conversationData?.postType !== "found") return false;
    if (conversationData?.postStatus !== "pending") return false;
    if (conversationData?.foundAction !== undefined && conversationData?.foundAction !== "keep") return false;
    return true;
  };

  // Simple conversation creation for new conversations (like web version)
  useEffect(() => {
    // Only create conversation if we don't have one and have all required parameters
    if (conversationId || !postId || !postTitle || !postOwnerId || !user?.uid || !userData?.uid) {
      return;
    }

    // Check for self-conversation
    if (postOwnerId === user.uid) {
      console.log('❌ Self-conversation attempt detected');
      showToast('Cannot start conversation with yourself', 'warning', 5000, {
        label: 'Go Back',
        onPress: () => navigation.goBack()
      });
      return;
    }

    console.log('🚀 Creating new conversation...');
    setLoading(true);

    const createNewConversation = async () => {
      try {
        // Sanitize user data before creation
        const sanitizedUserData = validationUtils.sanitizeUserData(userData);
        const sanitizedPostOwnerData = validationUtils.sanitizeUserData(postOwnerUserData);
        
        if (!sanitizedUserData) {
          throw new Error('Invalid user data');
        }

        const newConversationId = await createConversation(
          postId,
          validationUtils.sanitizeText(postTitle),
          postOwnerId,
          user.uid,
          sanitizedUserData,
          sanitizedPostOwnerData
        );
        
        console.log('✅ Conversation created successfully:', newConversationId);
        setConversationId(newConversationId);
        showToast('Conversation started successfully!', 'success', 3000);
        
      } catch (error: any) {
        console.log('❌ Conversation creation failed:', error);
        handleConversationCreationError(error);
      } finally {
        setLoading(false);
      }
    };

    createNewConversation();
  }, [conversationId, postId, postTitle, postOwnerId, user?.uid, userData, postOwnerUserData, createConversation, navigation]);
        
        console.log('Conversation validation result:', conversationValidation);
        
        if (!conversationValidation.isValid) {
          console.log('❌ Conversation validation failed:', conversationValidation.errors);
          logError('validation', new Error(`Invalid conversation parameters: ${conversationValidation.errors.join(', ')}`), userData);
          return;
        }
          
          // Sanitize user data before creation
          console.log('Sanitizing user data...');
          const sanitizedUserData = validationUtils.sanitizeUserData(userData);
          const sanitizedPostOwnerData = validationUtils.sanitizeUserData(postOwnerUserData);
          
          console.log('Sanitized data:', {
            currentUser: sanitizedUserData ? 'Valid' : 'Invalid',
            postOwner: sanitizedPostOwnerData ? 'Valid' : 'Invalid'
          });
          
          if (!sanitizedUserData) {
            console.log('❌ Invalid current user data');
            logError('validation', new Error('Invalid current user data'), userData);
            return;
          }
          
          // Create conversation
          try {
            console.log('🔄 Calling createConversation...');
            const newConversationId = await createConversation(
              postId!,
              validationUtils.sanitizeText(postTitle!),
              postOwnerId!,
              user.uid,
              sanitizedUserData,
              sanitizedPostOwnerData
            );
            
            console.log('✅ Conversation created successfully:', newConversationId);
            
            if (!isActive) {
              console.log('⚠️ Component unmounted during creation');
              return;
            }
            
            logDebug('Conversation created, updating state', { newConversationId });
            setConversationId(newConversationId);
            setConversationCreationFailed(false);
            showToast("Conversation started successfully!", "success");
            
            console.log('🔄 Exiting early to let effect re-run with new conversationId');
            return; // Exit early, let the effect re-run with new conversationId
          } catch (error) {
            console.log('❌ Conversation creation failed:', error);
            if (!isActive) return;
            handleConversationCreationError(error);
            return;
          }
        }

        // Step 3: Set up message listener for existing conversation
        console.log('Step 3: Setting up message listener...');
        if (conversationId && isConversationReady && isActive) {
          console.log('✅ Setting up message listener for conversation:', conversationId);
          logDebug('Setting up message listener for conversation', { conversationId });
          
          // Set up message listener
          messageUnsubscribe = getConversationMessages(conversationId, (loadedMessages) => {
            console.log('📨 Messages loaded:', {
              count: loadedMessages.length,
              firstMessage: loadedMessages[0]?.text || 'None',
              lastMessage: loadedMessages[loadedMessages.length - 1]?.text || 'None'
            });
            
            if (!isActive) return;
            
            // Validate and sanitize loaded messages
            const validatedMessages = loadedMessages
              .map(message => {
                const validation = validationUtils.validateMessage(message);
                if (!validation.isValid) {
                  console.log('⚠️ Invalid message found:', message.id, validation.error);
                  logError('validation', new Error(`Invalid message: ${validation.error}`), userData);
                  return null;
                }
                
                // Sanitize message text
                return {
                  ...message,
                  text: validationUtils.sanitizeText(message.text)
                };
              })
              .filter((message): message is Message => message !== null); // Remove invalid messages
            
            console.log('✅ Validated messages:', validatedMessages.length);
            setMessages(validatedMessages);
            setIsInitialLoad(false);
            
            // Check if we have more messages to load (web version uses 50-message limit)
            if (validatedMessages.length < 50) {
              setHasMoreMessages(false);
            } else {
              setHasMoreMessages(true);
            }
            
            // Scroll to bottom on initial load
            if (isInitialLoad) {
              scrollToBottom();
            }
          }, 50); // Use 50-message limit like web version
          
          // Get conversation data for UI logic
          try {
            console.log('🔄 Getting conversation data...');
            const data = await getConversation(conversationId);
            if (!isActive) return;
            
            console.log('✅ Conversation data loaded:', data);
            setConversationData(data);
            logDebug('Conversation data loaded', { data });
          } catch (error) {
            console.log('❌ Failed to get conversation data:', error);
            if (!isActive) return;
            logError('conversation', error, userData);
          }
          
          // Mark conversation as read
          if (userData?.uid) {
            try {
              console.log('🔄 Marking conversation as read...');
              await markConversationAsRead(conversationId, userData.uid);
              console.log('✅ Conversation marked as read');
            } catch (error) {
              console.log('❌ Failed to mark conversation as read:', error);
              if (!isActive) return;
              logError('conversation', error, userData);
            }
          }
          
          // Reset pagination state for new conversation
          setHasMoreMessages(true);
          setIsInitialLoad(true);
        } else {
          console.log('⚠️ Cannot set up message listener:', {
            hasConversationId: !!conversationId,
            conversationStatus: isConversationReady ? 'ready' : loading ? 'creating' : 'idle',
            isActive
          });
        }

        // Step 4: Mark unread messages as read when they arrive
        if (conversationId && userData?.uid && messages.length > 0 && isActive) {
          try {
            console.log('🔄 Checking unread count...');
            const unreadCount = getConversationUnreadCount(conversationId, userData.uid);
            console.log('Unread count:', unreadCount);
            if (unreadCount > 0) {
              await markConversationAsRead(conversationId, userData.uid);
              console.log('✅ Marked unread messages as read');
            }
          } catch (error) {
            console.log('❌ Failed to mark unread messages as read:', error);
            if (!isActive) return;
            logError('conversation', error, userData);
          }
        }

              } catch (error) {
          console.log('❌ Error in conversation lifecycle:', error);
          if (!isActive) return;
          logError('conversation', error, userData);
        }
        
        console.log('=== CONVERSATION LIFECYCLE END ===');
      };
      
      // Execute the lifecycle management
      manageConversationLifecycle();
      
      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up conversation lifecycle');
        isActive = false;
        if (messageUnsubscribe) {
          messageUnsubscribe();
        }
        logDebug('Conversation lifecycle cleanup completed');
      };

  }, [
    // Dependencies that should trigger lifecycle management
    postId, 
    postTitle, 
    postOwnerId, 
    user?.uid, 
    userData?.uid, 
    conversationId, 
    isConversationReady,
    conversationCreationAttempts,
    conversationCreationFailed,
    messages.length,
    // Functions that should be stable
    createConversation,
    getConversationMessages,
    getConversation,
    markConversationAsRead,
    getConversationUnreadCount
  ]);

  // Function to mark message as read when it comes into view
  const handleMessageSeen = async (messageId: string) => {
    if (!conversationId || !userData?.uid) return;

    try {
      await markMessageAsRead(conversationId, messageId);
    } catch (error) {
      console.warn("Mobile: Failed to mark message as read:", error);
    }
  };

  // Simple viewable items tracking for read receipts
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (!conversationId || !userData?.uid) return;

      // Mark messages as read when they come into view
      viewableItems.forEach((item) => {
        const message = item.item;
        if (message && message.senderId !== userData.uid) {
          handleMessageSeen(message.id);
        }
      });
    },
    [conversationId, userData, handleMessageSeen]
  );

  // Memoize the viewability config to prevent unnecessary re-renders
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  if (!user || !userData) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Please log in to send messages</Text>
      </SafeAreaView>
    );
  }

  // Enhanced scroll to bottom function
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const scrollToBottomOnNewMessage = () => {
    // Only scroll to bottom if we're not loading older messages
    if (!isLoadingOlderMessages) {
      scrollToBottom();
    }
  };

  const loadOlderMessages = async () => {
    if (isLoadingOlderMessages || !hasMoreMessages || messages.length === 0)
      return;

    try {
      setIsLoadingOlderMessages(true);

      // Get the timestamp of the oldest message
      const oldestMessage = messages[0];
      if (!oldestMessage?.timestamp) return;

      // Load older messages
      const olderMessages = await getOlderMessages(
        conversationId,
        oldestMessage.timestamp,
        20
      );

      if (olderMessages.length > 0) {
        // Prepend older messages to the current messages
        setMessages((prevMessages) => [...olderMessages, ...prevMessages]);

        // If we got fewer messages than requested, there are no more
        if (olderMessages.length < 20) {
          setHasMoreMessages(false);
        }
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      logError('messages', error, userData);
      showToast('Failed to load older messages', 'error');
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  // Enhanced error handling for conversation creation failures with better user feedback
  const handleConversationCreationError = (error: any) => {
    logError('conversation', error, userData);
    
    // Provide user-friendly error messages with specific error types
    let errorMessage = 'Failed to start conversation. Please try again.';
    let errorType: 'error' | 'warning' | 'info' = 'error';
    
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      errorMessage = 'Permission denied. Please check your account status.';
      errorType = 'warning';
    } else if (error.code === 'unavailable' || error.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
      errorType = 'warning';
    } else if (error.code === 'quota-exceeded' || error.message?.includes('quota')) {
      errorMessage = 'Service temporarily unavailable. Please try again later.';
      errorType = 'warning';
    } else if (error.code === 'already-exists') {
      errorMessage = 'Conversation already exists.';
      errorType = 'info';
    }
    
    // Show toast notification with retry option
    showToast(errorMessage, errorType, 6000, {
      label: 'Retry',
      onPress: () => {
        setConversationCreationFailed(false);
        setConversationCreationAttempts(0);
        showToast('Retrying conversation creation...', 'info', 2000);
      }
    });
    
    // Set failure state if we've reached max attempts
    if (conversationCreationAttempts >= 3) {
      setConversationCreationFailed(true);
      showToast('Maximum retry attempts reached. Please try again later.', 'error', 8000, {
        label: 'Go Back',
        onPress: () => navigation.goBack()
      });
    }
  };

  // Simple debounce implementation for retry mechanism
  const debouncedRetry = useCallback(() => {
    const timeoutId = setTimeout(() => {
      if (!conversationId && !loading) {
        logDebug('Debounced retry triggered');
        setConversationCreationFailed(false);
        setConversationCreationAttempts(0);
      }
    }, 2000); // 2 second delay
    
    return () => clearTimeout(timeoutId);
  }, [conversationId, loading]);

  // Cleanup debounced retry on unmount
  useEffect(() => {
    const cleanup = debouncedRetry();
    return cleanup;
  }, [debouncedRetry]);

  const handleSendMessage = async () => {
    // Validate input and conversation state
    if (!conversationId) {
      showToast('No active conversation', 'error');
      return;
    }

    // Validate message content
    const messageValidation = validationUtils.isValidMessage(newMessage);
    if (!messageValidation.isValid) {
      showToast(messageValidation.error || 'Invalid message', 'error');
      return;
    }

    // Validate conversation ID format
    if (!validationUtils.isValidFirebaseId(conversationId)) {
      logError('validation', new Error('Invalid conversation ID format'), userData);
      showToast('Invalid conversation format', 'error');
      return;
    }

    // Validate user data
    if (!validationUtils.isValidUserId(user?.uid || '')) {
      logError('validation', new Error('Invalid user ID format'), userData);
      showToast('User authentication error', 'error');
      return;
    }

    try {
      // Sanitize message text
      const sanitizedMessage = validationUtils.sanitizeText(newMessage);
      setNewMessage('');
      
      // Sanitize user data before sending
      const sanitizedUserData = validationUtils.sanitizeUserData(userData);
      if (!sanitizedUserData) {
        throw new Error('Invalid user data');
      }
      
      await sendMessage(
        conversationId,
        user.uid,
        `${sanitizedUserData.firstName} ${sanitizedUserData.lastName}`,
        sanitizedMessage,
        sanitizedUserData.profilePicture
      );
      
      scrollToBottomOnNewMessage();
      showToast("Message sent successfully!", "success");
    } catch (error: any) {
      logError('sendMessage', error, userData);
      showToast(error.message || 'Failed to send message', "error");
    }
  };

  const handleHandoverResponse = (
    messageId: string,
    status: "accepted" | "rejected"
  ) => {
    // Callback for handover response updates
  };

  const handleClaimResponse = (
    messageId: string,
    status: "accepted" | "rejected"
  ) => {
    // Callback for claim response updates
  };

  const handleConfirmIdPhotoSuccess = (messageId: string) => {
    // Show success message and redirect to conversation list
    Alert.alert("Success", "✅ ID photo confirmed successfully!", [
      {
        text: "OK",
        onPress: () => {
          // Navigate back to Message screen (conversation list)
          navigation.navigate("Message");
        },
      },
    ]);
  };

  const handleHandoverRequest = async () => {
    // Show verification modal first (like web version)
    setShowHandoverModal(true);
  };

  const handleHandoverRequestSubmit = async () => {
    if (!conversationId || !user || !userData) return;

    try {
      setIsHandoverSubmitting(true);
      const { messageService } = await import("@/utils/firebase");
      await messageService.sendHandoverRequest(
        conversationId,
        user.uid,
        `${userData.firstName} ${userData.lastName}`,
        userData.profilePicture || "",
        conversationData?.postId || "",
        postTitle
      );
      setShowHandoverModal(false);
      showToast("Handover request sent successfully!", "success");
    } catch (error: any) {
      logError('general', error, userData);
      showToast("Failed to send handover request. Please try again.", "error");
    } finally {
      setIsHandoverSubmitting(false);
    }
  };

  const handleClaimRequest = async () => {
    // Show verification modal first (like web version)
    setShowClaimModal(true);
  };

  const handleClaimRequestSubmit = async () => {
    if (!conversationId || !user || !userData) return;

    (navigation as any).navigate('ClaimFormScreen', {
      conversationId,
      postId,
      postTitle,
      postOwnerId,
    });
    setShowClaimModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
              {/* Debug Panel - Only visible in debug mode */}
        {debugMode && (
          <View className="bg-gray-800 px-4 py-2">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-sm font-bold">Debug Mode</Text>
              <TouchableOpacity onPress={() => setDebugMode(false)}>
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                onPress={resetAllErrors}
                className="bg-blue-500 px-2 py-1 rounded"
              >
                <Text className="text-white text-xs">Clear Errors</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDebugLogs([])}
                className="bg-gray-500 px-2 py-1 rounded"
              >
                <Text className="text-white text-xs">Clear Logs</Text>
              </TouchableOpacity>
            </View>
            
            {/* Validation Status */}
            <View className="mb-2 p-2 bg-gray-700 rounded">
              <Text className="text-white text-xs font-bold mb-1">Validation Status:</Text>
              <Text className="text-green-400 text-xs">
                ✓ Post ID: {validationUtils.isValidFirebaseId(postId || '') ? 'Valid' : 'Invalid'}
              </Text>
              <Text className="text-green-400 text-xs">
                ✓ Post Owner ID: {validationUtils.isValidUserId(postOwnerId || '') ? 'Valid' : 'Invalid'}
              </Text>
              <Text className="text-green-400 text-xs">
                ✓ Current User ID: {validationUtils.isValidUserId(user?.uid || '') ? 'Valid' : 'Invalid'}
              </Text>
              <Text className="text-green-400 text-xs">
                ✓ Conversation ID: {conversationId ? validationUtils.isValidFirebaseId(conversationId) ? 'Valid' : 'Invalid' : 'None'}
              </Text>
            </View>
            
            <ScrollView className="max-h-32">
              {debugLogs.map((log, index) => (
                <Text key={index} className="text-white text-xs font-mono">
                  {log}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

      {/* Error Display - Show active errors */}
      {(errors.conversation || errors.messages || errors.sendMessage || errors.general) && (
        <View className="bg-red-50 border-b border-red-200 px-4 py-3">
          <Text className="text-red-800 font-medium mb-2">⚠️ Errors Detected</Text>
          {errors.conversation && (
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-red-700 text-sm">Conversation: {errors.conversation}</Text>
              <TouchableOpacity onPress={() => clearError('conversation')}>
                <Ionicons name="close-circle" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
          {errors.messages && (
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-red-700 text-sm">Messages: {errors.messages}</Text>
              <TouchableOpacity onPress={() => clearError('messages')}>
                <Ionicons name="close-circle" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
          {errors.sendMessage && (
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-red-700 text-sm">Send Message: {errors.sendMessage}</Text>
              <TouchableOpacity onPress={() => clearError('sendMessage')}>
                <Ionicons name="close-circle" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
          {errors.general && (
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-red-700 text-sm">General: {errors.general}</Text>
              <TouchableOpacity onPress={() => clearError('general')}>
                <Ionicons name="close-circle" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-3 pb-4 px-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              className="font-semibold text-lg text-gray-800"
              numberOfLines={1}
            >
              {postTitle}
            </Text>
            {/* Badge count for unread messages in this conversation */}
            {conversationId &&
              userData?.uid &&
              (() => {
                const unreadCount = getConversationUnreadCount(
                  conversationId,
                  userData.uid
                );
                return unreadCount > 0 ? (
                  <View className="ml-2 bg-red-500 rounded-full min-w-[20px] h-[20px] items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                ) : null;
              })()}
          </View>
          <Text className="text-sm text-gray-500">
            {postOwnerId && userData
              ? postOwnerId === userData.uid
                ? "Your post"
                : "Chat with post owner"
              : "About this lost/found item"}
          </Text>
        </View>

        {/* Handover Item Button */}
        {shouldShowHandoverButton() && (
          <TouchableOpacity
            className="ml-3 px-4 py-2 bg-green-500 rounded-lg"
            onPress={handleHandoverRequest}
          >
            <Text className="text-white font-medium text-sm">Handover</Text>
          </TouchableOpacity>
        )}

        {/* Claim Item Button */}
        {shouldShowClaimItemButton() && (
          <TouchableOpacity
            className="ml-3 px-4 py-2 bg-blue-500 rounded-lg"
            onPress={handleClaimRequest}
          >
            <Text className="text-white font-medium text-sm">Claim Item</Text>
          </TouchableOpacity>
        )}

        {/* Debug Toggle Button */}
        <TouchableOpacity
          onPress={() => setDebugMode(!debugMode)}
          className="ml-3 px-3 py-2 bg-gray-500 rounded-lg"
        >
          <Ionicons name="bug" size={16} color="white" />
        </TouchableOpacity>

      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Creating conversation...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            {postOwnerId === user?.uid ? (
              // Self-conversation message
              <>
                <Ionicons name="person-circle-outline" size={64} color="#F59E0B" />
                <Text className="text-gray-700 text-center mt-4 mb-2 text-lg font-semibold">
                  This is your post
                </Text>
                <Text className="text-gray-500 text-center mt-2 mb-6 leading-6">
                  You cannot start a conversation with yourself about "{postTitle}"
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="bg-blue-500 px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Go Back</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Normal conversation start message
              <>
                <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 text-center mt-4">
                  {loading
                    ? "Setting up your conversation..."
                    : `Start the conversation about "${postTitle}"`}
                </Text>
              </>
            )}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwnMessage={item.senderId === user.uid}
                conversationId={conversationId}
                currentUserId={user?.uid || ""}
                isCurrentUserPostOwner={postOwnerId === userData?.uid}
                onHandoverResponse={handleHandoverResponse}
                onClaimResponse={handleClaimResponse}
                onConfirmIdPhotoSuccess={handleConfirmIdPhotoSuccess}
                onMessageSeen={() => handleMessageSeen(item.id)}
                onImageClick={(imageUrl, altText) => setSelectedImage({ url: imageUrl, altText })}
              />
            )}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottomOnNewMessage}
            onViewableItemsChanged={onViewableItemsChanged}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            viewabilityConfig={viewabilityConfig}
            // Pagination: Load older messages when scrolling to top
            onEndReached={loadOlderMessages}
            onEndReachedThreshold={0.1}
            // Show loading indicator at top when loading older messages
            ListHeaderComponent={
              isLoadingOlderMessages ? (
                <View className="py-4 items-center">
                  <Text className="text-gray-500 text-sm">
                    Loading older messages...
                  </Text>
                </View>
              ) : null
            }
            // Show message when no more messages to load
            ListFooterComponent={
              !hasMoreMessages && messages.length > 0 ? (
                <View className="py-4 items-center">
                  <Text className="text-gray-400 text-xs">
                    No more messages
                  </Text>
                </View>
              ) : null
            }
          />
          
        )}
        
        {/* Scroll to Bottom Button - Floating */}
        {showScrollToBottom && (
          <TouchableOpacity
            onPress={scrollToBottom}
            style={{
              position: 'absolute',
              bottom: 120,
              right: 16,
              width: 48,
              height: 48,
              backgroundColor: '#3b82f6',
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              zIndex: 1000,
            }}
          >
            <Ionicons name="chevron-down" size={24} color="white" />
          </TouchableOpacity>
        )}

        {/* Claim Verification Modal - Like Web Version */}
        {showClaimModal && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              margin: 20,
              width: '90%',
              maxWidth: 400,
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
                Verify Claim Request
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
                Please upload a photo of your ID to verify your claim.
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setShowClaimModal(false)}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: '#6b7280',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleClaimRequestSubmit}
                  disabled={isClaimSubmitting}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: isClaimSubmitting ? '#9ca3af' : '#3b82f6',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>
                    {isClaimSubmitting ? 'Processing...' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Handover Verification Modal - Like Web Version */}
        {showHandoverModal && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              margin: 20,
              width: '90%',
              maxWidth: 400,
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
                Verify Handover Request
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
                Please upload a photo of your ID to verify the handover.
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
                <TouchableOpacity
                  onPress={() => setShowHandoverModal(false)}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: '#6b7280',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleHandoverRequestSubmit}
                  disabled={isHandoverSubmitting}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: isHandoverSubmitting ? '#9ca3af' : '#3b82f6',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>
                    {isHandoverSubmitting ? 'Processing...' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Image Modal - Like Web Version */}
        {selectedImage && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000,
          }}>
            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: 40,
                right: 20,
                zIndex: 3001,
              }}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            <Image
              source={{ uri: selectedImage.url }}
              style={{
                width: '90%',
                height: '80%',
                resizeMode: 'contain',
              }}
            />
            
            {selectedImage.altText && (
              <Text style={{
                color: 'white',
                fontSize: 16,
                textAlign: 'center',
                marginTop: 20,
                paddingHorizontal: 20,
              }}>
                {selectedImage.altText}
              </Text>
            )}
          </View>
        )}

        {/* Enhanced Toast Notification with Action Support */}
        {toast && (
          <View style={{
            position: 'absolute',
            top: 100,
            left: 20,
            right: 20,
            backgroundColor: toast.type === 'success' ? '#10b981' : 
                           toast.type === 'error' ? '#ef4444' : 
                           toast.type === 'warning' ? '#f59e0b' : '#3b82f6',
            borderRadius: 8,
            padding: 16,
            zIndex: 4000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            {/* Toast Message */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: toast.action ? 8 : 0 }}>
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '500',
                flex: 1,
              }}>
                {toast.message}
              </Text>
              <TouchableOpacity onPress={hideToast}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Action Button */}
            {toast.action && (
              <TouchableOpacity 
                onPress={() => {
                  toast.action?.onPress();
                  hideToast();
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 12,
                  fontWeight: '600',
                }}>
                  {toast.action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Message Counter */}
        <View className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-gray-600 font-medium">
              Messages in conversation
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-1">
                <View className={`w-3 h-3 rounded-full ${
                  messages.length >= 45 ? 'bg-red-400' : 
                  messages.length >= 40 ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <Text className={`text-sm font-semibold ${
                  messages.length >= 45 ? 'text-red-600' : 
                  messages.length >= 40 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {messages.length}/50
                </Text>
              </View>
              {messages.length >= 45 && (
                <Text className="text-xs text-red-500 font-medium">
                  {50 - messages.length} left
                </Text>
              )}
            </View>
          </View>
          
          {/* Progress Bar */}
          <View className="w-full bg-gray-200 rounded-full h-2">
            <View 
              className={`h-2 rounded-full transition-all duration-300 ${
                messages.length >= 45 ? 'bg-red-400' : 
                messages.length >= 40 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${(messages.length / 50) * 100}%` }}
            />
          </View>
          
                  {/* Status Message */}
        {messages.length >= 45 && (
          <Text className="text-xs text-red-500 mt-1 text-center">
            ⚠️ Oldest messages will be automatically removed when limit is reached
          </Text>
        )}

        {/* Simple message counter */}
        <View className="mt-2 pt-2 border-t border-gray-300">
          <Text className="text-xs text-gray-500 text-center">
            {messages.length} messages
          </Text>
        </View>
      </View>

        {/* Conversation Creation Status */}
        {loading && (
          <View className="border-t border-gray-200 bg-blue-50 px-4 py-3">
            <View className="flex-row items-center justify-center">
              <Ionicons name="sync" size={16} color="#3b82f6" />
              <Text className="text-blue-700 text-sm ml-2 font-medium">
                {conversationCreationFailed 
                  ? "Conversation creation failed" 
                  : `Setting up conversation... (${conversationCreationAttempts}/3)`
                }
              </Text>
            </View>
            {conversationCreationFailed && (
              <TouchableOpacity
                onPress={() => {
                  setConversationCreationFailed(false);
                  setConversationCreationAttempts(0);
                  // The lifecycle management will automatically retry
                }}
                className="mt-2 bg-blue-500 px-4 py-2 rounded-lg self-center"
              >
                <Text className="text-white text-sm font-medium">Retry</Text>
              </TouchableOpacity>
            )}
            {debugMode && (
              <View className="mt-2 pt-2 border-t border-blue-200">
                <Text className="text-blue-600 text-xs text-center">
                  Status: {isConversationReady ? 'ready' : loading ? 'creating' : 'idle'} | ID: {conversationId || 'None'} | Attempts: {conversationCreationAttempts}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Message Input */}
        <View className="border-t border-gray-200 bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 relative">
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder={
                  loading 
                    ? conversationCreationFailed 
                      ? "Conversation creation failed" 
                      : `Creating conversation... (${conversationCreationAttempts}/3)`
                    : "Type a message..."
                }
                className={`border rounded-full px-4 py-3 text-base ${
                  loading ? "bg-gray-100" : "bg-white"
                } ${
                  newMessage.length > 180
                    ? newMessage.length >= 200
                      ? "border-red-300"
                      : "border-yellow-300"
                    : "border-gray-300"
                }`}
                multiline
                maxLength={200}
                editable={!loading}
              />
              
              {/* Real-time validation feedback */}
              {newMessage.length > 0 && (
                <View className="absolute -bottom-6 left-0 right-0">
                  {(() => {
                    const validation = validationUtils.isValidMessage(newMessage);
                    if (!validation.isValid) {
                      return (
                        <Text className="text-red-500 text-xs">
                          ⚠️ {validation.error}
                        </Text>
                      );
                    }
                    return null;
                  })()}
                </View>
              )}
              <View className="absolute bottom-1 right-3">
                <Text
                  className={`text-xs ${
                    newMessage.length > 180
                      ? newMessage.length >= 200
                        ? "text-red-500"
                        : "text-yellow-500"
                      : "text-gray-400"
                  }`}
                >
                  {newMessage.length}/200
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={
                !newMessage.trim() || loading || newMessage.length > 200
              }
              className={`w-12 h-12 rounded-full items-center justify-center ${
                newMessage.trim() && !loading && newMessage.length <= 200
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
            >
              <Ionicons
                name="send"
                size={20}
                color={
                  newMessage.trim() && !loading && newMessage.length <= 200
                    ? "white"
                    : "#9CA3AF"
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
