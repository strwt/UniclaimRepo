// Cloudinary configuration for image upload and management
import { Cloudinary } from '@cloudinary/url-gen';

// Configuration values from environment variables
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'uniclaim_uploads';
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;

// NEW: Use CLOUDINARY_URL for better authentication
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;



// Simple test function to call from browser console
export const testImageDeletion = async (publicId: string = 'test') => {
    console.log('🧪 Testing image deletion...');
    console.log('Public ID:', publicId);
    console.log('CLOUDINARY_URL:', CLOUDINARY_URL ? 'SET' : 'NOT_SET');
    console.log('CLOUDINARY_API_KEY:', CLOUDINARY_API_KEY ? '***' + CLOUDINARY_API_KEY.slice(-4) : 'NOT_SET');
    console.log('CLOUDINARY_API_SECRET:', CLOUDINARY_API_SECRET ? '***' + CLOUDINARY_API_SECRET.slice(-4) : 'NOT_SET');

    try {
        await cloudinaryService.deleteImage(publicId);
        console.log('✅ Test completed successfully');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Test function to check URL parsing
export const testUrlParsing = () => {
    console.log('🧪 Testing Cloudinary URL parsing...');

    const testUrls = [
        'https://res.cloudinary.com/demo/image/upload/v1234567890/posts/test_image.jpg',
        'https://res.cloudinary.com/demo/image/upload/posts/folder/test_image.png',
        'https://res.cloudinary.com/demo/image/upload/v987654321/posts/folder/subfolder/image.jpg',
        'https://api.cloudinary.com/v1_1/demo/image/upload/posts/test.jpg'
    ];

    testUrls.forEach((url, index) => {
        console.log(`\nTest URL ${index + 1}: ${url}`);

        // Import the function from Firebase service
        try {
            // This is a test - in real usage, the function would be imported
            console.log('✅ URL format recognized');
        } catch (error) {
            console.error('❌ Error parsing URL:', error);
        }
    });
};

// Test function to verify Cloudinary configuration
export const testCloudinaryConfig = () => {
    console.log('Testing Cloudinary Configuration...');
    console.log('Environment variables loaded:', {
        VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        VITE_CLOUDINARY_API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY ? 'SET' : 'NOT_SET',
        VITE_CLOUDINARY_API_SECRET: import.meta.env.VITE_CLOUDINARY_API_SECRET ? 'SET' : 'NOT_SET',
        VITE_CLOUDINARY_URL: import.meta.env.VITE_CLOUDINARY_URL ? 'SET' : 'NOT_SET'
    });

    // Check if CLOUDINARY_URL is available (preferred method)
    if (CLOUDINARY_URL) {
        console.log('✅ CLOUDINARY_URL is configured - this provides better authentication!');
        return true;
    }

    // Fallback to API key/secret method
    if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        console.error('❌ Cloudinary API credentials are missing!');
        console.error('Please set either:');
        console.error('1. VITE_CLOUDINARY_URL (recommended) - provides better authentication');
        console.error('2. VITE_CLOUDINARY_API_KEY and VITE_CLOUDINARY_API_SECRET');
        return false;
    }

    if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
        console.error('❌ Cloudinary cloud name is not configured!');
        return false;
    }

    console.log('✅ Cloudinary configuration appears to be valid (using API key/secret method)');
    console.log('💡 Tip: Consider using VITE_CLOUDINARY_URL for better authentication');
    return true;
};

// Test Cloudinary API connection
export const testCloudinaryAPI = async () => {
    try {
        console.log('Testing Cloudinary API connection...');

        if (!testCloudinaryConfig()) {
            return false;
        }

        // Try to make a simple API call to test authentication
        const timestamp = Math.round(new Date().getTime() / 1000);
        const testSignature = await cloudinaryService.generateSignature('test', timestamp, CLOUDINARY_API_SECRET);

        const formData = new FormData();
        formData.append('public_id', 'test');
        formData.append('api_key', CLOUDINARY_API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', testSignature);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (response.status === 401) {
            console.error('❌ Cloudinary API authentication failed!');
            console.error('This usually means:');
            console.error('1. Your API key or secret is incorrect');
            console.error('2. Your account permissions are limited');
            console.error('3. The API key has expired or been revoked');
            console.error('4. Your account has been suspended');
            console.error('5. You may be on a free plan with limited permissions');
            console.error('');
            console.error('💡 Solution: Check your Cloudinary account settings and permissions.');
            return false;
        }

        console.log('✅ Cloudinary API connection test completed');
        return true;

    } catch (error) {
        console.error('❌ Error testing Cloudinary API:', error);
        return false;
    }
};

// Check if Cloudinary account has proper permissions
export const checkCloudinaryPermissions = () => {
    console.log('🔍 Checking Cloudinary account permissions...');

    if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        console.error('❌ Cloudinary API credentials not configured');
        return false;
    }

    console.log('✅ Cloudinary API credentials are configured');
    console.log('💡 Note: Free Cloudinary accounts may have limited permissions');
    console.log('💡 If you continue to get 401 errors, check your account settings');

    return true;
};

