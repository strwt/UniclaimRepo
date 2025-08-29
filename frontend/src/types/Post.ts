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
    // New fields for ID photo verification
    idPhotoUrl?: string; // URL of the uploaded ID photo
    idPhotoConfirmed?: boolean; // Whether the item owner confirmed the ID photo
    idPhotoConfirmedAt?: any; // When the ID photo was confirmed
    idPhotoConfirmedBy?: string; // User ID who confirmed the ID photo
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
    // New fields for ID photo verification
    idPhotoUrl?: string; // URL of the uploaded ID photo
    idPhotoConfirmed?: boolean; // Whether the item owner confirmed the ID photo
    idPhotoConfirmedAt?: any; // When the ID photo was confirmed
    idPhotoConfirmedBy?: string; // User ID who confirmed the ID photo
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
