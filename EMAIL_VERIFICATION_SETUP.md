# Email Verification Setup Guide

This guide explains how to set up email verification for the UniClaim app and grandfather existing users.

## Overview

Email verification has been implemented with the following features:
- ✅ New users must verify their email before accessing the platform
- ✅ Admin and campus security users bypass email verification
- ✅ Existing users are grandfathered (no verification required)
- ✅ Email verification status is tracked in both Firebase Auth and Firestore

## Setup Steps

### 1. Grandfather Existing Users

**Option A: Web-based Script (Recommended)**
1. Log in to the app as an admin user
2. Open browser console (F12)
3. Copy and paste the contents of `grandfather-users-web.js`
4. Press Enter to run the script
5. The script will update all existing users to have `emailVerified: true`

**Option B: Node.js Script (Advanced)**
1. Set up Firebase Admin SDK with service account key
2. Run: `node grandfather-existing-users.cjs`
3. The script will update all existing users in the database

### 2. Verify Setup

After running the grandfather script:
1. Test that existing users can still log in and access the platform
2. Test that new user registration sends verification emails
3. Test that unverified new users are redirected to verification page
4. Test that verified users can access the platform

## How It Works

### For Existing Users (Grandfathered)
- Users who existed before email verification implementation
- Automatically have `emailVerified: true` set in their Firestore document
- Can access the platform without any verification steps
- No disruption to their current workflow

### For New Users
1. **Registration**: User creates account → `emailVerified: false` set in Firestore
2. **Email Sent**: Verification email automatically sent via Firebase Auth
3. **Verification Required**: User redirected to verification page
4. **Email Click**: User clicks verification link in email
5. **Status Update**: Firebase Auth marks email as verified
6. **Access Granted**: User can now access the platform

### For Admin/Campus Security Users
- Always bypass email verification regardless of status
- Can access admin features immediately after login
- No verification emails sent or required

## Technical Details

### Database Schema
```typescript
interface UserData {
  // ... existing fields
  emailVerified?: boolean; // New field for email verification status
}
```

### Verification Logic
```typescript
needsEmailVerification(user, userData): boolean {
  // Admin and campus security bypass verification
  if (userData.role === 'admin' || userData.role === 'campus_security') {
    return false;
  }
  
  // Check both Firebase Auth and Firestore status
  const firebaseVerified = user.emailVerified;
  const firestoreVerified = userData.emailVerified ?? true; // Default true for grandfathered users
  
  return !firebaseVerified || !firestoreVerified;
}
```

### Route Protection
- **Public Routes**: `/login`, `/register`, `/reset-password`, `/email-verification`
- **Protected User Routes**: All main app routes (require email verification)
- **Admin Routes**: Admin dashboard (no verification required)

## Troubleshooting

### Existing Users Can't Access Platform
- Run the grandfather script to set `emailVerified: true` for existing users
- Check that the script completed successfully
- Verify user documents have the `emailVerified` field

### New Users Not Receiving Verification Emails
- Check Firebase Auth email settings
- Verify email templates are configured
- Check spam/junk folders
- Ensure Firebase project has email sending enabled

### Verification Status Not Updating
- Check browser console for errors
- Verify Firestore security rules allow updates
- Check that `updateEmailVerificationStatus` function is working
- Ensure user has proper permissions

## Files Modified

### Frontend
- `frontend/src/services/firebase/auth.ts` - Added verification functions
- `frontend/src/utils/waterbase.ts` - Added verification functions
- `frontend/src/context/AuthContext.tsx` - Added verification state management
- `frontend/src/components/EmailVerificationRoute.tsx` - New route protection component
- `frontend/src/routes/user-routes/EmailVerification.tsx` - New verification page
- `frontend/src/types/PageRoutes.tsx` - Updated routing

### Mobile
- `mobile/utils/firebase/auth.ts` - Added verification functions

### Scripts
- `grandfather-users-web.js` - Web-based grandfather script
- `grandfather-existing-users.cjs` - Node.js grandfather script

## Security Considerations

- Email verification is enforced at the route level
- Admin and campus security users bypass verification
- Existing users are grandfathered to prevent lockout
- Verification status is checked on every authentication state change
- Firestore security rules should be updated to allow email verification updates

## Testing Checklist

- [ ] Existing users can log in and access platform
- [ ] New user registration sends verification email
- [ ] Unverified new users see verification page
- [ ] Verified users can access platform
- [ ] Admin users bypass verification
- [ ] Campus security users bypass verification
- [ ] Email verification status updates correctly
- [ ] Resend verification email works
- [ ] Manual verification check works