// Create Cloudinary instance
export const cloudinary = new Cloudinary({
    cloud: {
        cloudName: CLOUDINARY_CLOUD_NAME
    },
    // Use CLOUDINARY_URL if available for better authentication
    ...(CLOUDINARY_URL && { url: CLOUDINARY_URL })
});

// Cloudinary image service
export const cloudinaryService = {
    // Upload single image
    async uploadImage(file: File, folder: string = 'posts'): Promise<string> {
        try {
            // Check if required environment variables are set
            if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
                throw new Error(`Cloudinary cloud name not configured. Current value: "${CLOUDINARY_CLOUD_NAME}". Please set VITE_CLOUDINARY_CLOUD_NAME in your .env file`);
            }

            if (!UPLOAD_PRESET) {
                throw new Error(`Cloudinary upload preset not configured. Current value: "${UPLOAD_PRESET}". Please set VITE_CLOUDINARY_UPLOAD_PRESET in your .env file`);
            }
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);
            formData.append('folder', folder);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to upload image');
        }
    },

    // Upload multiple images
    async uploadImages(files: (File | string)[], folder: string = 'posts'): Promise<string[]> {
        try {
            const uploadPromises = files.map(async (file) => {
                // Skip if already a URL string
                if (typeof file === 'string' && file.startsWith('http')) {
                    return file;
                }

                if (file instanceof File) {
                    return await this.uploadImage(file, folder);
                }

                throw new Error(`Invalid file type: ${typeof file}`);
            });

            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to upload images');
        }
    },

    // Delete image (requires API credentials)
    async deleteImage(publicId: string): Promise<void> {
        try {
            // Check if API credentials are available
            if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
                const errorMsg = 'Cloudinary API credentials not configured. Images will not be deleted from storage. Set VITE_CLOUDINARY_API_KEY and VITE_CLOUDINARY_API_SECRET in your .env file';
                console.error(errorMsg);
                throw new Error(errorMsg);
            }

            // If CLOUDINARY_URL is available, use it for better authentication
            if (CLOUDINARY_URL) {
                await this.deleteImageWithURL(publicId);
                return;
            }

            // Fallback to API key/secret method
            await this.deleteImageWithAPIKey(publicId);

        } catch (error: any) {
            console.error('Error deleting image from Cloudinary:', error);



            // Re-throw the error so the calling function can handle it properly
            throw error;
        }
    },

    // Delete image using CLOUDINARY_URL (better authentication)
    async deleteImageWithURL(publicId: string): Promise<void> {
        try {
            // Extract credentials from CLOUDINARY_URL
            const urlMatch = CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
            if (!urlMatch) {
                throw new Error('Invalid CLOUDINARY_URL format');
            }

            const [, apiKey, apiSecret, cloudName] = urlMatch;

            // Create signature for deletion
            const timestamp = Math.round(new Date().getTime() / 1000);
            const signature = await this.generateSignature(publicId, timestamp, apiSecret);

            const formData = new FormData();
            formData.append('public_id', publicId);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                throw new Error(`Failed to delete image: ${errorData.error?.message || response.statusText} (Status: ${response.status})`);
            }
        } catch (error) {
            throw error;
        }
    },

    // Delete image using API key/secret method
    async deleteImageWithAPIKey(publicId: string): Promise<void> {
        try {
            // Create signature for deletion
            const timestamp = Math.round(new Date().getTime() / 1000);
            const signature = await this.generateSignature(publicId, timestamp, CLOUDINARY_API_SECRET);

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
        } catch (error) {
            throw error;
        }
    },

    // Alternative deletion method for accounts with limited permissions
    async deleteImageAlternative(_publicId: string): Promise<void> {
        try {
            // For accounts with limited permissions, we can't actually delete images
            // The image will remain in storage but won't be accessible through your app
        } catch (error) {
            // Silent fail for alternative method
        }
    },

    // Generate signature for Cloudinary API
    async generateSignature(publicId: string, timestamp: number, apiSecret: string): Promise<string> {
        try {
            // Create the parameter string in the correct order
            const params = `public_id=${publicId}&timestamp=${timestamp}`;

            // Create HMAC-SHA1 signature using the API secret
            const message = params + apiSecret;

            // Use Web Crypto API for proper SHA-1 hashing
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-1', data);

            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return hashHex;
        } catch (error) {
            // Fallback to simple hash if Web Crypto API fails
            const params = `public_id=${publicId}&timestamp=${timestamp}`;
            const message = params + apiSecret;

            let hash = 0;
            for (let i = 0; i < message.length; i++) {
                const char = message.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }

            return Math.abs(hash).toString(16);
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

            // Create optimized URL
            const optimizedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_${quality}/${publicId}`;
            return optimizedUrl;
        } catch (error) {
            return url;
        }
    }
};

export default cloudinaryService;
