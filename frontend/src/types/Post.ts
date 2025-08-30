export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  type: "lost" | "found";
  coordinates?: { lat: number; lng: number };
  images: (string | File)[];
  creatorId: string; // Add this field to identify the post creator
  postedById?: string; // User ID of the poster for messaging (for backward compatibility)
  user: {
    firstName: string;
    lastName: string;
    email: string;
    contactNum: string;
    studentId: string;
    profilePicture?: string | null;
    profileImageUrl?: string;
  };
  createdAt?: string | Date | any; // Firebase timestamp or Date
  updatedAt?: string | Date | any; // Firebase timestamp or Date
  status?: "pending" | "resolved" | "rejected";
  foundAction?: "keep" | "turnover to OSA" | "turnover to Campus Security"; // For found items
  dateTime?: string; // When the item was lost/found
  // New fields for 30-day lifecycle system
  expiryDate?: string | Date | any; // When the post expires (30 days from creation)
  isExpired?: boolean; // Boolean flag for quick filtering
  movedToUnclaimed?: boolean; // Boolean flag to track if moved to unclaimed
  originalStatus?: "pending" | "resolved" | "rejected"; // Store the original status before moving to unclaimed

  // New fields for handover details (when ID photo is confirmed)
  handoverDetails?: {
    handoverPersonName: string; // Full name of person who handed over
    handoverPersonContact: string; // Contact number of person who handed over
    handoverPersonStudentId: string; // Student ID of person who handed over
    handoverPersonEmail: string; // Email of person who handed over
    handoverItemPhotos: {
      url: string;
      uploadedAt: any;
      description?: string;
    }[]; // Photos of the item during handover
    handoverIdPhoto: string; // ID photo of person who handed over
    ownerIdPhoto: string; // ID photo of the item owner
    handoverConfirmedAt: any; // When the handover was confirmed
    handoverConfirmedBy: string; // User ID who confirmed the handover
  };
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  text: string;
  timestamp: any; // Firebase timestamp
  readBy: string[];
  // New fields for message types
  messageType?: "text" | "handover_request" | "handover_response" | "claim_request" | "claim_response" | "system";
  // Fields for handover requests
  handoverData?: {
    postId: string;
    postTitle: string;
    status: "pending" | "accepted" | "rejected" | "pending_confirmation";
    requestedAt: any;
    respondedAt?: any;
    responseMessage?: string;
    handoverReason?: string; // Reason for handover request
    // New fields for ID photo verification
    idPhotoUrl?: string; // URL of the uploaded ID photo
    idPhotoConfirmed?: boolean; // Whether the item owner confirmed the ID photo
    idPhotoConfirmedAt?: any; // When the ID photo was confirmed
    idPhotoConfirmedBy?: string; // User ID who confirmed the ID photo
    // Item photos for handover verification (REQUIRED - up to 3)
    itemPhotos?: {
      url: string;
      uploadedAt: any;
      description?: string;
    }[];
    itemPhotosConfirmed?: boolean; // Whether the item owner confirmed the item photos
    itemPhotosConfirmedAt?: any; // When the item photos were confirmed
    itemPhotosConfirmedBy?: string; // User ID who confirmed the item photos
    // New field for owner ID photo during handover verification
    ownerIdPhoto?: string; // ID photo of the item owner for verification
  };
  // Fields for claim requests
  claimData?: {
    postId: string;
    postTitle: string;
    status: "pending" | "accepted" | "rejected" | "pending_confirmation";
    requestedAt: any;
    respondedAt?: any;
    responseMessage?: string;
    claimReason?: string; // New field for claim reason
    // ID photo for identity verification (REQUIRED)
    idPhotoUrl?: string; // URL of the uploaded ID photo
    idPhotoConfirmed?: boolean; // Whether the item owner confirmed the ID photo
    idPhotoConfirmedAt?: any; // When the ID photo was confirmed
    idPhotoConfirmedBy?: string; // User ID who confirmed the ID photo
    // Evidence photos for ownership proof (REQUIRED - up to 3)
    evidencePhotos?: {
      url: string;
      uploadedAt: any;
      description?: string;
    }[];
    evidencePhotosConfirmed?: boolean; // Whether the item owner confirmed the evidence photos
    evidencePhotosConfirmedAt?: any; // When the evidence photos were confirmed
    evidencePhotosConfirmedBy?: string; // User ID who confirmed the evidence photos
    // Legacy field for backward compatibility
    verificationPhotos?: {
      url: string;
      uploadedAt: any;
      description?: string;
    }[];
    photosConfirmed?: boolean; // Whether the item owner confirmed the verification photos
    photosConfirmedAt?: any; // When the photos were confirmed
    photosConfirmedBy?: string; // User ID who confirmed the verification photos
  };
}

export interface Conversation {
  id: string;
  postId: string;
  postTitle: string;
  // New fields for handover button functionality
  postType: "lost" | "found";
  postStatus?: "pending" | "resolved" | "rejected";
  postCreatorId: string;
  foundAction?: "keep" | "turnover to OSA" | "turnover to Campus Security"; // For found items
  participants: {
    [userId: string]: {
      uid: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      profileImageUrl?: string;
      joinedAt: any;
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
  };
  createdAt: any;
  // Replace global unreadCount with user-specific counts
  unreadCounts: {
    [userId: string]: number;
  };
  // New field for handover request limit
  handoverRequested?: boolean;
  // New field for claim request limit
  claimRequested?: boolean;
}
