export type RootStackParamList = {
  Index: undefined;
  OnBoarding: undefined;
  App: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Report: undefined;
  Profile: undefined;
  MyTicket: undefined;
  Message: undefined;
  Chat: { conversationId?: string; postTitle: string; postId?: string; postOwnerId?: string };
  RootBottomTabs: undefined;
  InitialRouter: undefined;
  ItemDetails: undefined;
  PostDetails: { post: Post }; // ✅ FIXED: added param to the screen
  USTPMapScreen: {
    setCoordinatesFromMap: (coords: { lat: number; lng: number }) => void;
  };
};
export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  type: "lost" | "found";
  coordinates?: { lat: number; lng: number };
  images: (string | File)[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    contactNum: string;
  };
  createdAt?: string | Date | any; // Firebase timestamp or Date
  updatedAt?: string | Date | any; // Firebase timestamp or Date
  status?: "pending" | "resolved" | "rejected";
  foundAction?: "keep" | "turnover to OSA" | "turnover to Campus Security"; // For found items
  dateTime?: string; // When the item was lost/found
  postedBy?: string; // For backward compatibility
  postedById?: string; // User ID of the poster for messaging
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
