// Utility functions for Firebase operations - error handling, data sanitization, and quota management

// Helper function to get readable error messages
export const getFirebaseErrorMessage = (error: any): string => {
    switch (error.code) {
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email address.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters long.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            return error.message || 'An unexpected error occurred. Please try again.';
    }
};

// Utility function to sanitize user data before saving to Firestore
export const sanitizeUserData = (userData: any): any => {
    if (!userData) return userData;

    const sanitized = { ...userData };

    // Ensure profilePicture is never undefined
    if (sanitized.profilePicture === undefined) {
        sanitized.profilePicture = null;
    }

    // Ensure profileImageUrl is never undefined
    if (sanitized.profileImageUrl === undefined) {
        sanitized.profileImageUrl = null;
    }

    // Ensure all string fields are never undefined
    const stringFields = ['firstName', 'lastName', 'email', 'contactNum', 'studentId'];
    stringFields.forEach(field => {
        if (sanitized[field] === undefined) {
            sanitized[field] = '';
        }
    });

    return sanitized;
};

// Utility function to sanitize post data before saving to Firestore
export const sanitizePostData = (postData: any): any => {
    if (!postData) return postData;

    const sanitized = { ...postData };

    // Sanitize user object within post
    if (sanitized.user) {
        sanitized.user = sanitizeUserData(sanitized.user);
    }

    // Ensure other optional fields are never undefined
    if (sanitized.coordinates === undefined) {
        sanitized.coordinates = null;
    }

    if (sanitized.foundAction === undefined) {
        sanitized.foundAction = null;
    }

    return sanitized;
};

// Helper function to check if error is a permission error (expected during logout)
const isPermissionError = (error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code || '';

    // Check for common permission error patterns
    return (
        errorCode === 'permission-denied' ||
        errorCode === 'PERMISSION_DENIED' ||
        errorMessage.includes('Missing or insufficient permissions') ||
        errorMessage.includes('permission-denied') ||
        errorMessage.includes('PERMISSION_DENIED') ||
        errorMessage.includes('not authorized') ||
        errorMessage.includes('authentication required')
    );
};

// Utility function to check if error is a quota error
const isQuotaError = (error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code || '';

    // Check for quota-related error patterns
    return (
        errorCode === 'resource-exhausted' ||
        errorCode === 'RESOURCE_EXHAUSTED' ||
        errorMessage.includes('Quota exceeded') ||
        errorMessage.includes('quota exceeded') ||
        errorMessage.includes('resource exhausted') ||
        errorMessage.includes('Quota exceeded')
    );
};

// Utility function to handle Firebase operations with retry logic
export const firebaseOperationWithRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Don't retry on permission errors or quota errors
            if (isPermissionError(error) || isQuotaError(error)) {
                throw error;
            }

            // Don't retry on the last attempt
            if (attempt === maxRetries) {
                break;
            }

            // Calculate delay with exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`Firebase operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, error.message);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

// Quota monitoring and management system
export class QuotaManager {
    private static instance: QuotaManager;
    private quotaErrors: number = 0;
    private lastQuotaError: number = 0;
    private isInQuotaWarning: boolean = false;

    private constructor() { }

    static getInstance(): QuotaManager {
        if (!QuotaManager.instance) {
            QuotaManager.instance = new QuotaManager();
        }
        return QuotaManager.instance;
    }

    // Record a quota error
    recordQuotaError(): void {
        const now = Date.now();
        this.quotaErrors++;
        this.lastQuotaError = now;

        // If we've had multiple quota errors recently, enter warning mode
        if (this.quotaErrors >= 3 && (now - this.lastQuotaError) < 300000) { // 5 minutes
            this.isInQuotaWarning = true;
            console.warn('🚨 Firebase quota warning mode activated - reducing database operations');
        }
    }

    // Check if we should reduce operations due to quota issues
    shouldReduceOperations(): boolean {
        return this.isInQuotaWarning;
    }

    // Reset quota error count (call this when quota resets)
    resetQuotaErrors(): void {
        this.quotaErrors = 0;
        this.isInQuotaWarning = false;
        console.log('✅ Firebase quota errors reset - normal operations resumed');
    }

    // Get current quota status
    getQuotaStatus(): {
        errorCount: number;
        lastError: number;
        inWarningMode: boolean;
        recommendations: string[];
    } {
        const recommendations: string[] = [];

        if (this.isInQuotaWarning) {
            recommendations.push('Consider upgrading Firebase plan');
            recommendations.push('Reduce real-time listeners');
            recommendations.push('Implement caching strategies');
        }

        if (this.quotaErrors > 0) {
            recommendations.push('Monitor Firebase console for usage');
        }

        return {
            errorCount: this.quotaErrors,
            lastError: this.lastQuotaError,
            inWarningMode: this.isInQuotaWarning,
            recommendations
        };
    }
}

// Global quota manager instance
export const quotaManager = QuotaManager.getInstance();
