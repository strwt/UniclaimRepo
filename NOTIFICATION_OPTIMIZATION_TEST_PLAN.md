# Notification System Optimization Test Plan

## Overview
This document outlines the testing strategy for the optimized notification system that replaces polling with real-time listeners and implements efficient compound queries.

## Test Objectives
1. Verify real-time listeners replace polling successfully
2. Confirm subscription creation works for new users
3. Test optimized notification sending with compound queries
4. Measure performance improvements
5. Ensure no functionality is broken

## Test Scenarios

### 1. Real-time Listener Testing
**Objective**: Verify that notifications update in real-time without polling

**Test Steps**:
- [ ] Open web app and check browser console for "Real-time notification listener" messages
- [ ] Open mobile app and check console for real-time listener setup
- [ ] Verify no 30-second polling intervals are running
- [ ] Test notification updates appear immediately when new notifications are created

**Expected Results**:
- Console shows real-time listener setup messages
- No setInterval calls for notification polling
- Notifications appear instantly without waiting for polling cycle

### 2. Subscription Creation Testing
**Objective**: Verify new users get notification subscriptions automatically

**Test Steps**:
- [ ] Create a new user account (web)
- [ ] Create a new user account (mobile)
- [ ] Check Firestore for `notifications_subscriptions` collection
- [ ] Verify subscription document exists with default preferences

**Expected Results**:
- New user gets subscription document in `notifications_subscriptions` collection
- Default preferences are set correctly
- Console shows "Created notification subscription" messages

### 3. Optimized Notification Sending Testing
**Objective**: Verify compound queries work and reduce database reads

**Test Steps**:
- [ ] Create a new post with specific category
- [ ] Monitor console for "Optimal filtering found X users" messages
- [ ] Check Firestore reads in Firebase console
- [ ] Verify only interested users receive notifications

**Expected Results**:
- Console shows optimal filtering messages with user counts
- Fewer database reads compared to old system
- Only users interested in the category receive notifications

### 4. Performance Comparison Testing
**Objective**: Measure actual performance improvements

**Test Steps**:
- [ ] Create multiple posts and monitor database reads
- [ ] Check notification delivery speed
- [ ] Monitor memory usage (no polling intervals)
- [ ] Test with different user counts

**Expected Results**:
- Significantly fewer database reads per post
- Faster notification delivery
- Lower memory usage (no polling)
- Better scalability with more users

### 5. Edge Case Testing
**Objective**: Ensure system handles edge cases properly

**Test Steps**:
- [ ] Test with users having no category preferences (should get all notifications)
- [ ] Test with users having specific category preferences
- [ ] Test quiet hours functionality
- [ ] Test with users having empty location preferences

**Expected Results**:
- Users with empty preferences get all notifications
- Users with specific preferences get filtered notifications
- Quiet hours are respected
- System handles all preference combinations correctly

## Performance Metrics to Track

### Before Optimization:
- Database reads per post: ~100+ reads
- Polling frequency: Every 30 seconds
- Memory usage: Higher due to polling intervals
- Notification delivery: Up to 30-second delay

### After Optimization:
- Database reads per post: 3-8 reads (target)
- Polling frequency: None (real-time)
- Memory usage: Lower (no polling)
- Notification delivery: Instant

## Success Criteria
- [ ] Real-time listeners working without polling
- [ ] New users get subscriptions automatically
- [ ] Database reads reduced by 80%+ per post
- [ ] Notifications deliver instantly
- [ ] No broken functionality
- [ ] Better user experience

## Test Environment
- Web app: Local development server
- Mobile app: Expo development build
- Database: Firebase Firestore
- Monitoring: Browser console, Firebase console

## Rollback Plan
If issues are found:
1. Revert to previous notification system
2. Restore polling mechanism
3. Remove subscription collection queries
4. Test basic functionality

## Notes
- Test with multiple users to simulate real usage
- Monitor Firebase console for read/write operations
- Check both web and mobile platforms
- Verify all notification types work (new posts, messages, etc.)
