# Email Verification Test Plan

This document outlines the complete testing procedure for the email verification system implementation.

## Pre-Testing Setup

### 1. Run Grandfather Script (CRITICAL)
Before testing, you MUST run the grandfather script to update existing users:

1. **Log in as an admin user** to the web app
2. **Open browser console** (F12)
3. **Copy and paste** the contents of `grandfather-users-web.js`
4. **Press Enter** to run the script
5. **Verify success message**: "Successfully updated X existing users with emailVerified: true"

⚠️ **WARNING**: Without running this script, existing users will be locked out!

## Test Scenarios

### Test 1: Existing Users (Grandfathered)
**Objective**: Verify existing users can still access the platform

**Steps**:
1. Log in with an existing user account
2. Verify you can access the main platform (home page, reports, etc.)
3. Check that no email verification prompts appear
4. Verify user can navigate to all protected routes

**Expected Result**: ✅ Existing users access platform normally without verification

**If Test Fails**:
- Run the grandfather script again
- Check browser console for errors
- Verify user document has `emailVerified: true` in Firestore

---

### Test 2: New User Registration
**Objective**: Verify new users receive verification emails and are redirected properly

**Steps**:
1. Log out of any existing session
2. Go to registration page
3. Create a new user account with a valid email
4. Check that registration completes successfully
5. Verify you're redirected to email verification page
6. Check your email inbox for verification email

**Expected Result**: ✅ New user redirected to verification page, email sent

**If Test Fails**:
- Check Firebase Auth email settings
- Verify email templates are configured
- Check spam/junk folders
- Check browser console for errors

---

### Test 3: Unverified User Access
**Objective**: Verify unverified users cannot access protected routes

**Steps**:
1. With an unverified new user account
2. Try to navigate to home page directly
3. Try to access reports, profile, or other protected routes
4. Verify you're redirected to email verification page

**Expected Result**: ✅ Unverified users redirected to verification page

**If Test Fails**:
- Check EmailVerificationRoute component
- Verify route protection is working
- Check AuthContext verification logic

---

### Test 4: Email Verification Completion
**Objective**: Verify users can complete email verification

**Steps**:
1. With an unverified user account
2. Click the verification link in the email
3. Return to the app
4. Click "I've Verified My Email" button
5. Verify you're redirected to the main platform
6. Test accessing protected routes

**Expected Result**: ✅ Verified users can access platform normally

**If Test Fails**:
- Check email verification link works
- Verify Firestore update is working
- Check AuthContext state updates
- Check browser console for errors

---

### Test 5: Admin User Bypass
**Objective**: Verify admin users bypass email verification

**Steps**:
1. Log in with an admin user account
2. Verify you can access admin dashboard immediately
3. Check that no email verification prompts appear
4. Test admin-specific features

**Expected Result**: ✅ Admin users bypass verification completely

**If Test Fails**:
- Check admin role detection logic
- Verify needsEmailVerification function
- Check user document has correct role

---

### Test 6: Campus Security User Bypass
**Objective**: Verify campus security users bypass email verification

**Steps**:
1. Log in with a campus security user account
2. Verify you can access platform immediately
3. Check that no email verification prompts appear
4. Test campus security features

**Expected Result**: ✅ Campus security users bypass verification completely

**If Test Fails**:
- Check campus security role detection
- Verify role field in user document
- Check verification logic

---

### Test 7: Resend Verification Email
**Objective**: Verify users can resend verification emails

**Steps**:
1. With an unverified user account
2. Go to email verification page
3. Click "Resend Verification Email"
4. Check for success message
5. Verify new email is received

**Expected Result**: ✅ Resend functionality works correctly

**If Test Fails**:
- Check sendEmailVerification function
- Verify Firebase Auth email settings
- Check error handling

---

### Test 8: Manual Verification Check
**Objective**: Verify manual verification check works

**Steps**:
1. With an unverified user account
2. Click verification link in email
3. Return to app (don't refresh)
4. Click "I've Verified My Email" button
5. Verify you're redirected to platform

**Expected Result**: ✅ Manual check detects verification and redirects

**If Test Fails**:
- Check user.reload() functionality
- Verify Firebase Auth state updates
- Check handleEmailVerificationComplete function

---

### Test 9: Error Handling
**Objective**: Verify error handling works correctly

**Steps**:
1. Test with invalid email addresses
2. Test network connectivity issues
3. Test Firebase service errors
4. Verify appropriate error messages

**Expected Result**: ✅ Graceful error handling with user-friendly messages

---

### Test 10: Mobile App Compatibility
**Objective**: Verify mobile app works with email verification

**Steps**:
1. Test registration on mobile app
2. Test email verification flow
3. Test admin/campus security bypass
4. Verify mobile-specific features work

**Expected Result**: ✅ Mobile app works correctly with verification system

## Post-Testing Verification

### Database Verification
After testing, verify the database state:

1. **Check existing users**: Should have `emailVerified: true`
2. **Check new users**: Should have `emailVerified: false` initially, then `true` after verification
3. **Check admin users**: Should have `emailVerified: true` (or undefined)
4. **Check campus security**: Should have `emailVerified: true` (or undefined)

### Performance Verification
1. **Check page load times**: Should not be significantly impacted
2. **Check authentication speed**: Should remain fast
3. **Check database queries**: Should be efficient

## Rollback Plan

If issues are found, you can temporarily disable email verification:

1. **Comment out EmailVerificationRoute** in PageRoutes.tsx
2. **Use ProtectedRoute instead** for main routes
3. **Keep verification logic** for future re-enablement

## Success Criteria

The email verification system is working correctly if:

- ✅ Existing users can access platform without issues
- ✅ New users receive verification emails
- ✅ Unverified users are redirected to verification page
- ✅ Verified users can access platform
- ✅ Admin/campus security users bypass verification
- ✅ Resend functionality works
- ✅ Manual verification check works
- ✅ Error handling is graceful
- ✅ Mobile app compatibility maintained

## Troubleshooting

### Common Issues

1. **Existing users locked out**: Run grandfather script
2. **Verification emails not sent**: Check Firebase Auth settings
3. **Infinite redirect loops**: Check route protection logic
4. **Admin users prompted for verification**: Check role detection
5. **Mobile app issues**: Check mobile auth service

### Debug Commands

```javascript
// Check current user verification status
console.log('User:', firebase.auth().currentUser);
console.log('Email verified:', firebase.auth().currentUser?.emailVerified);

// Check user data
firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).get()
  .then(doc => console.log('User data:', doc.data()));

// Check verification status
// (Run this in browser console while logged in)
```

## Final Checklist

Before considering the implementation complete:

- [ ] Grandfather script run successfully
- [ ] All test scenarios pass
- [ ] No compilation errors
- [ ] No runtime errors in console
- [ ] Database state verified
- [ ] Performance acceptable
- [ ] Mobile app tested
- [ ] Documentation updated
- [ ] Team notified of changes
