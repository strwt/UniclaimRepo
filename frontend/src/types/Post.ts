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
    profilePicture?: string;
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
}

export interface Conversation {
  id: string;
  postId: string;
  postTitle: string;
  participants: {
    [userId: string]: {
      uid: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      joinedAt: any;
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
  };
  createdAt: any;
  unreadCount?: number;
}
