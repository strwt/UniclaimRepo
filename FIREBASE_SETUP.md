# Firebase Setup Guide for Lost and Found App

This guide explains how to set up Firebase for the Lost and Found application and use the implemented report functionality.

## 🚀 Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication, Firestore, and Storage

### 2. Environment Variables

#### Frontend (.env)
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

#### Mobile (.env)
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. Firebase Security Rules

Deploy the provided security rules:

#### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

#### Storage Rules
```bash
firebase deploy --only storage
```

## 📱 Features Implemented

### ✅ Post Creation Service
- **Location**: `frontend/src/utils/firebase.ts` & `mobile/utils/firebase.ts`
- **Function**: `postService.createPost()`
- **Features**:
  - Image upload to Firebase Storage
  - Automatic post ID generation
  - Data validation
  - Error handling

### ✅ Real-time Data Sync
- **Hooks**: `frontend/src/hooks/usePosts.ts` & `mobile/hooks/usePosts.ts`
- **Features**:
  - Real-time post updates
  - Filter by type (lost/found)
  - Filter by category
  - User-specific posts

### ✅ Image Upload Service
- **Service**: `imageService`
- **Features**:
  - Multiple image upload
  - Automatic compression (mobile)
  - Storage management
  - URL generation

### ✅ Form Validation
- **Frontend**: Enhanced ReportPage with Firebase integration
- **Mobile**: Complete form validation with error handling
- **Features**:
  - Required field validation
  - Image requirement
  - User authentication check

### ✅ Type Consistency
- **Updated**: Post interfaces in both platforms
- **Features**:
  - Consistent data structure
  - Firebase timestamp support
  - Enhanced metadata fields

## 🔧 Usage Examples

### Creating a Post (Frontend)
```typescript
import { postService } from '../utils/firebase';
import type { Post } from '../types/Post';

const createPost = async (postData: Omit<Post, 'id' | 'createdAt'>) => {
  try {
    const postId = await postService.createPost(postData);
    console.log('Post created:', postId);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Real-time Posts (React Hook)
```typescript
import { usePosts } from '../hooks/usePosts';

const HomePage = () => {
  const { posts, loading, error } = usePosts();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};
```

### Creating a Post (Mobile)
```typescript
import { postService } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';

const submitReport = async () => {
  const { userData } = useAuth();
  
  const postData = {
    title: "Lost Wallet",
    description: "Black leather wallet",
    category: "Personal Belongings",
    location: "Library",
    type: "lost" as const,
    images: ["file://image1.jpg"],
    user: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      contactNum: userData.contactNum,
    },
    status: "pending" as const,
  };
  
  try {
    const postId = await postService.createPost(postData);
    Alert.alert("Success", "Report submitted!");
  } catch (error) {
    Alert.alert("Error", error.message);
  }
};
```

## 🛡️ Security Features

### Authentication Required
- All operations require user authentication
- Posts are associated with authenticated users

### Data Validation
- Server-side validation through security rules
- Client-side validation in forms
- Image type and size restrictions

### Access Control
- Users can only edit/delete their own posts
- Admin privileges for moderation
- Public read access for browsing

## 📊 Database Structure

### Posts Collection
```typescript
interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  type: "lost" | "found";
  coordinates?: { lat: number; lng: number };
  images: string[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    contactNum: string;
  };
  createdAt: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
  status: "pending" | "resolved" | "rejected";
  foundAction?: "keep" | "turnover to OSA" | "turnover to Campus Security";
  dateTime?: string;
}
```

### Users Collection
```typescript
interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  contactNum: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}
```

## 🎯 Recommendations Implemented

### 1. Comprehensive Post Service ✅
- Create, read, update, delete operations
- Real-time listeners
- Search functionality
- Filter by various criteria

### 2. Image Upload System ✅
- Firebase Storage integration
- Multiple image support
- Automatic URL generation
- Storage cleanup on post deletion

### 3. Data Consistency ✅
- Unified Post interface
- Consistent validation rules
- Synchronized data structure

### 4. Error Handling ✅
- Comprehensive error messages
- User-friendly error display
- Network error handling

### 5. Security Rules ✅
- Authentication requirements
- Data validation rules
- Access control permissions

### 6. Real-time Updates ✅
- Live post synchronization
- Instant updates across devices
- Efficient data streaming

### 7. Form Validation ✅
- Client-side validation
- Required field checking
- User feedback systems

## 🚀 Next Steps

1. **Deploy Security Rules**: Apply the provided Firestore and Storage rules
2. **Set Environment Variables**: Configure Firebase credentials
3. **Test Functionality**: Create test posts and verify data flow
4. **Monitor Usage**: Use Firebase Analytics for insights
5. **Optimize Performance**: Implement pagination for large datasets

## 🔍 Testing Checklist

- [ ] User registration and authentication
- [ ] Post creation with images
- [ ] Real-time post updates
- [ ] Image upload and storage
- [ ] Form validation
- [ ] Error handling
- [ ] Security rule enforcement
- [ ] Cross-platform consistency

## 🆘 Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check Firebase security rules
   - Verify user authentication
   - Ensure proper data structure

2. **Image Upload Fails**
   - Check file size limits
   - Verify storage rules
   - Ensure proper file types

3. **Real-time Updates Not Working**
   - Check Firestore rules
   - Verify listener setup
   - Check network connectivity

4. **Environment Variables Not Working**
   - Restart development server
   - Check .env file location
   - Verify variable names
