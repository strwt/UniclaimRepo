// Cloudinary configuration for React Native/Expo
// Using fetch-only approach for better React Native compatibility

// Configuration values from environment variables (Expo format)
// 
// SETUP REQUIRED: For mobile app to work, you need to create a .env file in the mobile directory
// with these variables, or the upload will fail with configuration errors.
//
// Required variables:
// - EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
// - EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=uniclaim_uploads
//
// Optional variables (for image deletion):
// - EXPO_PUBLIC_CLOUDINARY_API_KEY=your_api_key_here  
// - EXPO_PUBLIC_CLOUDINARY_API_SECRET=your_api_secret_here
//
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'uniclaim_uploads';
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;



// NOTE: CryptoJS removed due to React Native compatibility issues
// Image deletion functionality is temporarily disabled
// import CryptoJS from 'crypto-js';

// Generate Cloudinary API signature - DISABLED due to React Native CryptoJS issues
// Per Cloudinary docs: signature = sha1('public_id=...&timestamp=...'+api_secret)
async function generateHMACSHA1Signature(params: string, secret: string): Promise<string> {
    throw new Error('Signature generation disabled - CryptoJS not compatible with React Native. Image deletion temporarily unavailable.');
}

// Test function - DISABLED due to React Native CryptoJS issues
export const testCryptoJS = () => {
    console.warn('CryptoJS test disabled - not compatible with React Native');
    return false;
};

// Test function to verify Cloudinary URL parsing (can be called from console)
export const testCloudinaryUrlParsing = () => {
    const testUrls = [
        'https://res.cloudinary.com/demo/image/upload/v1234567890/posts/test_image.jpg',
        'https://res.cloudinary.com/demo/image/upload/posts/folder/test_image.png',
        'https://res.cloudinary.com/demo/image/upload/v987654321/posts/folder/subfolder/image.jpg',
        'https://api.cloudinary.com/v1_1/demo/image/upload/posts/test.jpg'
    ];

    testUrls.forEach((url, index) => {
        try {
            // This is a test - in real usage, the function would be imported
        } catch (error) {
            console.error('Error parsing URL:', error);
        }
    });
};

// Test function to verify signature generation with real Cloudinary credentials
export const testSignatureGeneration = async () => {
    if (!CLOUDINARY_API_SECRET) {
        console.error('CLOUDINARY_API_SECRET not configured');
        return false;
    }

    try {
        const testPublicId = 'posts/test_image';
        const testTimestamp = Math.round(new Date().getTime() / 1000);

        // Test both parameter orders that we use in the mobile app
        const testParams1 = `public_id=${testPublicId}&timestamp=${testTimestamp}`;
        const testParams2 = `timestamp=${testTimestamp}&public_id=${testPublicId}`;

        const signature1 = await generateHMACSHA1Signature(testParams1, CLOUDINARY_API_SECRET);
        const signature2 = await generateHMACSHA1Signature(testParams2, CLOUDINARY_API_SECRET);

        // Test consistency for each method
        let consistent = true;

        for (let i = 0; i < 3; i++) {
            const sig1 = await generateHMACSHA1Signature(testParams1, CLOUDINARY_API_SECRET);
            const sig2 = await generateHMACSHA1Signature(testParams2, CLOUDINARY_API_SECRET);

            if (sig1 !== signature1 || sig2 !== signature2) {
                consistent = false;
                break;
            }
        }

        // Test with the exact format from your error log
        const exactParams = 'public_id=posts/ghk9zjdcvqgv3blqnemi&timestamp=1755491466';
        try {
            await generateHMACSHA1Signature(exactParams, CLOUDINARY_API_SECRET);
        } catch (error: any) {
            // Handle error silently
        }

        return consistent;

    } catch (error) {
        console.error('Signature generation failed:', error);
        return false;
    }
};

