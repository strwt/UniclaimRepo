import React, { useState, useEffect, useRef } from 'react';
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
  Linking
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from "@expo/vector-icons";
import { useMessage } from "@/context/MessageContext";
import { useAuth } from "@/context/AuthContext";
import type { Message, RootStackParamList } from "@/types/type";
import ImagePicker from "@/components/ImagePicker";

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

const MessageBubble = ({
  message,
  isOwnMessage,
  conversationId,
  currentUserId,
  onHandoverResponse,
  onClaimResponse
}: {
  message: Message;
  isOwnMessage: boolean;
  conversationId: string;
  currentUserId: string;
  onHandoverResponse?: (messageId: string, status: 'accepted' | 'rejected') => void;
  onClaimResponse?: (messageId: string, status: 'accepted' | 'rejected') => void;
}) => {
  const { deleteMessage, confirmHandoverIdPhoto, confirmClaimIdPhoto } = useMessage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showIdPhotoModal, setShowIdPhotoModal] = useState(false);
  const [selectedIdPhoto, setSelectedIdPhoto] = useState<string | null>(null);
  const [isUploadingIdPhoto, setIsUploadingIdPhoto] = useState(false);
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleHandoverResponse = async (status: 'accepted' | 'rejected') => {
    if (!onHandoverResponse) return;
    
    try {
      // If accepting, show ID photo modal
      if (status === 'accepted') {
        setShowIdPhotoModal(true);
        return;
      }
      
      // For rejection, proceed as normal
      const { messageService } = await import('@/utils/firebase');
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

  const handleIdPhotoUpload = async (photoUri: string) => {
    try {
      setIsUploadingIdPhoto(true);
      
      console.log('📸 Starting ID photo upload...', photoUri);
      
      // Upload ID photo to Cloudinary
      const { cloudinaryService } = await import('@/utils/cloudinary');
      const uploadedUrl = await cloudinaryService.uploadImage(photoUri, 'id_photos');
      
      console.log('✅ ID photo uploaded successfully:', uploadedUrl);
      
      // Update handover response with ID photo
      const { messageService } = await import('@/utils/firebase');
      await messageService.updateHandoverResponse(
        conversationId,
        message.id,
        'accepted',
        currentUserId,
        uploadedUrl
      );
      
      console.log('✅ Handover response updated with ID photo');
      
      // Call the callback to update UI
      onHandoverResponse?.(message.id, 'accepted');
      
      // Close modal and reset state
      setShowIdPhotoModal(false);
      setSelectedIdPhoto(null);
      
      // Show success message
      Alert.alert('Success', 'ID photo uploaded successfully! The item owner will now review and confirm.');
      
    } catch (error: any) {
      console.error('❌ Failed to upload ID photo:', error);
      
      let errorMessage = 'Failed to upload ID photo. Please try again.';
      
      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('Cloudinary cloud name not configured')) {
        errorMessage = 'Cloudinary not configured. Please contact support.';
      } else if (error.message?.includes('Upload preset not configured')) {
        errorMessage = 'Upload configuration error. Please contact support.';
      }
      
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsUploadingIdPhoto(false);
    }
  };

  const handleConfirmIdPhoto = async () => {
    try {
      await confirmHandoverIdPhoto(conversationId, message.id);
    } catch (error: any) {
      console.error('Failed to confirm ID photo:', error);
      Alert.alert('Error', 'Failed to confirm ID photo. Please try again.');
    }
  };

  const handleClaimResponse = async (status: 'accepted' | 'rejected') => {
    if (!onClaimResponse) return;

    try {
      // If accepting, show ID photo modal for verification
      if (status === 'accepted') {
        setShowIdPhotoModal(true);
        return;
      }

      // For rejection, proceed as normal
      await updateClaimResponse(conversationId, message.id, status);

      // Call the callback to update UI
      onClaimResponse(message.id, status);
    } catch (error) {
      console.error('Failed to update claim response:', error);
      Alert.alert('Error', 'Failed to update claim response. Please try again.');
    }
  };

  const handleClaimIdPhotoUpload = async (photoUri: string) => {
    try {
      setIsUploadingIdPhoto(true);

      console.log('📸 Starting claim ID photo upload...', photoUri);
      console.log('📸 Message type:', message.messageType);
      console.log('📸 Conversation ID:', conversationId);

      // Upload ID photo to Cloudinary
      const { cloudinaryService } = await import('@/utils/cloudinary');
      const uploadedUrl = await cloudinaryService.uploadImage(photoUri, 'id_photos');

      console.log('✅ Claim ID photo uploaded successfully:', uploadedUrl);

      // Update claim response with ID photo
      const { messageService } = await import('@/utils/firebase');
      await messageService.updateClaimResponse(
        conversationId,
        message.id,
        'accepted',
        currentUserId,
        uploadedUrl
      );

      console.log('✅ Claim response updated with ID photo');

      // Call the callback to update UI
      onClaimResponse?.(message.id, 'accepted');

      // Close modal and reset state
      setShowIdPhotoModal(false);
      setSelectedIdPhoto(null);

      // Show success message
      Alert.alert('Success', 'ID photo uploaded successfully! The post owner will now review and confirm your claim.');

    } catch (error: any) {
      console.error('❌ Failed to upload claim ID photo:', error);

      let errorMessage = 'Failed to upload ID photo. Please try again.';

      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('Cloudinary cloud name not configured')) {
        errorMessage = 'Cloudinary not configured. Please contact support.';
      } else if (error.message?.includes('Upload preset not configured')) {
        errorMessage = 'Upload configuration error. Please contact support.';
      }

      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsUploadingIdPhoto(false);
    }
  };

  const handleConfirmClaimIdPhoto = async () => {
    try {
      await confirmClaimIdPhoto(conversationId, message.id);
      // Call the callback to update UI
      onClaimResponse?.(message.id, 'accepted');
    } catch (error: any) {
      console.error('Failed to confirm claim ID photo:', error);
      Alert.alert('Error', 'Failed to confirm ID photo. Please try again.');
    }
  };

  const handleDeleteMessage = async () => {
    if (!isOwnMessage) return;
    
    Alert.alert(
      'Delete Message',
      'This action cannot be undone. Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteMessage(conversationId, message.id);
            } catch (error: any) {
              Alert.alert('Error', `Failed to delete message: ${error.message}`);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderHandoverRequest = () => {
    if (message.messageType !== 'handover_request') return null;
    
    const handoverData = message.handoverData;
    if (!handoverData) return null;

    // Show different UI based on status and user role
    const canRespond = handoverData.status === 'pending' && !isOwnMessage;
    const canConfirm = handoverData.status === 'pending_confirmation' && isOwnMessage;
    const isCompleted = handoverData.status === 'accepted' || handoverData.status === 'rejected';

    return (
      <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Text className="text-sm text-blue-800 mb-2">
          <Text className="font-bold">Handover Request:</Text> {handoverData.postTitle}
        </Text>
        
        {/* Show ID photo if uploaded */}
        {handoverData.idPhotoUrl && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">ID Photo:</Text>
            <TouchableOpacity
              onPress={() => {
                if (handoverData.idPhotoUrl) {
                  // For mobile, we'll use a simple alert with option to view
                  Alert.alert(
                    'View ID Photo',
                    'Would you like to view the full-size ID photo?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'View Full Size',
                        onPress: () => {
                          // Open in device's default image viewer
                          if (handoverData.idPhotoUrl) {
                            Linking.openURL(handoverData.idPhotoUrl);
                          }
                        }
                      }
                    ]
                  );
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

        {/* Show item photos if uploaded */}
        {handoverData.itemPhotos && handoverData.itemPhotos.length > 0 && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1 font-medium">Item Photos:</Text>
            <View className="gap-2">
              {handoverData.itemPhotos.map((photo, index) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        `View Item Photo ${index + 1}`,
                        'Would you like to view the full-size item photo?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'View Full Size',
                            onPress: () => {
                              Linking.openURL(photo.url);
                            }
                          }
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
              onPress={() => handleHandoverResponse('accepted')}
              className="px-3 py-1 bg-green-500 rounded-md"
            >
              <Text className="text-white text-xs">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleHandoverResponse('rejected')}
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
          </View>
        ) : (
          <Text className="text-xs text-blue-600">
            Status: <Text className="capitalize font-medium">{handoverData.status}</Text>
            {isCompleted && handoverData.respondedAt && (
              <Text className="ml-2">
                at {formatTime(handoverData.respondedAt)}
              </Text>
            )}
            {handoverData.status === 'accepted' && handoverData.idPhotoConfirmed && (
              <Text className="ml-2 text-green-600">
                ✓ ID Photo Confirmed
              </Text>
            )}
            {handoverData.status === 'accepted' && handoverData.itemPhotosConfirmed && (
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
    if (message.messageType !== 'handover_response') return null;
    
    const handoverData = message.handoverData;
    if (!handoverData) return null;

    const statusColor = handoverData.status === 'accepted' ? 'text-green-600' : 'text-red-600';
    const statusIcon = handoverData.status === 'accepted' ? '✅' : '❌';

    return (
      <View className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <View className={`flex-row items-center gap-2`}>
          <Text>{statusIcon}</Text>
          <Text className={`text-sm ${statusColor} capitalize font-medium`}>
            {handoverData.status}
          </Text>
          {handoverData.responseMessage && (
            <Text className="text-gray-600 text-sm">- {handoverData.responseMessage}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderClaimRequest = () => {
    if (message.messageType !== 'claim_request') return null;

    const claimData = message.claimData;
    if (!claimData) return null;

    // Show different UI based on status and user role
    const canRespond = claimData.status === 'pending' && !isOwnMessage;
    const canConfirm = claimData.status === 'pending_confirmation' && !isOwnMessage;
    const isCompleted = claimData.status === 'accepted' || claimData.status === 'rejected';

    return (
      <View className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <Text className="text-sm text-purple-800 mb-2">
          <Text className="font-bold">Claim Request:</Text> {claimData.postTitle}
        </Text>

        {/* Show ID photo if uploaded */}
        {claimData.idPhotoUrl && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">ID Photo:</Text>
            <Image
              source={{ uri: claimData.idPhotoUrl }}
              className="w-20 h-12 rounded"
              resizeMode="cover"
            />
          </View>
        )}

        {/* Action buttons */}
        {canRespond ? (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleClaimResponse('accepted')}
              className="px-3 py-1 bg-green-500 rounded-md"
            >
              <Text className="text-white text-xs">Accept Claim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleClaimResponse('rejected')}
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
          </View>
        ) : (
          <Text className="text-xs text-purple-600">
            Status: <Text className="capitalize font-medium">{claimData.status}</Text>
            {isCompleted && claimData.respondedAt && (
              <Text className="ml-2">
                at {formatTime(claimData.respondedAt)}
              </Text>
            )}
            {claimData.status === 'accepted' && claimData.idPhotoConfirmed && (
              <Text className="ml-2 text-green-600">
                ✓ ID Photo Confirmed
              </Text>
            )}
          </Text>
        )}
      </View>
    );
  };

  const renderClaimResponse = () => {
    if (message.messageType !== 'claim_response') return null;

    const claimData = message.claimData;
    if (!claimData) return null;

    const statusColor = claimData.status === 'accepted' ? 'text-green-600' : 'text-red-600';
    const statusIcon = claimData.status === 'accepted' ? '✅' : '❌';

    return (
      <View className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <View className={`flex-row items-center gap-2`}>
          <Text>{statusIcon}</Text>
          <Text className={`text-sm ${statusColor} capitalize font-medium`}>
            Claim {claimData.status}
          </Text>
          {claimData.responseMessage && (
            <Text className="text-gray-600 text-sm">- {claimData.responseMessage}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderSystemMessage = () => {
    if (message.messageType !== 'system') return null;

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

    // Use the correct upload handler based on message type
    const uploadHandler = message.messageType === 'claim_request'
      ? handleClaimIdPhotoUpload
      : handleIdPhotoUpload;

    console.log('📷 Mobile opening photo modal for message type:', message.messageType);
    console.log('📷 Mobile using upload handler:', message.messageType === 'claim_request' ? 'handleClaimIdPhotoUpload' : 'handleIdPhotoUpload');

    return (
      <ImagePicker
        onImageSelect={uploadHandler}
        onClose={() => setShowIdPhotoModal(false)}
        isUploading={isUploadingIdPhoto}
      />
    );
  };

  return (
    <View className={`mb-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      {renderIdPhotoModal()}
      <View 
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isOwnMessage 
            ? 'bg-blue-500 rounded-br-md' 
            : 'bg-gray-200 rounded-bl-md'
        }`}
      >
        <Text 
          className={`text-base ${
            isOwnMessage ? 'text-white' : 'text-gray-800'
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
        <Text className="text-xs text-gray-500">
          {formatTime(message.timestamp)}
        </Text>
        
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
  const { conversationId: initialConversationId, postTitle, postId, postOwnerId, postOwnerUserData } = route.params;
  
  const { sendMessage, createConversation, getConversationMessages, getConversation, sendClaimRequest, updateClaimResponse, markConversationAsRead, getConversationUnreadCount } = useMessage();
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId || '');
  const [conversationData, setConversationData] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Check if handover button should be shown
  const shouldShowHandoverButton = () => {
    if (!userData || !postOwnerId) return false;
    
    // Don't show if current user is the post creator
    if (postOwnerId === userData.uid) return false;
    
    // Only show for lost items
    if (conversationData?.postType !== 'lost') return false;
    
    // Only show if post is still pending
    if (conversationData?.postStatus !== 'pending') return false;
    
    return true;
  };

  // Check if claim item button should be shown
  const shouldShowClaimItemButton = () => {
    if (!userData || !postOwnerId) {
      return false;
    }

    // Don't show if current user is the post creator
    if (postOwnerId === userData.uid) {
      return false;
    }

    // Only show for found items
    if (conversationData?.postType !== 'found') {
      return false;
    }

    // Only show if post is still pending
    if (conversationData?.postStatus !== 'pending') {
      return false;
    }

    // Only show if found action is "keep" or undefined (Found and Keep posts, or posts without explicit action)
    if (conversationData?.foundAction !== undefined && conversationData?.foundAction !== 'keep') {
      return false;
    }

    return true;
  };
  
  useEffect(() => {
    // If no conversation exists, create one immediately
    if (!conversationId && postId && postOwnerId && user && userData && !loading) {
      handleCreateConversation();
    }
  }, [postId, postOwnerId, user, userData, loading]);

  useEffect(() => {
    if (conversationId) {
      // Load messages for existing conversation
      const unsubscribe = getConversationMessages(conversationId, (loadedMessages) => {
        setMessages(loadedMessages);
        scrollToBottom();
      });
      
      // Fetch conversation data for handover button logic
      const fetchConversationData = async () => {
        try {
          const data = await getConversation(conversationId);
          setConversationData(data);
        } catch (error) {
          console.error('Failed to fetch conversation data:', error);
        }
      };
      
      fetchConversationData();
      
      // Mark conversation as read when user opens it
      if (userData?.uid) {
        markConversationAsRead(conversationId, userData.uid);
      }
      
      return () => unsubscribe();
    }
  }, [conversationId, getConversationMessages, getConversation]);

  if (!user || !userData) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Please log in to send messages</Text>
      </SafeAreaView>
    );
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCreateConversation = async () => {
    if (!postId || !postOwnerId) {
      Alert.alert('Error', 'Missing post information');
      return;
    }

    try {
      setLoading(true);
      const newConversationId = await createConversation(
        postId,
        postTitle,
        postOwnerId,
        user.uid,
        userData,
        postOwnerUserData // Pass the post owner's user data
      );
      setConversationId(newConversationId);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    try {
      await sendMessage(
        conversationId,
        user.uid,
        `${userData.firstName} ${userData.lastName}`,
        newMessage.trim(),
        userData.profilePicture
      );
      setNewMessage('');
      scrollToBottom();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleHandoverResponse = (messageId: string, status: 'accepted' | 'rejected') => {
    // This function will be called when a handover response is made
    // The actual update is handled in the MessageBubble component
    console.log(`Handover response: ${status} for message ${messageId}`);
  };

  const handleClaimResponse = (messageId: string, status: 'accepted' | 'rejected') => {
    // This function will be called when a claim response is made
    // The actual update is handled in the MessageBubble component
    console.log(`Claim response: ${status} for message ${messageId}`);
  };

  const handleHandoverRequest = async () => {
    if (!conversationId || !user || !userData) return;

    try {
      const { messageService } = await import('@/utils/firebase');
      await messageService.sendHandoverRequest(
        conversationId,
        user.uid,
        `${userData.firstName} ${userData.lastName}`,
        userData.profilePicture || '',
        conversationData?.postId || '',
        postTitle
      );
    } catch (error: any) {
      console.error('Failed to send handover request:', error);
      Alert.alert('Error', 'Failed to send handover request. Please try again.');
    }
  };

  const handleClaimRequest = async () => {
    console.log('Claim button pressed!');
    console.log('conversationId:', conversationId);
    console.log('user:', user);
    console.log('userData:', userData);
    console.log('postId:', postId);
    console.log('postTitle:', postTitle);

    if (!conversationId || !user || !userData) {
      console.log('Claim request blocked - missing required data');
      return;
    }

    // For now, mobile will send claim request without photos
    // TODO: Implement photo upload for mobile
    try {
      console.log('Calling sendClaimRequest...');
      await sendClaimRequest(
        conversationId,
        user!.uid,
        `${userData.firstName} ${userData.lastName}`,
        userData.profilePicture || '',
        postId,
        postTitle,
        'Claiming this item as my own', // Default claim reason
        '', // No ID photo for now
        [] // No evidence photos for now
      );
      console.log('Claim request sent successfully!');
      Alert.alert('Success', 'Claim request sent successfully!');
    } catch (error: any) {
      console.error('Failed to send claim request:', error);
      Alert.alert('Error', error.message || 'Failed to send claim request. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-10 pb-4 px-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-semibold text-lg text-gray-800" numberOfLines={1}>
              {postTitle}
            </Text>
            {/* Badge count for unread messages in this conversation */}
            {conversationId && userData?.uid && (
              (() => {
                const unreadCount = getConversationUnreadCount(conversationId, userData.uid);
                return unreadCount > 0 ? (
                  <View className="ml-2 bg-red-500 rounded-full min-w-[20px] h-[20px] items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                ) : null;
              })()
            )}
          </View>
          <Text className="text-sm text-gray-500">
            {postOwnerId && userData ? 
              (postOwnerId === userData.uid ? 'Your post' : 'Chat with post owner') : 
              'About this lost/found item'
            }
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
            onPress={() => {
              console.log('CLAIM BUTTON PRESSED ON MOBILE!');
              handleClaimRequest();
            }}
          >
            <Text className="text-white font-medium text-sm">Claim Item</Text>
          </TouchableOpacity>
        )}
        

      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Creating conversation...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-4">
              {loading ? "Setting up your conversation..." : `Start the conversation about "${postTitle}"`}
            </Text>
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
                currentUserId={user?.uid || ''}
                onHandoverResponse={handleHandoverResponse}
                onClaimResponse={handleClaimResponse}
              />
            )}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          />
        )}

        {/* Message Input */}
        <View className="border-t border-gray-200 bg-white p-4">
          <View className="flex-row items-center space-x-3">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={loading ? "Creating conversation..." : "Type a message..."}
              className={`flex-1 border border-gray-300 rounded-full px-4 py-3 text-base ${
                loading ? 'bg-gray-100' : 'bg-white'
              }`}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                newMessage.trim() && !loading 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              }`}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={newMessage.trim() && !loading ? 'white' : '#9CA3AF'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
