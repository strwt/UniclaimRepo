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
  };
  createdAt?: string | Date | any; // Firebase timestamp or Date
  updatedAt?: string | Date | any; // Firebase timestamp or Date
  status?: "pending" | "resolved" | "rejected";
  foundAction?: "keep" | "turnover to OSA" | "turnover to Campus Security"; // For found items
  dateTime?: string; // When the item was lost/found
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
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