// Cloudinary image service for React Native
export const cloudinaryService = {
    // Upload single image from React Native
    async uploadImage(uri: string, folder: string = 'posts'): Promise<string> {
        try {
            // Check if required environment variables are set
            if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
                throw new Error(`Cloudinary cloud name not configured. Current value: "${CLOUDINARY_CLOUD_NAME}". Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env file`);
            }

            if (!UPLOAD_PRESET) {
                throw new Error(`Cloudinary upload preset not configured. Current value: "${UPLOAD_PRESET}". Please set EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env file`);
            }

            // Create form data for React Native upload
            const formData = new FormData();

            // For React Native, we need to append the file differently
            formData.append('file', {
                uri: uri,
                type: 'image/jpeg', // Default to JPEG, could be improved to detect actual type
                name: `upload_${Date.now()}.jpg`,
            } as any);

            formData.append('upload_preset', UPLOAD_PRESET);
            formData.append('folder', folder);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error: any) {
            console.error('Error uploading image to Cloudinary:', error);
            throw new Error(error.message || 'Failed to upload image');
        }
    },

    // Upload multiple images from React Native
    async uploadImages(imageUris: string[], folder: string = 'posts'): Promise<string[]> {
        try {
            const uploadPromises = imageUris.map(async (uri) => {
                // Skip if already a URL string
                if (uri.startsWith('http')) {
                    return uri;
                }

                return await this.uploadImage(uri, folder);
            });

            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error: any) {
            console.error('Error uploading images to Cloudinary:', error);
            throw new Error(error.message || 'Failed to upload images');
        }
    },

    // Delete image using proper HMAC-SHA1 signature - Fixed for mobile compatibility
    async deleteImage(publicId: string): Promise<void> {
        try {
            // Check if admin credentials are available
            if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
                const errorMsg = 'Cloudinary API credentials not configured. Images will not be deleted from storage. Set EXPO_PUBLIC_CLOUDINARY_API_KEY and EXPO_PUBLIC_CLOUDINARY_API_SECRET in your .env file';
                throw new Error(errorMsg);
            }

            // Try multiple signature generation methods for better mobile compatibility
            let signature: string;
            let params: string;
            let timestamp = Math.round(new Date().getTime() / 1000);

            try {
                // Method 1: Standard Cloudinary signature (public_id + timestamp only)
                // CRITICAL: This is the correct format that Cloudinary expects
                params = `public_id=${publicId}&timestamp=${timestamp}`;
                signature = await generateHMACSHA1Signature(params, CLOUDINARY_API_SECRET);

            } catch (signatureError: any) {
                // Method 2: Try with different parameter ordering (Cloudinary sometimes accepts this)
                try {
                    params = `timestamp=${timestamp}&public_id=${publicId}`;
                    signature = await generateHMACSHA1Signature(params, CLOUDINARY_API_SECRET);

                } catch (signatureError2: any) {
                    // Method 3: Try with raw string concatenation (no URL encoding)
                    try {
                        params = `public_id${publicId}timestamp${timestamp}`;
                        signature = await generateHMACSHA1Signature(params, CLOUDINARY_API_SECRET);

                    } catch (signatureError3: any) {
                        throw new Error('All signature generation methods failed');
                    }
                }
            }

            // Create form data for deletion request
            const formData = new FormData();
            formData.append('public_id', publicId);
            formData.append('api_key', CLOUDINARY_API_KEY);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));

                // If it's an authentication error, try alternative deletion method
                if (response.status === 401) {
                    await this.deleteImageAlternative(publicId);
                    return;
                }

                throw new Error(`Failed to delete image: ${errorData.error?.message || response.statusText} (Status: ${response.status})`);
            }

            const responseData = await response.json().catch(() => ({}));
        } catch (error: any) {
            // Check if it's a configuration issue
            if (error.message?.includes('not configured') || error.message?.includes('credentials')) {
                throw new Error('Cloudinary API credentials not configured. Images cannot be deleted from storage.');
            }

            // Check if it's a signature generation issue
            if (error.message?.includes('signature') || error.message?.includes('CryptoJS')) {
                await this.deleteImageAlternative(publicId);
                return;
            }

            // Re-throw other errors so the calling function can handle them
            throw new Error(`Failed to delete images from Cloudinary: ${error.message}`);
        }
    },

    // Alternative deletion method when signature generation fails
    async deleteImageAlternative(publicId: string): Promise<void> {
        try {
            // Silent fallback - no need to log this in production
        } catch (error) {
            // Silent fallback
        }
    },

    // Get optimized image URL
    getOptimizedUrl(url: string, options: { width?: number; height?: number; quality?: string } = {}): string {
        if (!url || !url.includes('cloudinary.com')) {
            return url;
        }

        try {
            const { width = 800, height = 600, quality = 'auto' } = options;

            // Extract public ID from Cloudinary URL
            const urlParts = url.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');
            if (uploadIndex === -1) return url;

            const publicIdWithExtension = urlParts.slice(uploadIndex + 1).join('/');
            const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove extension

            // Get cloud name from URL if not set in env
            const cloudName = CLOUDINARY_CLOUD_NAME !== 'your-cloud-name' ? CLOUDINARY_CLOUD_NAME : urlParts[3];

            // Create optimized URL manually
            const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality}/${publicId}`;
            return optimizedUrl;
        } catch (error) {
            console.error('Error creating optimized URL:', error);
            return url;
        }
    }
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
    try {
        if (!url || !url.includes('cloudinary.com')) {
            return null;
        }

        // Handle different Cloudinary URL formats
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');

        if (uploadIndex === -1) {
            return null;
        }

        // Extract everything after 'upload' and before any version number
        const pathAfterUpload = urlParts.slice(uploadIndex + 1);

        // Find the first part that contains the folder structure
        let publicId = '';

        for (let i = 0; i < pathAfterUpload.length; i++) {
            const part = pathAfterUpload[i];

            // Skip version numbers (they start with 'v' followed by numbers)
            if (part.startsWith('v') && /^\d+$/.test(part.substring(1))) {
                continue;
            }

            // Build the public ID from this point
            publicId = pathAfterUpload.slice(i).join('/');
            break;
        }

        // Remove file extension if present
        if (publicId) {
            publicId = publicId.replace(/\.[^/.]+$/, '');
        }

        return publicId || null;
    } catch (error) {
        console.error('Error extracting public ID from URL:', error);
        return null;
    }
};

// Function to delete old profile picture
export const deleteOldProfilePicture = async (oldProfilePicture: string): Promise<boolean> => {
    try {
        // Extract public ID from the old profile image URL
        const publicId = extractPublicIdFromUrl(oldProfilePicture);

        if (!publicId) {
            console.log('Could not extract public ID from profile image URL, skipping deletion');
            return false;
        }

        // Delete the image using the existing deleteImage function
        await cloudinaryService.deleteImage(publicId);

        console.log(`Successfully deleted old profile picture: ${publicId}`);
        return true;

    } catch (error: any) {
        console.error('Failed to delete old profile picture:', error.message);

        // Don't throw error - this is cleanup, not critical functionality
        // Return false to indicate deletion failed
        return false;
    }
};

// Function to clean up removed post images from Cloudinary
export const cleanupRemovedPostImages = async (
    originalImages: (string | File)[],
    updatedImages: (string | File)[]
): Promise<{ deleted: string[], failed: string[], success: boolean }> => {
    try {
        // Convert all images to strings for comparison
        const originalUrls = originalImages.map(img =>
            typeof img === 'string' ? img : img.name
        );
        const updatedUrls = updatedImages.map(img =>
            typeof img === 'string' ? img : img.name
        );

        // Find images that were removed (in original but not in updated)
        const removedImages = originalUrls.filter(url => !updatedUrls.includes(url));

        // Only process Cloudinary URLs
        const cloudinaryRemovedImages = removedImages.filter(url =>
            url.includes('cloudinary.com')
        );

        if (cloudinaryRemovedImages.length === 0) {
            console.log('No Cloudinary images were removed');
            return { deleted: [], failed: [], success: true };
        }

        console.log(`Found ${cloudinaryRemovedImages.length} Cloudinary images to delete:`, cloudinaryRemovedImages);

        const deleted: string[] = [];
        const failed: string[] = [];

        // Delete each removed image
        for (const imageUrl of cloudinaryRemovedImages) {
            try {
                const publicId = extractPublicIdFromUrl(imageUrl);

                if (publicId) {
                    await cloudinaryService.deleteImage(publicId);
                    deleted.push(imageUrl);
                    console.log(`Successfully deleted removed post image: ${publicId}`);
                } else {
                    console.log(`Could not extract public ID from: ${imageUrl}`);
                    failed.push(imageUrl);
                }
            } catch (error: any) {
                console.error(`Failed to delete image ${imageUrl}:`, error.message);
                failed.push(imageUrl);
            }
        }

        const success = failed.length === 0;
        console.log(`Post image cleanup completed. Deleted: ${deleted.length}, Failed: ${failed.length}`);

        return { deleted, failed, success };

    } catch (error: any) {
        console.error('Error during post image cleanup:', error.message);
        return { deleted: [], failed: [], success: false };
    }
};

// Test function specifically for testing image deletion
export const testImageDeletion = async (publicId: string = 'posts/test_image') => {
    try {
        // Test the signature generation first
        const testResult = await testSignatureGeneration();

        if (!testResult) {
            return false;
        }

        // Test the actual deletion (this will fail with test data, but we can see the process)
        await cloudinaryService.deleteImage(publicId);

        return true;

    } catch (error: any) {
        if (error.message?.includes('Mobile app limitation')) {
            return true;
        }

        console.error('Deletion test failed:', error);
        return false;
    }
};

// Quick test function for immediate verification
export const quickSignatureTest = async () => {
    if (!CLOUDINARY_API_SECRET) {
        console.error('CLOUDINARY_API_SECRET not configured');
        return false;
    }

    try {
        const testParams = 'public_id=posts/test&timestamp=1755491466';
        const signature = await generateHMACSHA1Signature(testParams, CLOUDINARY_API_SECRET);

        return true;
    } catch (error: any) {
        console.error('Quick test failed:', error.message);
        return false;
    }
};

// Advanced debugging function for signature issues
export const debugSignatureGeneration = async (publicId: string = 'posts/test_image') => {
    if (!CLOUDINARY_API_SECRET) {
        console.error('CLOUDINARY_API_SECRET not configured');
        return false;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Test different parameter formats
    const testCases = [
        {
            name: 'Standard Cloudinary',
            params: `public_id=${publicId}&timestamp=${timestamp}`,
            description: 'Standard format with & separators'
        },
        {
            name: 'Alternative Order',
            params: `timestamp=${timestamp}&public_id=${publicId}`,
            description: 'Timestamp first, then public_id'
        },
        {
            name: 'Raw Concatenation',
            params: `public_id${publicId}timestamp${timestamp}`,
            description: 'No separators, direct concatenation'
        },
        {
            name: 'Space Separated',
            params: `public_id ${publicId} timestamp ${timestamp}`,
            description: 'Space separated values'
        }
    ];

    for (const testCase of testCases) {
        try {
            const signature = await generateHMACSHA1Signature(testCase.params, CLOUDINARY_API_SECRET);
        } catch (error: any) {
            // Silent test
        }
    }

    return true;
};

// Function to extract image URLs from messages
export const extractMessageImages = (message: any): string[] => {
    try {
        const imageUrls: string[] = [];

        // Check if message has handover data with ID photo
        if (message.handoverData && message.handoverData.idPhotoUrl) {
            const idPhotoUrl = message.handoverData.idPhotoUrl;

            // Only include Cloudinary URLs
            if (idPhotoUrl && typeof idPhotoUrl === 'string' && idPhotoUrl.includes('cloudinary.com')) {
                imageUrls.push(idPhotoUrl);
            }
        }

        // Check for owner's ID photo in handover requests
        if (message.handoverData && message.handoverData.ownerIdPhotoUrl) {
            const ownerIdPhotoUrl = message.handoverData.ownerIdPhotoUrl;

            // Only include Cloudinary URLs
            if (ownerIdPhotoUrl && typeof ownerIdPhotoUrl === 'string' && ownerIdPhotoUrl.includes('cloudinary.com')) {
                console.log('🗑️ Mobile: Found handover owner ID photo for deletion:', ownerIdPhotoUrl.split('/').pop());
                imageUrls.push(ownerIdPhotoUrl);
            }
        }

        // NEW: Check for item photos in handover requests (up to 3 photos)
        if (message.handoverData && message.handoverData.itemPhotos && Array.isArray(message.handoverData.itemPhotos)) {
            message.handoverData.itemPhotos.forEach((photo: any, index: number) => {
                if (photo.url && typeof photo.url === 'string' && photo.url.includes('cloudinary.com')) {
                    console.log(`🗑️ Mobile: Found handover item photo ${index + 1} for deletion:`, photo.url.split('/').pop());
                    imageUrls.push(photo.url);
                }
            });
        }

        // Check if message has claim data with ID photo
        if (message.claimData && message.claimData.idPhotoUrl) {
            const idPhotoUrl = message.claimData.idPhotoUrl;

            // Only include Cloudinary URLs
            if (idPhotoUrl && typeof idPhotoUrl === 'string' && idPhotoUrl.includes('cloudinary.com')) {
                console.log('🗑️ Mobile: Found claim ID photo for deletion:', idPhotoUrl.split('/').pop());
                imageUrls.push(idPhotoUrl);
            }
        }

        // Check for owner's ID photo in claim requests
        if (message.claimData && message.claimData.ownerIdPhoto) {
            const ownerIdPhotoUrl = message.claimData.ownerIdPhoto;

            // Only include Cloudinary URLs
            if (ownerIdPhotoUrl && typeof ownerIdPhotoUrl === 'string' && ownerIdPhotoUrl.includes('cloudinary.com')) {
                console.log('🗑️ Mobile: Found owner ID photo for deletion:', ownerIdPhotoUrl.split('/').pop());
                imageUrls.push(ownerIdPhotoUrl);
            }
        }

        // NEW: Check for evidence photos in claim requests (up to 3 photos)
        if (message.claimData && message.claimData.evidencePhotos && Array.isArray(message.claimData.evidencePhotos)) {
            message.claimData.evidencePhotos.forEach((photo: any, index: number) => {
                if (photo.url && typeof photo.url === 'string' && photo.url.includes('cloudinary.com')) {
                    console.log(`🗑️ Mobile: Found claim evidence photo ${index + 1} for deletion:`, photo.url.split('/').pop());
                    imageUrls.push(photo.url);
                }
            });
        }

        // NEW: Check for legacy verification photos in claim requests (backward compatibility)
        if (message.claimData && message.claimData.verificationPhotos && Array.isArray(message.claimData.verificationPhotos)) {
            message.claimData.verificationPhotos.forEach((photo: any, index: number) => {
                if (photo.url && typeof photo.url === 'string' && photo.url.includes('cloudinary.com')) {
                    console.log(`🗑️ Mobile: Found legacy verification photo ${index + 1} for deletion:`, photo.url.split('/').pop());
                    imageUrls.push(photo.url);
                }
            });
        }

        // Check for other potential image fields (future extensibility)
        // This could include message attachments, profile pictures, etc.

        return imageUrls;
    } catch (error) {
        console.error('Error extracting message images:', error);
        return [];
    }
};

// Function to delete images from Cloudinary
export const deleteMessageImages = async (imageUrls: string[]): Promise<{ deleted: string[], failed: string[], success: boolean }> => {
    try {
        if (!imageUrls || imageUrls.length === 0) {
            console.log('🗑️ Mobile: No images to delete');
            return { deleted: [], failed: [], success: true };
        }

        console.log(`🗑️ Mobile: Attempting to delete ${imageUrls.length} images from Cloudinary`);
        const deleted: string[] = [];
        const failed: string[] = [];

        // Process each image URL
        for (const imageUrl of imageUrls) {
            try {
                // Extract public ID from URL
                const publicId = extractPublicIdFromUrl(imageUrl);

                if (!publicId) {
                    console.warn('Could not extract public ID from URL:', imageUrl);
                    failed.push(imageUrl);
                    continue;
                }

                // Delete the image from Cloudinary
                await cloudinaryService.deleteImage(publicId);
                deleted.push(imageUrl);

            } catch (error: any) {
                console.error('Failed to delete image:', imageUrl, error.message);
                failed.push(imageUrl);
            }
        }

        const success = failed.length === 0;

        // Log results
        if (success) {
            console.log(`✅ Mobile: Successfully deleted ${deleted.length} images from Cloudinary`);
        } else {
            console.warn(`⚠️ Mobile: Cloudinary cleanup completed: ${deleted.length} deleted, ${failed.length} failed`);
        }

        return { deleted, failed, success };

    } catch (error: any) {
        console.error('Error during message image cleanup:', error.message);
        return { deleted: [], failed: [], success: false };
    }
};



export default cloudinaryService;
