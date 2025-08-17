# Messaging System Setup & Usage

## Overview
The messaging system allows users to chat about lost and found items. Users can start conversations from post cards and chat in real-time using Firebase Firestore.

## Features
- ✅ Real-time messaging using Firebase Firestore
- ✅ Conversation management
- ✅ Message history
- ✅ Unread message indicators
- ✅ Mobile-responsive design
- ✅ Start conversations from post cards

## Components Created

### 1. ConversationList
- Displays all user conversations
- Shows last message preview
- Unread message count badges
- Click to select conversation

### 2. MessageBubble
- Individual message display
- Different styling for sent vs received messages
- Timestamp and read status
- Sender name for group chats

### 3. ChatWindow
- Main chat interface
- Message input and send functionality
- Auto-scroll to latest messages
- Loading states

### 4. MessagesPage
- Main messaging page at `/messages`
- Combines conversation list and chat window
- Mobile-responsive overlay for chat

## How It Works

### Starting a Conversation
1. User sees a post card with "Start Conversation" button
2. Clicking the button creates a new conversation
3. User is redirected to `/messages` page
4. Conversation appears in the list

### Sending Messages
1. Select a conversation from the left sidebar
2. Type message in the input field
3. Click "Send" or press Enter
4. Message appears instantly (real-time)

### Real-time Updates
- Uses Firebase `onSnapshot` for live updates
- Messages appear without page refresh
- Conversation list updates automatically

## Firebase Structure

### Collections
- `conversations` - Main conversation documents
- `conversations/{id}/messages` - Messages subcollection

### Conversation Document
```typescript
{
  id: string;
  postId: string;
  postTitle: string;
  participants: {
    [userId]: {
      uid: string;
      firstName: string;
      lastName: string;
      joinedAt: timestamp;
    }
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: timestamp;
  };
  createdAt: timestamp;
  unreadCount?: number;
}
```

### Message Document
```typescript
{
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: timestamp;
  readBy: string[];
}
```

## Usage

### For Users
1. Navigate to `/messages` from the sidebar
2. Click "Start Conversation" on any post card
3. Chat with other users about lost/found items

### For Developers
- All messaging logic is in `MessageContext`
- Firebase service functions in `firebase.ts`
- Components are reusable and well-typed

## Security
- Only conversation participants can see messages
- User authentication required
- Firestore security rules should restrict access

## Future Enhancements
- [ ] Typing indicators
- [ ] File/image sharing
- [ ] Push notifications
- [ ] Message search
- [ ] Message reactions
- [ ] Online/offline status

## Troubleshooting

### Common Issues
1. **Messages not loading**: Check Firebase connection and auth
2. **Conversations not appearing**: Verify user is logged in
3. **Real-time not working**: Check Firestore rules and indexes

### Required Firebase Indexes
- `conversations` collection: `participants.{userId}` (for user conversations)
- `messages` subcollection: `timestamp` (for message ordering)

## Testing
1. Create a test post
2. Start conversation from another account
3. Send messages back and forth
4. Verify real-time updates work
5. Test mobile responsiveness
