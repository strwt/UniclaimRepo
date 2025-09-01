import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  onClaimResponse,
  onConfirmIdPhotoSuccess,
  onMessageSeen
}: {
  message: Message;
  isOwnMessage: boolean;
  conversationId: string;
  currentUserId: string;
  onHandoverResponse?: (messageId: string, status: 'accepted' | 'rejected') => void;
  onClaimResponse?: (messageId: string, status: 'accepted' | 'rejected') => void;
  onConfirmIdPhotoSuccess?: (messageId: string) => void;
  onMessageSeen?: () => void;
}) => {
  const { deleteMessage, confirmHandoverIdPhoto, confirmClaimIdPhoto, updateClaimResponse } = useMessage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showIdPhotoModal, setShowIdPhotoModal] = useState(false);
  const [selectedIdPhoto, setSelectedIdPhoto] = useState<string | null>(null);
  const [isUploadingIdPhoto, setIsUploadingIdPhoto] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // For mobile, visibility detection is handled by FlatList's onViewableItemsChanged
  // This component just provides the callback interface

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
      
      // Call the success callback for navigation
      onConfirmIdPhotoSuccess?.(message.id);
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
    const canConfirm = handoverData.status === 'pending_confirmation' && postOwnerId === user?.uid;
    const isCompleted = handoverData.status === 'accepted' || handoverData.status === 'rejected';

    return (
      <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Text className="text-sm text-blue-800 mb-2">
          <Text className="font-bold">Handover Request:</Text> {handoverData.postTitle}
        </Text>
        
        {/* Show ID photo if uploaded */}
        {handoverData.idPhotoUrl && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">Finder ID Photo:</Text>
            <TouchableOpacity
              onPress={() => {
                if (handoverData.idPhotoUrl) {
                  // For mobile, we'll use a simple alert with option to view
                  Alert.alert(
                    'View Finder ID Photo',
                    'Would you like to view the full-size finder ID photo?',
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

        {/* Show owner's ID photo if uploaded */}
        {handoverData.ownerIdPhotoUrl && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">Owner ID Photo:</Text>
            <TouchableOpacity
              onPress={() => {
                if (handoverData.ownerIdPhotoUrl) {
                  // For mobile, we'll use a simple alert with option to view
                  Alert.alert(
                    'View Owner ID Photo',
                    'Would you like to view the full-size owner ID photo?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'View Full Size',
                        onPress: () => {
                          // Open in device's default image viewer
                          if (handoverData.ownerIdPhotoUrl) {
                            Linking.openURL(handoverData.ownerIdPhotoUrl);
                          }
                        }
                      }
                    ]
                  );
                }
              }}
            >
              <Image
                source={{ uri: handoverData.ownerIdPhotoUrl }}
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
            <TouchableOpacity
              onPress={() => handleHandoverResponse('rejected')}
              className="px-3 py-1 bg-red-500 rounded-md"
            >
              <Text className="text-white text-xs">Reject Handover</Text>
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

        {/* Show claim reason if provided */}
        {claimData.claimReason && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1 font-medium">Claim Reason:</Text>
            <Text className="text-sm text-gray-800">{claimData.claimReason}</Text>
          </View>
        )}

        {/* Show claimer's ID photo if uploaded */}
        {claimData.idPhotoUrl && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1">Claimer ID Photo:</Text>
            <TouchableOpacity
              onPress={() => {
                if (claimData.idPhotoUrl) {
                  // For mobile, we'll use a simple alert with option to view
                  Alert.alert(
                    'View Claimer ID Photo',
                    'Would you like to view the full-size claimer ID photo?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'View Full Size',
                        onPress: () => {
                          // Open in device's default image viewer
                          if (claimData.idPhotoUrl) {
                            Linking.openURL(claimData.idPhotoUrl);
                          }
                        }
                      }
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
                    'View Owner ID Photo',
                    'Would you like to view the full-size owner ID photo?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'View Full Size',
                        onPress: () => {
                          // Open in device's default image viewer
                          if (claimData.ownerIdPhoto) {
                            Linking.openURL(claimData.ownerIdPhoto);
                          }
                        }
                      }
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
            <Text className="text-xs text-gray-600 mb-1 font-medium">Evidence Photos:</Text>
            <View className="gap-2">
              {claimData.evidencePhotos.map((photo, index) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        `View Evidence Photo ${index + 1}`,
                        'Would you like to view the full-size evidence photo?',
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
        {claimData.verificationPhotos && claimData.verificationPhotos.length > 0 && !claimData.evidencePhotos && (
          <View className="mb-3 p-2 bg-white rounded border">
            <Text className="text-xs text-gray-600 mb-1 font-medium">Verification Photos:</Text>
            <View className="gap-2">
              {claimData.verificationPhotos.map((photo, index) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        `View Verification Photo ${index + 1}`,
                        'Would you like to view the full-size verification photo?',
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
            <TouchableOpacity
              onPress={() => handleClaimResponse('rejected')}
              className="px-3 py-1 bg-red-500 rounded-md"
            >
              <Text className="text-white text-xs">Reject Claim</Text>
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
            {claimData.status === 'accepted' && claimData.evidencePhotosConfirmed && (
              <Text className="ml-2 text-green-600">
                ✓ Evidence Photos Confirmed
              </Text>
            )}
            {claimData.status === 'accepted' && claimData.idPhotoConfirmed && !claimData.evidencePhotosConfirmed && (
              <Text className="ml-2 text-green-600">
                ✓ ID Photo Confirmed
              </Text>
            )}
            {claimData.status === 'accepted' && claimData.photosConfirmed && !claimData.evidencePhotosConfirmed && (
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
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </Text>
          {isOwnMessage && (
            <View>
              {message.readBy && message.readBy.length > 1 ? (
                <Ionicons 
                  name="eye" 
                  size={12} 
                  color="#3b82f6" 
                />
              ) : (
                <Ionicons 
                  name="checkmark" 
                  size={12} 
                  color="#9ca3af" 
                />
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
  const { conversationId: initialConversationId, postTitle, postId, postOwnerId, postOwnerUserData } = route.params;
  
  const { sendMessage, createConversation, getConversationMessages, getOlderMessages, getConversation, sendClaimRequest, updateClaimResponse, markConversationAsRead, markMessageAsRead, markAllUnreadMessagesAsRead, getConversationUnreadCount } = useMessage();
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId || '');
  const [conversationData, setConversationData] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const [viewableMessages, setViewableMessages] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
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
      // Load initial messages with pagination (limit to 50 messages)
      const unsubscribe = getConversationMessages(conversationId, (loadedMessages) => {
        setMessages(loadedMessages);
        setIsInitialLoad(false);
        
        // If we got fewer messages than the limit, there are no more messages
        if (loadedMessages.length < 50) {
          setHasMoreMessages(false);
        }
        
        // Only scroll to bottom on initial load
        if (isInitialLoad) {
          scrollToBottom();
        }
      }, 50);
      
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

              // Mark all unread messages as read when conversation is opened
        if (userData?.uid && (conversationData?.postType === 'lost' || conversationData?.postType === 'found')) {
          markAllUnreadMessagesAsRead(conversationId, userData.uid);
        }
      
      return () => unsubscribe();
    }
  }, [conversationId, getConversationMessages, getConversation, isInitialLoad, conversationData, markAllUnreadMessagesAsRead, markConversationAsRead]);

  // Mark conversation as read when new messages arrive while user is viewing
  useEffect(() => {
    if (!conversationId || !userData?.uid || !messages.length) return;

    // Mark conversation as read since user is actively viewing it
    markConversationAsRead(conversationId, userData.uid);
  }, [messages, conversationId, userData, markConversationAsRead]);

  // Function to mark message as read when it comes into view
  const handleMessageSeen = async (messageId: string) => {
    if (!conversationId || !userData?.uid) return;
    
    try {
      await markMessageAsRead(conversationId, messageId);
    } catch (error) {
      console.warn('Mobile: Failed to mark message as read:', error);
    }
  };

  // Handle viewable items changed to mark messages as read
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (!conversationId || !userData?.uid) return;

    const newViewableMessageIds = new Set(viewableItems.map(item => item.key));
    
    // Mark messages as read that are now viewable and not sent by current user
    viewableItems.forEach(item => {
      const message = item.item;
      if (message && message.senderId !== userData.uid && !viewableMessages.has(message.id)) {
        handleMessageSeen(message.id);
      }
    });
    
    setViewableMessages(newViewableMessageIds);
  }, [conversationId, userData, viewableMessages, handleMessageSeen]);

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

  const scrollToBottomOnNewMessage = () => {
    // Only scroll to bottom if we're not loading older messages
    if (!isLoadingOlderMessages) {
      scrollToBottom();
    }
  };

  const loadOlderMessages = async () => {
    if (isLoadingOlderMessages || !hasMoreMessages || messages.length === 0) return;

    try {
      setIsLoadingOlderMessages(true);
      
      // Get the timestamp of the oldest message
      const oldestMessage = messages[0];
      if (!oldestMessage?.timestamp) return;

      // Load older messages
      const olderMessages = await getOlderMessages(conversationId, oldestMessage.timestamp, 20);
      
      if (olderMessages.length > 0) {
        // Prepend older messages to the current messages
        setMessages(prevMessages => [...olderMessages, ...prevMessages]);
        
        // If we got fewer messages than requested, there are no more
        if (olderMessages.length < 20) {
          setHasMoreMessages(false);
        }
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Failed to load older messages:', error);
    } finally {
      setIsLoadingOlderMessages(false);
    }
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
      scrollToBottomOnNewMessage();
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

  const handleConfirmIdPhotoSuccess = (messageId: string) => {
    // Show success message and redirect to conversation list
    Alert.alert(
      'Success',
      '✅ ID photo confirmed successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to Message screen (conversation list)
            navigation.navigate('Message');
          }
        }
      ]
    );
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

    // Navigate to claim form screen
    navigation.navigate('ClaimFormScreen' as never, {
      conversationId,
      postId,
      postTitle,
      postOwnerId,
    } as never);
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
                onConfirmIdPhotoSuccess={handleConfirmIdPhotoSuccess}
                onMessageSeen={() => handleMessageSeen(item.id)}
              />
            )}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottomOnNewMessage}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50,
              minimumViewTime: 100,
            }}
            // Pagination: Load older messages when scrolling to top
            onEndReached={loadOlderMessages}
            onEndReachedThreshold={0.1}
            // Show loading indicator at top when loading older messages
            ListHeaderComponent={
              isLoadingOlderMessages ? (
                <View className="py-4 items-center">
                  <Text className="text-gray-500 text-sm">Loading older messages...</Text>
                </View>
              ) : null
            }
            // Show message when no more messages to load
            ListFooterComponent={
              !hasMoreMessages && messages.length > 0 ? (
                <View className="py-4 items-center">
                  <Text className="text-gray-400 text-xs">No more messages</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Message Input */}
        <View className="border-t border-gray-200 bg-white p-4">
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 relative">
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder={loading ? "Creating conversation..." : "Type a message..."}
                className={`border rounded-full px-4 py-3 text-base ${
                  loading ? 'bg-gray-100' : 'bg-white'
                } ${
                  newMessage.length > 180 
                    ? newMessage.length >= 200 
                      ? 'border-red-300' 
                      : 'border-yellow-300'
                    : 'border-gray-300'
                }`}
                multiline
                maxLength={200}
                editable={!loading}
              />
              <View className="absolute bottom-1 right-3">
                <Text className={`text-xs ${
                  newMessage.length > 180 
                    ? newMessage.length >= 200 
                      ? 'text-red-500' 
                      : 'text-yellow-500'
                    : 'text-gray-400'
                }`}>
                  {newMessage.length}/200
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || loading || newMessage.length > 200}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                newMessage.trim() && !loading && newMessage.length <= 200
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              }`}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={newMessage.trim() && !loading && newMessage.length <= 200 ? 'white' : '#9CA3AF'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
