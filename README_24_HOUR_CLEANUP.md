# 24-Hour Conversation Cleanup System

## Overview
This system automatically deletes conversations older than 24 hours to free up Firebase storage space and keep your app lean for the 100-user target.

## What Gets Cleaned Up
- **Conversations** older than 24 hours
- **All messages** within those conversations
- **Cloudinary images** associated with messages:
  - ID photos from handover requests
  - ID photos from claim requests
  - Evidence photos from claim requests
  - Verification photos from legacy messages

## How It Works

### Automatic Cleanup
- **Runs every hour** in the background
- **24-hour threshold** from conversation creation time
- **Prevents multiple runs** simultaneously
- **Continues cleanup** even if some image deletions fail

### Manual Cleanup (Admin Only)
- Admins can trigger immediate cleanup
- Bypasses the 1-hour interval check
- Shows detailed results and statistics

## Files Created

### Frontend (Web)
- `frontend/src/utils/conversationCleanupService.ts` - Main cleanup logic
- `frontend/src/utils/cleanupScheduler.ts` - Automatic hourly scheduler
- `frontend/src/components/ConversationCleanupAdmin.tsx` - Admin interface

### Mobile
- `mobile/utils/conversationCleanupService.ts` - Mobile cleanup service
- `mobile/utils/cleanupScheduler.ts` - Mobile scheduler

## Integration Points

### Admin Panel
- Added "System Cleanup" menu item in admin sidebar
- Route: `/admin/cleanup`
- Shows cleanup status and allows manual triggering

### Automatic Startup
- **Frontend**: Imported in `PageRoutes.tsx`
- **Mobile**: Imported in `_layout.tsx`
- Starts automatically when app loads

## Safety Features

### Prevention of Data Loss
- Only deletes conversations older than 24 hours
- Minimum 1-hour interval between cleanup runs
- Prevents multiple simultaneous cleanup operations
- Comprehensive error handling and logging

### Graceful Degradation
- Database cleanup continues even if image deletion fails
- Logs all errors for debugging
- Doesn't stop the scheduler on individual failures

## Monitoring

### Console Logs
- 🧹 Cleanup start/completion messages
- 🕐 Scheduler status updates
- ✅ Success confirmations
- ❌ Error details
- ⚠️ Warning messages

### Admin Interface
- Current cleanup status
- Last cleanup time
- Manual trigger button
- Detailed results display
- Error reporting

## Configuration

### Timing Settings
- **Cleanup Threshold**: 24 hours (hardcoded)
- **Scheduler Interval**: 1 hour (hardcoded)
- **Initial Delay**: 5 seconds after app start

### Customization
To change timing, modify these constants in the service files:
```typescript
private readonly CLEANUP_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
private readonly MIN_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
```

## Testing

### Manual Testing
1. Go to `/admin/cleanup` in admin panel
2. Click "Trigger Manual Cleanup"
3. Check console logs for detailed output
4. Verify cleanup results in the interface

### Automatic Testing
1. Start the app
2. Wait 5 seconds for initial cleanup
3. Check console for scheduler startup messages
4. Monitor hourly cleanup logs

## Troubleshooting

### Common Issues
- **"Cleanup already running"** - Wait for current cleanup to complete
- **"Cleanup interval not reached"** - Wait for 1-hour interval or use manual trigger
- **Image deletion failures** - Check Cloudinary credentials and network

### Debug Information
- All cleanup operations are logged to console
- Admin interface shows detailed error messages
- Service provides cleanup statistics via `getCleanupStats()`

## Performance Impact
- **Minimal overhead** - Only runs when needed
- **Efficient queries** - Uses Firestore indexes on `createdAt`
- **Batch operations** - Deletes messages in batches
- **Background processing** - Doesn't block user interface

## Future Enhancements
- Configurable cleanup thresholds
- Admin notification system
- Cleanup analytics dashboard
- Selective cleanup by conversation type
- Backup/archive before deletion
