// Main Firebase services export file
// This file provides a clean interface to all Firebase functionality

// Export Firebase instances
export { auth, db } from './config';

// Export all services (will be added as we create them)
export { authService } from './auth';
export { messageService } from './messages';
export { postService } from './posts';
export { userService, profilePictureRecoveryService } from './users';
export { imageService } from './images';
export { ghostConversationService, backgroundCleanupService } from './conversations';
export { quotaManager, getFirebaseErrorMessage, sanitizeUserData, sanitizePostData, firebaseOperationWithRetry } from './utils';

// Export types
export type { UserData } from './types';
