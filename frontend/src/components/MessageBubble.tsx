import React, { useState } from 'react';
import type { Message } from '@/types/Post';
import ProfilePicture from './ProfilePicture';
import { useMessage } from '../context/MessageContext';
import ImagePicker from './ImagePicker';
import ImageModal from './ImageModal';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSenderName?: boolean;
  conversationId: string;
  currentUserId: string;
  onHandoverResponse?: (messageId: string, status: 'accepted' | 'rejected') => void;
  onClaimResponse?: (messageId: string, status: 'accepted' | 'rejected') => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showSenderName = false,
  conversationId,
  currentUserId,
  onHandoverResponse,
  onClaimResponse
}) => {
  const { deleteMessage, updateHandoverResponse, confirmHandoverIdPhoto, confirmClaimIdPhoto, updateClaimResponse } = useMessage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showIdPhotoModal, setShowIdPhotoModal] = useState(false);
  const [selectedIdPhoto, setSelectedIdPhoto] = useState<File | null>(null);
  const [isUploadingIdPhoto, setIsUploadingIdPhoto] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; altText: string } | null>(null);
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
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
      await updateHandoverResponse(conversationId, message.id, status);
      
      // Call the callback to update UI
      onHandoverResponse(message.id, status);
    } catch (error) {
      console.error('Failed to update handover response:', error);
    }
  };

  const handleIdPhotoUpload = async (photoFile: File) => {
    try {
      setIsUploadingIdPhoto(true);
      
      console.log('📸 Starting ID photo upload...', photoFile.name);
      
      // Upload ID photo to Cloudinary
      const { cloudinaryService } = await import('../utils/cloudinary');
      const uploadedUrl = await cloudinaryService.uploadImage(photoFile, 'id_photos');
      
      console.log('✅ ID photo uploaded successfully:', uploadedUrl);
      
      // Update handover response with ID photo
      const { messageService } = await import('../utils/firebase');
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
      alert('ID photo uploaded successfully! The item owner will now review and confirm.');
      
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
      
      alert('Upload Error: ' + errorMessage);
    } finally {
      setIsUploadingIdPhoto(false);
    }
  };

  const handleConfirmIdPhoto = async () => {
    try {
      await confirmHandoverIdPhoto(conversationId, message.id);
    } catch (error: any) {
      console.error('Failed to confirm ID photo:', error);
      alert('Failed to confirm ID photo. Please try again.');
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
      alert('Failed to update claim response. Please try again.');
    }
  };

  const handleClaimIdPhotoUpload = async (photoFile: File) => {
    try {
      setIsUploadingIdPhoto(true);

      console.log('📸 Starting claim ID photo upload...', photoFile.name);
      console.log('📸 Message type:', message.messageType);
      console.log('📸 Conversation ID:', conversationId);

      // Upload ID photo to Cloudinary
      const { cloudinaryService } = await import('../utils/cloudinary');
      const uploadedUrl = await cloudinaryService.uploadImage(photoFile, 'id_photos');

      console.log('✅ Claim ID photo uploaded successfully:', uploadedUrl);

      // Update claim response with verification photo
      const { messageService } = await import('../utils/firebase');
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
      alert('ID photo uploaded successfully! The post owner will now review and confirm your claim.');

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

      alert('Upload Error: ' + errorMessage);
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
      alert('Failed to confirm ID photo. Please try again.');
    }
  };

  const handleDeleteMessage = async () => {
    if (!isOwnMessage) return;
    
    try {
      setIsDeleting(true);
      await deleteMessage(conversationId, message.id);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      alert(`Failed to delete message: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle image click to open in modal
  const handleImageClick = (imageUrl: string, altText: string) => {
    setSelectedImage({ url: imageUrl, altText });
    setShowImageModal(true);
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
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800 mb-2">
          <strong>Handover Request:</strong> {handoverData.postTitle}
        </div>
        
        {/* Show ID photo if uploaded */}
        {handoverData.idPhotoUrl && (
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="text-xs text-gray-600 mb-1">Finder ID Photo:</div>
            <div className="relative">
              <img
                src={handoverData.idPhotoUrl}
                alt="Finder ID Photo"
                className="w-24 h-16 rounded object-cover cursor-pointer hover:opacity-90 transition-opacity group"
                onClick={() => handleImageClick(handoverData.idPhotoUrl!, 'Finder ID Photo')}
                title="Click to view full size"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded flex items-center justify-center pointer-events-none">
                <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                  Click to expand
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Click the photo to view full size
            </div>
          </div>
        )}

        {/* Show owner's ID photo if uploaded */}
        {handoverData.ownerIdPhotoUrl && (
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="text-xs text-gray-600 mb-1">Owner ID Photo:</div>
            <div className="relative">
              <img
                src={handoverData.ownerIdPhotoUrl}
                alt="Owner ID Photo"
                className="w-24 h-16 rounded object-cover cursor-pointer hover:opacity-90 transition-opacity group"
                onClick={() => handleImageClick(handoverData.ownerIdPhotoUrl!, 'Owner ID Photo')}
                title="Click to view full size"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded flex items-center justify-center pointer-events-none">
                <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                  Click to expand
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Click the photo to view full size
            </div>
          </div>
        )}

        {/* Show item photos if uploaded */}
        {handoverData.itemPhotos && handoverData.itemPhotos.length > 0 && (
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="text-xs text-gray-600 mb-1 font-medium">Item Photos:</div>
            <div className="grid grid-cols-1 gap-2">
              {handoverData.itemPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo.url}
                    alt={`Item Photo ${index + 1}`}
                    className="w-full h-32 rounded object-cover cursor-pointer hover:opacity-90 transition-opacity group"
                    onClick={() => handleImageClick(photo.url, `Item Photo ${index + 1}`)}
                    title="Click to view full size"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded flex items-center justify-center pointer-events-none">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                      Click to expand
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Item photo
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Click any photo to view full size
            </div>
          </div>
        )}

        {/* Action buttons */}
        {canRespond ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleHandoverResponse('accepted')}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleHandoverResponse('rejected')}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
            >
              Reject
            </button>
          </div>
        ) : canConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={handleConfirmIdPhoto}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            >
              Confirm ID Photo
            </button>
            <button
              onClick={() => handleHandoverResponse('rejected')}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
            >
              Reject Handover
            </button>
          </div>
        ) : (
          <div className="text-xs text-blue-600">
            Status: <span className="capitalize font-medium">{handoverData.status}</span>
            {isCompleted && handoverData.respondedAt && (
              <span className="ml-2">
                at {formatTime(handoverData.respondedAt)}
              </span>
            )}
            {handoverData.status === 'accepted' && handoverData.idPhotoConfirmed && (
              <span className="ml-2 text-green-600">
                ✓ ID Photo Confirmed
              </span>
            )}
            {handoverData.status === 'accepted' && handoverData.itemPhotosConfirmed && (
              <span className="ml-2 text-green-600">
                ✓ Item Photos Confirmed
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHandoverResponse = () => {
    if (message.messageType !== 'handover_response') return null;
    
    const handoverData = message.handoverData;
    if (!handoverData) return null;

    const statusColor = handoverData.status === 'accepted' ? 'text-green-600' : 'text-red-600';
    const statusIcon = handoverData.status === 'accepted' ? '✅' : '❌';

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className={`text-sm ${statusColor} flex items-center gap-2`}>
          <span>{statusIcon}</span>
          <span className="capitalize font-medium">{handoverData.status}</span>
          {handoverData.responseMessage && (
            <span className="text-gray-600">- {handoverData.responseMessage}</span>
          )}
        </div>
      </div>
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
      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-sm text-purple-800 mb-2">
          <strong>Claim Request:</strong> {claimData.postTitle}
        </div>

        {/* Show claim reason if provided */}
        {claimData.claimReason && (
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="text-xs text-gray-600 mb-1 font-medium">Claim Reason:</div>
            <div className="text-sm text-gray-800">{claimData.claimReason}</div>
          </div>
        )}

        {/* Show ID photo if uploaded */}
        {claimData.idPhotoUrl && (
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="text-xs text-gray-600 mb-1 font-medium">ID Photo:</div>
            <div className="relative">
              <img
                src={claimData.idPhotoUrl}
                alt="ID Photo"
                className="w-24 h-16 rounded object-cover cursor-pointer hover:opacity-90 transition-opacity group"
                onClick={() => handleImageClick(claimData.idPhotoUrl!, 'ID Photo')}
                title="Click to view full size"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded flex items-center justify-center pointer-events-none">
                <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                  Click to expand
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Click the photo to view full size
            </div>
          </div>
        )}

        {/* Show evidence photos if uploaded */}
        {claimData.evidencePhotos && claimData.evidencePhotos.length > 0 && (
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="text-xs text-gray-600 mb-1 font-medium">Evidence Photos:</div>
            <div className="grid grid-cols-1 gap-2">
              {claimData.evidencePhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo.url}
                    alt={`Evidence Photo ${index + 1}`}
                    className="w-full h-32 rounded object-cover cursor-pointer hover:opacity-90 transition-opacity group"
                    onClick={() => handleImageClick(photo.url, `Evidence Photo ${index + 1}`)}
                    title="Click to view full size"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded flex items-center justify-center pointer-events-none">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                      Click to expand
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Evidence photo
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Click any photo to view full size
            </div>
          </div>
        )}

        {/* Show legacy verification photos if exists (for backward compatibility) */}
        {claimData.verificationPhotos && claimData.verificationPhotos.length > 0 && !claimData.evidencePhotos && (
          <div className="mb-3 p-2 bg-white rounded border">
            <div className="text-xs text-gray-600 mb-1 font-medium">Verification Photos:</div>
            <div className="grid grid-cols-1 gap-2">
              {claimData.verificationPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo.url}
                    alt={`Verification Photo ${index + 1}`}
                    className="w-full h-32 rounded object-cover cursor-pointer hover:opacity-90 transition-opacity group"
                    onClick={() => handleImageClick(photo.url, `Verification Photo ${index + 1}`)}
                    title="Click to view full size"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded flex items-center justify-center pointer-events-none">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                      Click to expand
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Verification photo
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Click any photo to view full size
            </div>
          </div>
        )}

        {/* Action buttons */}
        {canRespond ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleClaimResponse('accepted')}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
            >
              Accept Claim
            </button>
            <button
              onClick={() => handleClaimResponse('rejected')}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
            >
              Reject Claim
            </button>
          </div>
        ) : canConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={handleConfirmClaimIdPhoto}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            >
              Confirm ID Photo
            </button>
          </div>
        ) : (
          <div className="text-xs text-purple-600">
            Status: <span className="capitalize font-medium">{claimData.status}</span>
            {isCompleted && claimData.respondedAt && (
              <span className="ml-2">
                at {formatTime(claimData.respondedAt)}
              </span>
            )}
            {claimData.status === 'accepted' && claimData.evidencePhotosConfirmed && (
              <span className="ml-2 text-green-600">
                ✓ Evidence Photos Confirmed
              </span>
            )}
            {claimData.status === 'accepted' && claimData.idPhotoConfirmed && !claimData.evidencePhotosConfirmed && (
              <span className="ml-2 text-green-600">
                ✓ ID Photo Confirmed
              </span>
            )}
            {claimData.status === 'accepted' && claimData.photosConfirmed && !claimData.evidencePhotosConfirmed && (
              <span className="ml-2 text-green-600">
                ✓ Verification Photos Confirmed
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderClaimResponse = () => {
    if (message.messageType !== 'claim_response') return null;

    const claimData = message.claimData;
    if (!claimData) return null;

    const statusColor = claimData.status === 'accepted' ? 'text-green-600' : 'text-red-600';
    const statusIcon = claimData.status === 'accepted' ? '✅' : '❌';

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className={`text-sm ${statusColor} flex items-center gap-2`}>
          <span>{statusIcon}</span>
          <span className="capitalize font-medium">Claim {claimData.status}</span>
          {claimData.responseMessage && (
            <span className="text-gray-600">- {claimData.responseMessage}</span>
          )}
        </div>
      </div>
    );
  };

  const renderSystemMessage = () => {
    if (message.messageType !== 'system') return null;

    return (
      <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-sm text-yellow-800">
          <span className="font-medium">System:</span> {message.text}
        </div>
      </div>
    );
  };

  // ID Photo Modal using ImagePicker component
  const renderIdPhotoModal = () => {
    if (!showIdPhotoModal) return null;

    // Use the correct upload handler based on message type
    const uploadHandler = message.messageType === 'claim_request'
      ? handleClaimIdPhotoUpload
      : handleIdPhotoUpload;

    console.log('📷 Opening photo modal for message type:', message.messageType);
    console.log('📷 Using upload handler:', message.messageType === 'claim_request' ? 'handleClaimIdPhotoUpload' : 'handleIdPhotoUpload');

    return (
      <ImagePicker
        onImageSelect={uploadHandler}
        onClose={() => setShowIdPhotoModal(false)}
        isUploading={isUploadingIdPhoto}
      />
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      {renderIdPhotoModal()}
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
          
          {/* Render special message types */}
          {renderHandoverRequest()}
          {renderHandoverResponse()}
          {renderClaimRequest()}
          {renderClaimResponse()}
          {renderSystemMessage()}
        </div>
        
        <div className={`text-xs text-gray-400 mt-1 ${
          isOwnMessage ? 'text-right mr-2' : 'ml-2'
        }`}>
          <div className="flex items-center justify-between">
            <div>
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
            
            {/* Delete button for own messages */}
            {isOwnMessage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                title="Delete message"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        
        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Message?</h3>
              <p className="text-gray-600 mb-4">This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMessage}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <ImageModal
            imageUrl={selectedImage.url}
            altText={selectedImage.altText}
            onClose={() => {
              setShowImageModal(false);
              setSelectedImage(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
