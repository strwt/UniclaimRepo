# Firestore Indexes Guide

This document explains the Firestore index requirements for your UniClaim mobile app.

## ✅ Fixed Issues

### 1. Conversations Query Index Error
**Error**: `The query requires an index` for conversations collection
**Solution**: Modified the `getUserConversations` query to avoid the index requirement by:
- Removing `orderBy('createdAt', 'desc')` from the Firestore query
- Adding client-side sorting in JavaScript instead

**Location**: `mobile/utils/firebase.ts` - `getUserConversations` function

## 🔍 Potential Future Index Needs

The following queries might require indexes if you have large datasets:

### 1. Posts by Type
**Query**: `where('type', '==', type) + orderBy('createdAt', 'desc')`
**Collection**: `posts`
**Function**: `getPostsByType`

### 2. Posts by Category  
**Query**: `where('category', '==', category) + orderBy('createdAt', 'desc')`
**Collection**: `posts`
**Function**: `getPostsByCategory`

### 3. User Posts
**Query**: `where('user.email', '==', userEmail) + orderBy('createdAt', 'desc')`
**Collection**: `posts`
**Function**: `getUserPosts`

### 4. Posts by Location
**Query**: `where('location', '==', location) + orderBy('createdAt', 'desc')`
**Collection**: `posts` 
**Function**: `getPostsByLocation`

## 📋 How to Create Indexes (If Needed)

If you encounter index errors for the above queries:

1. **Automatic Creation**: When you get an index error, Firebase provides a direct link to create the index
2. **Manual Creation**: Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Firestore Database → Indexes

### Required Indexes for Posts Collection:
- **Collection ID**: `posts`
- **Fields**:
  - `type` (Ascending) + `createdAt` (Descending)
  - `category` (Ascending) + `createdAt` (Descending)  
  - `user.email` (Ascending) + `createdAt` (Descending)
  - `location` (Ascending) + `createdAt` (Descending)

## 🚫 Queries That Don't Need Indexes

These queries work without additional indexes:
- Simple orderBy queries (like `getAllPosts`)
- Single field equality queries
- Simple message queries (like `getConversationMessages`)

## 💡 Best Practices

1. **Start Simple**: Use the current setup - indexes are only needed when you get errors
2. **Monitor Performance**: Large datasets might require indexes even if queries work
3. **Use Error Links**: When you get index errors, Firebase provides direct creation links
4. **Test with Real Data**: Index needs become apparent with realistic data volumes

## 🔧 Alternative Solutions

If you want to avoid indexes entirely:
1. Use client-side filtering and sorting (current approach for conversations)
2. Restructure data to avoid complex queries
3. Use cloud functions for complex operations
