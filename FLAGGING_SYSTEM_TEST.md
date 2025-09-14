# Flagging System Test Guide

## Overview
This document provides a comprehensive test plan for the newly implemented flagging system in the Lost and Found app.

## Test Environment Setup
1. Ensure you have both frontend and mobile versions running
2. Have at least one admin user and one regular user account
3. Have some test posts created

## Test Cases

### 1. User Flagging Functionality

#### Test 1.1: Flag Button Visibility
- **Steps:**
  1. Login as a regular user
  2. Navigate to the home page
  3. Look at any post card
- **Expected Result:** 
  - Flag button (🚩 Flag) should be visible on all post cards
  - Button should be positioned in the badges section

#### Test 1.2: Flag Modal Functionality
- **Steps:**
  1. Click the flag button on any post
  2. Verify the flag modal opens
- **Expected Result:**
  - Modal should display "Flag Post" title
  - Should show predefined reasons: "Inappropriate content", "Spam/Fake post", "Suspicious activity", "Wrong category", "Other"
  - Should have Cancel and Flag Post buttons

#### Test 1.3: Flag Submission
- **Steps:**
  1. Select a reason (e.g., "Inappropriate content")
  2. Click "Flag Post"
- **Expected Result:**
  - Modal should close
  - Flag button should change to "🚩 Flagged" and be disabled
  - Post should be flagged in the database

#### Test 1.4: Custom Reason Flagging
- **Steps:**
  1. Click flag button
  2. Select "Other" as reason
  3. Enter custom text in the text area
  4. Click "Flag Post"
- **Expected Result:**
  - Custom reason should be saved
  - Post should be flagged successfully

#### Test 1.5: One-Time Flagging Limit
- **Steps:**
  1. Flag a post (complete Test 1.3)
  2. Try to flag the same post again
- **Expected Result:**
  - Flag button should show "🚩 Flagged" and be disabled
  - Clicking should not open the modal
  - Should show tooltip "You have already flagged this post"

### 2. Admin Flag Management

#### Test 2.1: Flagged Post Visibility
- **Steps:**
  1. Login as admin
  2. Navigate to admin homepage
  3. Look for flagged posts
- **Expected Result:**
  - Flagged posts should have red outline/border
  - Should show "🚩 FLAGGED" badge
  - Should be visible in all admin views

#### Test 2.2: Flagged Posts Filter
- **Steps:**
  1. Click "Flagged Posts" button in admin view
- **Expected Result:**
  - Should show only flagged posts
  - View title should show "Flagged Posts"

#### Test 2.3: Unflag Post
- **Steps:**
  1. Find a flagged post
  2. Click "Unflag" button (yellow button)
- **Expected Result:**
  - Post should lose red outline
  - "🚩 FLAGGED" badge should disappear
  - "Unflag" button should disappear
  - Toast notification should show "Post Unflagged"

#### Test 2.4: Hide Post
- **Steps:**
  1. Find a flagged post
  2. Click "Hide" button (orange button)
- **Expected Result:**
  - "Hide" button should change to "Unhide" (green button)
  - Toast notification should show "Post Hidden"
  - Post should be hidden from public view

#### Test 2.5: Unhide Post
- **Steps:**
  1. Find a hidden post (should show "Unhide" button)
  2. Click "Unhide" button
- **Expected Result:**
  - "Unhide" button should change back to "Hide"
  - Toast notification should show "Post Unhidden"
  - Post should be visible in public view again

### 3. Post Visibility Control

#### Test 3.1: Hidden Post Visibility (Regular User)
- **Steps:**
  1. Login as regular user
  2. Navigate to home page
  3. Look for posts that were hidden by admin
- **Expected Result:**
  - Hidden posts should not be visible
  - Should not appear in any post listings

#### Test 3.2: Hidden Post Visibility (Admin)
- **Steps:**
  1. Login as admin
  2. Navigate to admin homepage
- **Expected Result:**
  - Hidden posts should still be visible
  - Should show "Unhide" button for hidden posts

#### Test 3.3: Search Results
- **Steps:**
  1. Login as regular user
  2. Search for content from a hidden post
- **Expected Result:**
  - Hidden posts should not appear in search results

#### Test 3.4: User's Own Posts
- **Steps:**
  1. Login as user who created a post
  2. Navigate to "My Tickets" or user's own posts
  3. Look for a post that was hidden by admin
- **Expected Result:**
  - User should still see their own posts even if hidden
  - This allows users to manage their own content

### 4. Database Integration

#### Test 4.1: Flag Data Persistence
- **Steps:**
  1. Flag a post
  2. Refresh the page
  3. Check if flag status persists
- **Expected Result:**
  - Flag status should persist after page refresh
  - Flag button should still show "🚩 Flagged"

#### Test 4.2: Real-time Updates
- **Steps:**
  1. Open admin view in one browser
  2. Flag a post from regular user view in another browser
- **Expected Result:**
  - Admin view should update in real-time
  - Flagged post should appear with red outline

## Error Handling Tests

### Test 5.1: Network Error Handling
- **Steps:**
  1. Disconnect internet
  2. Try to flag a post
- **Expected Result:**
  - Should show appropriate error message
  - Should not crash the application

### Test 5.2: Authentication Error Handling
- **Steps:**
  1. Logout user
  2. Try to flag a post
- **Expected Result:**
  - Should show "Please log in to flag posts" message
  - Should not allow flagging

## Performance Tests

### Test 6.1: Large Number of Flagged Posts
- **Steps:**
  1. Flag multiple posts
  2. Check admin "Flagged Posts" view
- **Expected Result:**
  - Should handle multiple flagged posts efficiently
  - Should not cause performance issues

## Success Criteria
- [ ] All flagging functionality works as expected
- [ ] Admin can manage flagged posts effectively
- [ ] Hidden posts are properly filtered from public view
- [ ] Real-time updates work correctly
- [ ] Error handling is robust
- [ ] Performance is acceptable with multiple flagged posts

## Notes
- Test both frontend and mobile versions
- Test with different user roles (admin, regular user)
- Test with different post types (lost, found)
- Verify database changes are persistent
- Check console for any errors during testing
