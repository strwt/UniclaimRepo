# Flagging System - Quick Reference Guide

## 🚀 Quick Start

### For Users
1. Click the 🚩 Flag button on any post
2. Select a reason from the dropdown
3. Click "Flag Post" to submit

### For Admins
1. Go to Admin Homepage
2. Look for posts with red outline (flagged posts)
3. Use "Flagged Posts" view to see all flagged content
4. Take action: Unflag, Hide, or Unhide posts

## 📁 File Structure

```
frontend/src/
├── components/
│   ├── FlagButton.tsx          # User flag button
│   ├── FlagModal.tsx           # Flag reason selection
│   ├── PostCard.tsx            # Updated with flag button
│   └── AdminPostCard.tsx       # Admin flag management
├── routes/
│   ├── user-routes/HomePage.tsx    # Updated with filtering
│   └── admin-routes/AdminHomePage.tsx  # Admin flag management
├── services/firebase/posts.ts  # Flag service functions
└── types/Post.ts               # Updated with flag fields

mobile/
├── components/
│   ├── FlagButton.tsx          # Mobile flag button
│   ├── FlagModal.tsx           # Mobile flag modal
│   └── PostCard.tsx            # Updated with flag button
├── app/tabs/Home.tsx           # Updated with filtering
└── types/type.ts               # Updated with flag fields
```

## 🔧 Key Functions

### User Functions
```typescript
// Flag a post
await postService.flagPost(postId, userId, reason);
```

### Admin Functions
```typescript
// Remove flag
await postService.unflagPost(postId);

// Hide post from public
await postService.hidePost(postId);

// Make hidden post visible
await postService.unhidePost(postId);

// Get all flagged posts
const flaggedPosts = await postService.getFlaggedPosts();
```

## 🎨 UI Components

### FlagButton Props
```typescript
interface FlagButtonProps {
  postId: string;
  isFlagged?: boolean;
  flaggedBy?: string;
  onFlagSuccess?: () => void;
  className?: string;
}
```

### AdminPostCard Props
```typescript
interface AdminPostCardProps {
  // ... existing props
  onUnflagPost?: (post: Post) => void;
  onHidePost?: (post: Post) => void;
  onUnhidePost?: (post: Post) => void;
}
```

## 🗄️ Database Fields

```typescript
interface Post {
  // ... existing fields
  isFlagged?: boolean;        // Is post flagged?
  flagReason?: string;        // Why was it flagged?
  flaggedBy?: string;         // Who flagged it?
  flaggedAt?: Date;           // When was it flagged?
  isHidden?: boolean;         // Is it hidden from public?
}
```

## 🎯 Flag Reasons

- **Inappropriate content** - Offensive material
- **Spam/Fake post** - Spam or fake content
- **Suspicious activity** - Potentially harmful
- **Wrong category** - Misplaced content
- **Other** - Custom reason

## 🔍 Visual Indicators

### For Users
- 🚩 Flag button on all posts
- "🚩 Flagged" when already flagged
- Disabled state for flagged posts

### For Admins
- Red outline around flagged posts
- "🚩 FLAGGED" badge
- Unflag, Hide, Unhide buttons
- "Flagged Posts" view filter

## 🚫 Content Filtering

Hidden posts are automatically filtered from:
- Public post listings
- Search results
- Filtered views (lost/found)
- All user-facing content

## ⚡ Quick Fixes

### Flag Button Not Appearing
```typescript
// Check import in PostCard.tsx
import FlagButton from "./FlagButton";

// Check usage
<FlagButton
  postId={post.id}
  isFlagged={post.isFlagged}
  flaggedBy={post.flaggedBy}
/>
```

### Admin Actions Not Working
```typescript
// Check handlers in AdminHomePage.tsx
const handleUnflagPost = async (post: Post) => {
  await postService.unflagPost(post.id);
};

// Check props in AdminPostCard
<AdminPostCard
  onUnflagPost={handleUnflagPost}
  onHidePost={handleHidePost}
  onUnhidePost={handleUnhidePost}
/>
```

### Hidden Posts Still Visible
```typescript
// Check filtering logic
const filteredPosts = posts.filter(post => {
  if (post.isHidden === true) return false;
  // ... other filters
  return true;
});
```

## 🧪 Testing Checklist

- [ ] Flag button appears on all posts
- [ ] Flag modal opens and works
- [ ] Flag submission works
- [ ] One-time flagging limit enforced
- [ ] Admin sees flagged posts with red outline
- [ ] Admin can unflag posts
- [ ] Admin can hide/unhide posts
- [ ] Hidden posts invisible to users
- [ ] Real-time updates work
- [ ] Error handling works

## 🐛 Common Issues

1. **Import errors**: Check useAuth import path
2. **Flag button not working**: Check postService import
3. **Admin actions failing**: Check admin permissions
4. **Hidden posts visible**: Check filtering logic
5. **Real-time not working**: Check Firebase connection

## 📞 Support

- Check console for error messages
- Verify component imports
- Test with different user roles
- Check network connectivity
- Review Firebase rules

---

**Note**: This system is designed for 100+ users and includes performance optimizations for real-time updates and efficient filtering.
