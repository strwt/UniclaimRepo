import React from 'react';
import type { Post } from '@/types/Post';

interface HandoverDetailsDisplayProps {
  handoverDetails: Post['handoverDetails'];
}

const HandoverDetailsDisplay: React.FC<HandoverDetailsDisplayProps> = ({ handoverDetails }) => {
  if (!handoverDetails) return null;

  const formatDateTime = (datetime: any) => {
    if (!datetime) return 'N/A';
    
    try {
      const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
      
      // Handle Firebase Timestamp
      if (datetime && typeof datetime === 'object' && 'seconds' in datetime) {
        const firebaseDate = new Date(datetime.seconds * 1000);
        return firebaseDate.toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      }
      
      return date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h3 className="text-sm font-semibold text-green-800">
          ✅ Item Successfully Handed Over
        </h3>
      </div>
      
      <div className="space-y-3">
        {/* Handover Person Information */}
        <div className="bg-white p-3 rounded border">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Handed Over By:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 font-medium text-gray-800">
                {handoverDetails.handoverPersonName}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Contact:</span>
              <span className="ml-2 font-medium text-gray-800">
                {handoverDetails.handoverPersonContact}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Student ID:</span>
              <span className="ml-2 font-medium text-gray-800">
                {handoverDetails.handoverPersonStudentId}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium text-gray-800">
                {handoverDetails.handoverPersonEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Handover Photos */}
        {handoverDetails.handoverItemPhotos && handoverDetails.handoverItemPhotos.length > 0 && (
          <div className="bg-white p-3 rounded border">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Item Photos During Handover:
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {handoverDetails.handoverItemPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo.url}
                    alt={`Handover item photo ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  {photo.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                      {photo.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ID Photos */}
        <div className="bg-white p-3 rounded border">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Verification Photos:
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Handover Person ID:</p>
              <img
                src={handoverDetails.handoverIdPhoto}
                alt="Handover person ID"
                className="w-full h-24 object-cover rounded border"
              />
            </div>
            {handoverDetails.ownerIdPhoto && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Owner ID:</p>
                <img
                  src={handoverDetails.ownerIdPhoto}
                  alt="Owner ID"
                  className="w-full h-24 object-cover rounded border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Details */}
        <div className="bg-white p-3 rounded border">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Handover Confirmation:
          </h4>
          <div className="text-xs text-gray-600">
            <p>Confirmed on: {formatDateTime(handoverDetails.handoverConfirmedAt)}</p>
            <p>Confirmed by: {handoverDetails.handoverConfirmedBy}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoverDetailsDisplay;
