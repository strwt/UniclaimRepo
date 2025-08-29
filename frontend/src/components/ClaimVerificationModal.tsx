import React, { useState } from 'react';

interface ClaimVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (claimReason: string, idPhotoFile: File | null) => void;
  itemTitle: string;
  itemDescription?: string;
  isLoading?: boolean;
}

const ClaimVerificationModal: React.FC<ClaimVerificationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  itemTitle,
  itemDescription,
  isLoading = false
}) => {
  const [claimReason, setClaimReason] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB. Please choose a smaller image.');
        return;
      }
      
      setIdPhotoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setIdPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file (JPEG, PNG, etc.)');
    }
  };

  const removePhoto = () => {
    setIdPhotoFile(null);
    setIdPhotoPreview(null);
    // Reset the file input
    const fileInput = document.getElementById('idPhotoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmed && idPhotoFile) {
      onSubmit(claimReason, idPhotoFile);
    }
  };

  const handleClose = () => {
    setClaimReason('');
    setIsConfirmed(false);
    setIdPhotoFile(null);
    setIdPhotoPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Verify Claim Request
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please provide your ID photo and confirm the details before claiming this item
            </p>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Item Details */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Details
              </label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900">{itemTitle}</h4>
                {itemDescription && (
                  <p className="text-sm text-gray-600 mt-1">{itemDescription}</p>
                )}
              </div>
            </div>

            {/* ID Photo Upload - REQUIRED */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Photo <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Please upload a clear photo of your ID (Student ID, Driver's License, etc.) as proof of identity
              </p>
              
              {!idPhotoFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <input
                    id="idPhotoInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    required
                  />
                  <label htmlFor="idPhotoInput" className="cursor-pointer">
                    <div className="text-gray-600">
                      <div className="text-2xl mb-2">📷</div>
                      <div className="font-medium">Click to upload ID photo</div>
                      <div className="text-sm">JPEG, PNG up to 5MB</div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Selected ID Photo:</span>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {/* Photo Preview */}
                  <div className="mb-2">
                    <img
                      src={idPhotoPreview || ''}
                      alt="ID Photo Preview"
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <div>File: {idPhotoFile.name}</div>
                    <div>Size: {(idPhotoFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              )}
            </div>

            {/* Claim Reason */}
            <div className="mb-4">
              <label htmlFor="claimReason" className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to claim this item? (Optional)
              </label>
              <textarea
                id="claimReason"
                value={claimReason}
                onChange={(e) => setClaimReason(e.target.value)}
                placeholder="Briefly explain why you're claiming this item..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {claimReason.length}/200 characters
              </p>
            </div>

            {/* Confirmation Checkbox */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <span className="ml-2 text-sm text-gray-700">
                  I confirm that I want to claim this item and understand this is a claim request
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isConfirmed || !idPhotoFile || isLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </div>
                ) : (
                  'Send Claim Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClaimVerificationModal;

