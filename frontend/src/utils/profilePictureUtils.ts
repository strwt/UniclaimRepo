// Utility functions for profile picture handling

export interface ProfilePictureValidation {
    isValid: boolean;
    error?: string;
}

export interface ProfilePictureOptimization {
    maxSize: number; // in bytes
    allowedTypes: string[];
    recommendedDimensions: {
        width: number;
        height: number;
    };
}

// Profile picture validation constants
export const PROFILE_PICTURE_CONFIG: ProfilePictureOptimization = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    recommendedDimensions: {
        width: 400,
        height: 400
    }
};

/**
 * Validates a profile picture file
 */
export const validateProfilePicture = (file: File): ProfilePictureValidation => {
    // Check file type
    if (!PROFILE_PICTURE_CONFIG.allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: `Invalid file type. Allowed types: ${PROFILE_PICTURE_CONFIG.allowedTypes.join(', ')}`
        };
    }

    // Check file size
    if (file.size > PROFILE_PICTURE_CONFIG.maxSize) {
        const maxSizeMB = PROFILE_PICTURE_CONFIG.maxSize / (1024 * 1024);
        return {
            isValid: false,
            error: `File too large. Maximum size: ${maxSizeMB}MB`
        };
    }

    return { isValid: true };
};

/**
 * Formats file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets the recommended dimensions text
 */
export const getRecommendedDimensionsText = (): string => {
    const { width, height } = PROFILE_PICTURE_CONFIG.recommendedDimensions;
    return `${width}x${height} pixels`;
};

/**
 * Checks if a URL is a valid image URL
 */
export const isValidImageUrl = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Creates a data URL from a file for preview
 */
export const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Extracts Cloudinary public ID from a Cloudinary URL
 * This is needed for proper image deletion from Cloudinary
 */
export const extractCloudinaryPublicId = (url: string): string | null => {
    try {
        // Handle different Cloudinary URL formats
        if (url.includes('res.cloudinary.com')) {
            // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image.jpg
            const urlParts = url.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');

            if (uploadIndex === -1) return null;

            let publicIdParts = urlParts.slice(uploadIndex + 1);

            // Remove version if present (v1234567890)
            const versionIndex = publicIdParts.findIndex(part => /^v\d+$/.test(part));
            if (versionIndex !== -1) {
                publicIdParts = publicIdParts.slice(versionIndex + 1);
            }

            // Remove file extension from the last part
            if (publicIdParts.length > 0) {
                const lastPart = publicIdParts[publicIdParts.length - 1];
                const extensionIndex = lastPart.lastIndexOf('.');
                if (extensionIndex !== -1) {
                    publicIdParts[publicIdParts.length - 1] = lastPart.substring(0, extensionIndex);
                }
            }

            const publicId = publicIdParts.join('/');
            return publicId;
        } else if (url.includes('api.cloudinary.com')) {
            // Format: https://api.cloudinary.com/v1_1/cloud_name/image/upload/folder/image.jpg
            const urlParts = url.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');

            if (uploadIndex === -1) return null;

            const publicIdParts = urlParts.slice(uploadIndex + 1);
            const publicId = publicIdParts.join('/');
            return publicId;
        }

        return null;
    } catch (error) {
        console.error('Error extracting Cloudinary public ID:', error);
        return null;
    }
};
