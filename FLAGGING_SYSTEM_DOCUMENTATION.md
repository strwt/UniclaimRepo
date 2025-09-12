# Flagging System Documentation

## Overview
The flagging system allows users to report inappropriate or problematic posts, while giving administrators complete control over content moderation. The system includes visual indicators, admin management tools, and automatic filtering of hidden content.

## Architecture

### Database Schema
The flagging system adds the following fields to the Post interface:

```typescript
interface Post {
  // ... existing fields ...
  
  // Flagging system fields
  isFlagged?: boolean;        // Whether the post has been flagged by a user
  flagReason?: string;        // Reason for flagging (inappropriate content, spam, etc.)
  flaggedBy?: string;         // User ID who flagged the post
  flaggedAt?: string | Date;  // When the post was flagged
  isHidden?: boolean;         // Whether admin chose to hide the post from public view
}
```

### Components Structure

#### Frontend Components
```
frontend/src/components/
├── FlagButton.tsx          # Reusable flag button component
├── FlagModal.tsx           # Modal for selecting flag reason
├── PostCard.tsx            # Updated with flag button
└── AdminPostCard.tsx       # Updated with admin flag management
```

#### Mobile Components
```
mobile/components/
├── FlagButton.tsx          # Mobile flag button component
├── FlagModal.tsx           # Mobile flag reason modal
└── PostCard.tsx            # Updated with flag button
```

#### Service Functions
```
frontend/src/services/firebase/posts.ts
├── flagPost()              # Flag a post with reason
├── unflagPost()            # Remove flag from post
├── hidePost()              # Hide post from public view
├── unhidePost()            # Make hidden post visible
└── getFlaggedPosts()       # Get all flagged posts
```

## User Features

### Flagging Posts
1. **Flag Button**: Appears on all post cards with 🚩 icon
2. **Flag Modal**: Allows selection of predefined reasons:
   - Inappropriate content
   - Spam/Fake post
   - Suspicious activity
   - Wrong category
   - Other (with custom text input)
3. **One-Time Limit**: Users can only flag each post once
4. **Visual Feedback**: Button changes to "🚩 Flagged" after flagging

### Flag Reasons
- **Inappropriate content**: For posts with offensive or inappropriate material
- **Spam/Fake post**: For posts that appear to be spam or fake
- **Suspicious activity**: For posts that seem suspicious or potentially harmful
- **Wrong category**: For posts in the wrong category
- **Other**: Custom reason with text input

## Admin Features

### Visual Indicators
1. **Red Outline**: Flagged posts have a red ring and border
2. **Flag Badge**: Shows "🚩 FLAGGED" badge on flagged posts
3. **Dedicated View**: "Flagged Posts" filter shows only flagged content

### Admin Actions
1. **Unflag**: Remove flag from post (yellow button)
2. **Hide**: Hide post from public view (orange button)
3. **Unhide**: Make hidden post visible again (green button)

### Admin Interface
- **Flagged Posts View**: Dedicated tab to see all flagged posts
- **Real-time Updates**: Changes reflect immediately across all views
- **Toast Notifications**: Success/error messages for all actions

## Content Moderation Flow

### 1. User Reports Content
```
User sees post → Clicks flag button → Selects reason → Submits flag
```

### 2. Admin Reviews Content
```
Admin sees flagged post → Reviews content → Takes action:
├── Unflag (if content is appropriate)
├── Hide (if content should be removed)
└── Leave flagged (for further review)
```

### 3. Content Visibility Control
```
Hidden posts are filtered from:
├── Public post listings
├── Search results
├── Filtered views (lost/found)
└── All user-facing content
```

## Technical Implementation

### Frontend Integration
```typescript
// PostCard component with flag button
<FlagButton
  postId={post.id}
  isFlagged={post.isFlagged}
  flaggedBy={post.flaggedBy}
  onFlagSuccess={() => {/* refresh data */}}
/>
```

### Admin Integration
```typescript
// AdminPostCard with flag management
<AdminPostCard
  post={post}
  onUnflagPost={handleUnflagPost}
  onHidePost={handleHidePost}
  onUnhidePost={handleUnhidePost}
  // ... other props
/>
```

### Service Usage
```typescript
// Flag a post
await postService.flagPost(postId, userId, reason);

// Admin actions
await postService.unflagPost(postId);
await postService.hidePost(postId);
await postService.unhidePost(postId);
```

## Filtering Logic

### Public View Filtering
All public-facing post retrieval functions filter out hidden posts:

```typescript
// Example filtering logic
const filteredPosts = posts.filter(post => {
  // Filter out hidden posts
  if (post.isHidden === true) return false;
  
  // ... other filters
  return true;
});
```

### Admin View
Admins can see all posts including hidden ones, with visual indicators for flagged content.

## Security Considerations

### User Permissions
- **Regular Users**: Can flag posts, cannot see hidden posts
- **Admins**: Can manage all flags, see all posts including hidden ones
- **Post Owners**: Can see their own posts even if hidden

### Data Validation
- Flag reasons are validated before submission
- One-time flagging limit enforced at service level
- Admin actions require proper authentication

## Performance Optimizations

### Real-time Updates
- Uses Firebase real-time listeners for instant updates
- Optimized queries to minimize data transfer
- Efficient filtering on client side

### Caching
- Post data cached to reduce database calls
- Flag status updates trigger minimal re-renders
- Background refresh for data consistency

## Error Handling

### User Errors
- Network errors show appropriate messages
- Authentication errors prevent flagging
- Validation errors guide user input

### Admin Errors
- Service errors logged for debugging
- Toast notifications for user feedback
- Graceful degradation for failed operations

## Testing

### Test Coverage
- Unit tests for all service functions
- Integration tests for component interactions
- End-to-end tests for complete workflows

### Test Scenarios
- User flagging workflow
- Admin management workflow
- Content visibility control
- Error handling scenarios
- Performance with multiple flagged posts

## Deployment Considerations

### Database Migration
- New fields are optional, no migration needed
- Existing posts will have `undefined` flag fields
- System handles missing fields gracefully

### Feature Flags
- Flagging system can be enabled/disabled
- Admin features require proper role permissions
- Gradual rollout possible

## Maintenance

### Monitoring
- Track flagging patterns and trends
- Monitor admin response times
- Alert on unusual flagging activity

### Analytics
- Flag reason distribution
- Admin action patterns
- Content moderation effectiveness

## Future Enhancements

### Potential Improvements
- Bulk flag management
- Flag priority levels
- Automated content detection
- Advanced admin analytics
- User reputation system

### Scalability
- System designed for 100+ concurrent users
- Efficient database queries
- Optimized real-time updates
- Minimal performance impact

## Support

### Troubleshooting
- Check console for error messages
- Verify user authentication status
- Confirm admin permissions
- Check network connectivity

### Common Issues
- Flag button not appearing: Check component imports
- Admin actions not working: Verify admin permissions
- Hidden posts still visible: Check filtering logic
- Real-time updates not working: Check Firebase connection

## Conclusion

The flagging system provides a comprehensive solution for content moderation while maintaining excellent user experience. It balances user empowerment with administrative control, ensuring the platform remains clean and trustworthy for all users.

The system is production-ready and designed to scale with the application's growth, supporting the goal of serving 100+ users effectively.
