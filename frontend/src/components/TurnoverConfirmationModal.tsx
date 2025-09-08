import React, { useState } from "react";
import { FiX, FiCheck, FiXCircle } from "react-icons/fi";
import type { Post } from "@/types/Post";

interface TurnoverConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: "confirmed" | "not_received", notes?: string) => void;
  post: Post | null;
  confirmationType: "confirmed" | "not_received" | null;
}

export default function TurnoverConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  post,
  confirmationType
}: TurnoverConfirmationModalProps) {
  const [notes, setNotes] = useState("");

  if (!isOpen || !post || !confirmationType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(confirmationType, notes.trim() || undefined);
    setNotes("");
    onClose();
  };

  const handleCancel = () => {
    setNotes("");
    onClose();
  };

  const isConfirming = confirmationType === "confirmed";
  const title = isConfirming ? "Confirm Item Receipt" : "Mark Item as Not Received";
  const description = isConfirming 
    ? "Please confirm that you have received this item from the finder. You can add notes about the item condition below."
    : "Please confirm that you have not received this item from the finder. You can add notes explaining why below.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isConfirming ? (
              <FiCheck className="text-xl text-green-600" />
            ) : (
              <FiXCircle className="text-xl text-red-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-800">
              {title}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Post Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">{post.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{post.description}</p>
          <div className="text-sm text-gray-500">
            <p><span className="font-medium">Finder:</span> {post.turnoverDetails?.originalFinder.firstName} {post.turnoverDetails?.originalFinder.lastName}</p>
            <p><span className="font-medium">Student ID:</span> {post.turnoverDetails?.originalFinder.studentId}</p>
            <p><span className="font-medium">Turnover to:</span> {post.turnoverDetails?.turnoverAction === "turnover to OSA" ? "OSA" : "Campus Security"}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          {description}
        </p>

        {/* Notes Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {isConfirming ? "Item Condition Notes (Optional)" : "Reason Notes (Optional)"}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isConfirming 
                ? "e.g., Item is in good condition, minor scratches on case..."
                : "e.g., Finder did not show up, item was damaged..."
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                isConfirming 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isConfirming ? "Confirm Receipt" : "Mark Not Received"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
