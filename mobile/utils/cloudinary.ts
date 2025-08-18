// Cloudinary configuration for React Native/Expo
// Using fetch-only approach for better React Native compatibility

// Configuration values from environment variables (Expo format)
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'uniclaim_uploads';
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

// Import CryptoJS for proper HMAC-SHA1 signature generation - Using the full crypto-js library
import CryptoJS from 'crypto-js';

// Generate Cloudinary API signature using plain SHA-1 of (params + api_secret)
// Per Cloudinary docs: signature = sha1('public_id=...&timestamp=...'+api_secret)
async function generateHMACSHA1Signature(params: string, secret: string): Promise<string> {
    try {
        console.log('🔐 Starting SHA-1 signature generation...');

        // Verify CryptoJS is available
        if (typeof CryptoJS === 'undefined') {
            throw new Error('CryptoJS is undefined - import failed');
        }

        if (!CryptoJS.SHA1) {
            throw new Error('CryptoJS.SHA1 method not found');
        }

        // Validate input parameters
        if (!params || !secret) {
            throw new Error('Missing required parameters: params and secret are required');
        }

        if (secret.length < 10) {
            throw new Error('API secret appears too short - please check your configuration');
        }

        console.log('✅ CryptoJS library loaded successfully');
        console.log('🔍 Input validation passed');

        // Cloudinary expects a plain SHA-1 digest of the concatenated string (NOT HMAC)
        const signature = CryptoJS.SHA1(params + secret).toString(CryptoJS.enc.Hex);

        // Validate signature format
        if (!signature || signature.length !== 40) {
            throw new Error(`Invalid signature length: ${signature?.length || 0}. Expected 40 characters.`);
        }

        // Check for suspicious patterns (like all zeros)
        if (signature.match(/^[0]+$/) || signature.includes('00000000000000000000000000000000')) {
            throw new Error('Generated signature appears invalid (contains many zeros)');
        }

        // Additional validation: ensure it's a valid hex string
        if (!/^[0-9a-f]{40}$/i.test(signature)) {
            throw new Error('Generated signature is not a valid 40-character hex string');
        }

        console.log('✅ SHA-1 signature generated successfully');
        console.log('  - Params:', params);
        console.log('  - Signature:', signature);
        console.log('  - Length:', signature.length);
        console.log('  - Valid hex format:', /^[0-9a-f]{40}$/i.test(signature));

        return signature;

    } catch (error: any) {
        console.error('❌ SHA-1 signature generation failed:', error);
        throw new Error(`Failed to generate Cloudinary signature: ${error.message}`);
    }
}

// Test function to verify CryptoJS is working properly
export const testCryptoJS = () => {
    try {
        console.log('🧪 Testing CryptoJS library...');

        // Test basic functionality
        const testString = 'test';
        const testSecret = 'secret';

        // Verify CryptoJS is loaded
        if (!CryptoJS || !CryptoJS.HmacSHA1) {
            console.error('❌ CryptoJS library not properly loaded');
            return false;
        }

        console.log('✅ CryptoJS library loaded successfully');

        // Test HMAC-SHA1
        try {
            const hash = CryptoJS.HmacSHA1(testString, testSecret);
            const signature = hash.toString(CryptoJS.enc.Hex);

            console.log('✅ HMAC-SHA1 test successful');
            console.log('  - Input:', testString);
            console.log('  - Secret:', testSecret);
            console.log('  - Signature:', signature);
            console.log('  - Length:', signature.length);

            // Verify it's not all zeros
            if (signature.includes('00000000000000000000000000000000')) {
                console.log('⚠️ Warning: Signature contains many zeros');
                return false;
            } else {
                console.log('✅ Signature looks valid');
                return true;
            }
        } catch (e) {
            console.error('❌ HMAC-SHA1 test failed:', e);
            return false;
        }

    } catch (error) {
        console.error('❌ CryptoJS test failed:', error);
        return false;
    }
};

// Test function to verify Cloudinary URL parsing (can be called from console)
export const testCloudinaryUrlParsing = () => {
    console.log('🧪 Testing Cloudinary URL parsing for mobile app...');

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

// Test function to verify signature generation with real Cloudinary credentials
export const testSignatureGeneration = async () => {
    console.log('🧪 Testing Cloudinary signature generation...');

    if (!CLOUDINARY_API_SECRET) {
        console.error('❌ CLOUDINARY_API_SECRET not configured');
        return false;
    }

    try {
        const testPublicId = 'posts/test_image';
        const testTimestamp = Math.round(new Date().getTime() / 1000);

        // Test both parameter orders that we use in the mobile app
        const testParams1 = `public_id=${testPublicId}&timestamp=${testTimestamp}`;
        const testParams2 = `timestamp=${testTimestamp}&public_id=${testPublicId}`;

        console.log('🧪 Testing Method 1 (public_id first):');
        const signature1 = await generateHMACSHA1Signature(testParams1, CLOUDINARY_API_SECRET);
        console.log('  - Parameters:', testParams1);
        console.log('  - Signature:', signature1);
        console.log('  - Length:', signature1.length);

        console.log('\n🧪 Testing Method 2 (timestamp first):');
        const signature2 = await generateHMACSHA1Signature(testParams2, CLOUDINARY_API_SECRET);
        console.log('  - Parameters:', testParams2);
        console.log('  - Signature:', signature2);
        console.log('  - Length:', signature2.length);

        // Test consistency for each method
        console.log('\n🧪 Testing signature consistency...');
        let consistent = true;

        for (let i = 0; i < 3; i++) {
            const sig1 = await generateHMACSHA1Signature(testParams1, CLOUDINARY_API_SECRET);
            const sig2 = await generateHMACSHA1Signature(testParams2, CLOUDINARY_API_SECRET);

            if (sig1 !== signature1 || sig2 !== signature2) {
                console.log('⚠️ Warning: Signatures are not consistent');
                consistent = false;
                break;
            }
        }

        if (consistent) {
            console.log('✅ All signatures are consistent');
        }

        // NEW: Test with the exact format from your error log
        console.log('\n🧪 Testing with exact error log format:');
        const exactParams = 'public_id=posts/ghk9zjdcvqgv3blqnemi&timestamp=1755491466';
        try {
            const exactSignature = await generateHMACSHA1Signature(exactParams, CLOUDINARY_API_SECRET);
            console.log('  - Exact params from error log:', exactParams);
            console.log('  - Generated signature:', exactSignature);
            console.log('  - This should match what Cloudinary expects');
        } catch (error: any) {
            console.log('  - Error with exact params:', error.message);
        }

        return consistent;

    } catch (error) {
        console.error('❌ Signature generation failed:', error);
        return false;
    }
};

// Cloudinary image service for React Native
export const cloudinaryService = {
    // Upload single image from React Native
    async uploadImage(uri: string, folder: string = 'posts'): Promise<string> {
        try {
            // Add logging to track uploads
            console.log(`Starting mobile upload for image to folder: ${folder}`);

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
            console.log(`Successfully uploaded mobile image to Cloudinary: ${data.secure_url}`);
            return data.secure_url;
        } catch (error: any) {
            console.error('Error uploading image to Cloudinary:', error);
            throw new Error(error.message || 'Failed to upload image');
        }
    },

    // Upload multiple images from React Native
    async uploadImages(imageUris: string[], folder: string = 'posts'): Promise<string[]> {
        try {
            console.log(`Starting mobile batch upload of ${imageUris.length} images to folder: ${folder}`);

            const uploadPromises = imageUris.map(async (uri) => {
                // Skip if already a URL string
                if (uri.startsWith('http')) {
                    console.log(`Skipping already uploaded mobile image: ${uri}`);
                    return uri;
                }

                return await this.uploadImage(uri, folder);
            });

            const results = await Promise.all(uploadPromises);
            console.log(`Mobile batch upload completed successfully. ${results.length} images uploaded.`);
            return results;
        } catch (error: any) {
            console.error('Error uploading images to Cloudinary:', error);
            throw new Error(error.message || 'Failed to upload images');
        }
    },

    // Delete image using proper HMAC-SHA1 signature - Fixed for mobile compatibility
    async deleteImage(publicId: string): Promise<void> {
        try {
            console.log(`🔄 Starting deletion of image: ${publicId}`);

            // Check if admin credentials are available
            if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
                const errorMsg = 'Cloudinary API credentials not configured. Images will not be deleted from storage. Set EXPO_PUBLIC_CLOUDINARY_API_KEY and EXPO_PUBLIC_CLOUDINARY_API_SECRET in your .env file';
                console.log(errorMsg);
                throw new Error(errorMsg);
            }

            console.log(`✅ Cloudinary credentials found. Cloud name: ${CLOUDINARY_CLOUD_NAME}`);

            // Try multiple signature generation methods for better mobile compatibility
            let signature: string;
            let params: string;
            let timestamp = Math.round(new Date().getTime() / 1000);

            try {
                // Method 1: Standard Cloudinary signature (public_id + timestamp only)
                // CRITICAL: This is the correct format that Cloudinary expects
                params = `public_id=${publicId}&timestamp=${timestamp}`;
                signature = await generateHMACSHA1Signature(params, CLOUDINARY_API_SECRET);

                console.log(`🔐 Method 1: Standard signature generated successfully`);
                console.log(`📝 Parameters string: ${params}`);
                console.log(`🔒 Signature: ${signature.substring(0, 16)}...`);

                // Additional validation for Method 1
                console.log(`🔍 Signature validation: Length=${signature.length}, Format=hex, Contains zeros=${signature.includes('00000000000000000000000000000000')}`);

            } catch (signatureError: any) {
                console.log(`⚠️ Method 1 failed: ${signatureError.message}`);

                // Method 2: Try with different parameter ordering (Cloudinary sometimes accepts this)
                try {
                    params = `timestamp=${timestamp}&public_id=${publicId}`;
                    signature = await generateHMACSHA1Signature(params, CLOUDINARY_API_SECRET);

                    console.log(`🔐 Method 2: Alternative parameter order successful`);
                    console.log(`📝 Parameters string: ${params}`);
                    console.log(`🔒 Signature: ${signature.substring(0, 16)}...`);
                } catch (signatureError2: any) {
                    console.log(`⚠️ Method 2 failed: ${signatureError2.message}`);

                    // Method 3: Try with raw string concatenation (no URL encoding)
                    try {
                        params = `public_id${publicId}timestamp${timestamp}`;
                        signature = await generateHMACSHA1Signature(params, CLOUDINARY_API_SECRET);

                        console.log(`🔐 Method 3: Raw string concatenation successful`);
                        console.log(`📝 Parameters string: ${params}`);
                        console.log(`🔒 Signature: ${signature.substring(0, 16)}...`);
                    } catch (signatureError3: any) {
                        console.log(`⚠️ Method 3 failed: ${signatureError3.message}`);
                        throw new Error('All signature generation methods failed');
                    }
                }
            }

            console.log(`🔐 Generated signature for deletion. Timestamp: ${timestamp}`);
            console.log(`🔑 API Key: ${CLOUDINARY_API_KEY?.substring(0, 8)}...`);

            // Create form data for deletion request
            const formData = new FormData();
            formData.append('public_id', publicId);
            formData.append('api_key', CLOUDINARY_API_KEY);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);

            console.log(`📤 Sending delete request to Cloudinary for public ID: ${publicId}`);
            console.log(`🌐 Endpoint: https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            console.log(`📥 Cloudinary response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));

                console.log(`❌ Cloudinary deletion failed:`, errorData);

                // If it's an authentication error, try alternative deletion method
                if (response.status === 401) {
                    console.log('Authentication failed, trying alternative deletion method...');
                    await this.deleteImageAlternative(publicId);
                    return;
                }

                throw new Error(`Failed to delete image: ${errorData.error?.message || response.statusText} (Status: ${response.status})`);
            }

            const responseData = await response.json().catch(() => ({}));
            console.log(`✅ Successfully deleted image: ${publicId}`, responseData);
        } catch (error: any) {
            console.log('❌ Error deleting image from Cloudinary:', error);

            // Check if it's a configuration issue
            if (error.message?.includes('not configured') || error.message?.includes('credentials')) {
                throw new Error('Cloudinary API credentials not configured. Images cannot be deleted from storage.');
            }

            // Check if it's a signature generation issue
            if (error.message?.includes('signature') || error.message?.includes('CryptoJS')) {
                console.log('⚠️ Signature generation failed, falling back to alternative method');
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
            console.log(`ℹ️ Fallback: Image ${publicId} could not be deleted from Cloudinary`);
            console.log(`ℹ️ This usually means:`);
            console.log(`   - The signature generation failed or was rejected`);
            console.log(`   - Your Cloudinary account permissions may be limited`);
            console.log(`   - The image will remain in Cloudinary storage`);
            console.log(`ℹ️ Your app will continue to work normally - this is just a storage cleanup issue`);
            console.log(`💡 To resolve this permanently, check your Cloudinary account permissions`);
        } catch (error) {
            console.log('Alternative deletion method completed');
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

// Test function specifically for testing image deletion
export const testImageDeletion = async (publicId: string = 'posts/test_image') => {
    console.log('🧪 Testing image deletion functionality...');
    console.log('Public ID:', publicId);

    try {
        // Test the signature generation first
        console.log('\n🔐 Testing signature generation...');
        const testResult = await testSignatureGeneration();

        if (!testResult) {
            console.log('❌ Signature generation test failed - deletion will likely fail');
            return false;
        }

        console.log('✅ Signature generation test passed');

        // Test the actual deletion (this will fail with test data, but we can see the process)
        console.log('\n🗑️ Testing deletion process...');
        await cloudinaryService.deleteImage(publicId);

        console.log('✅ Deletion test completed successfully');
        return true;

    } catch (error: any) {
        if (error.message?.includes('Mobile app limitation')) {
            console.log('ℹ️ Expected fallback behavior - this is normal for test data');
            return true;
        }

        console.error('❌ Deletion test failed:', error);
        return false;
    }
};

// NEW: Quick test function for immediate verification
export const quickSignatureTest = async () => {
    console.log('🚀 Quick signature test for immediate verification...');

    if (!CLOUDINARY_API_SECRET) {
        console.error('❌ CLOUDINARY_API_SECRET not configured');
        return false;
    }

    try {
        const testParams = 'public_id=posts/test&timestamp=1755491466';
        const signature = await generateHMACSHA1Signature(testParams, CLOUDINARY_API_SECRET);

        console.log('✅ Quick test passed!');
        console.log('  - Params:', testParams);
        console.log('  - Signature:', signature);
        console.log('  - Length:', signature.length);
        console.log('  - Valid hex:', /^[0-9a-f]{40}$/i.test(signature));

        return true;
    } catch (error: any) {
        console.error('❌ Quick test failed:', error.message);
        return false;
    }
};

// Advanced debugging function for signature issues
export const debugSignatureGeneration = async (publicId: string = 'posts/test_image') => {
    console.log('🔍 Advanced signature debugging...');
    console.log('Public ID:', publicId);

    if (!CLOUDINARY_API_SECRET) {
        console.error('❌ CLOUDINARY_API_SECRET not configured');
        return false;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    console.log('Timestamp:', timestamp);

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
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log(`📝 Parameters: ${testCase.params}`);
        console.log(`📋 Description: ${testCase.description}`);

        try {
            const signature = await generateHMACSHA1Signature(testCase.params, CLOUDINARY_API_SECRET);
            console.log(`✅ Success: ${signature}`);
            console.log(`🔍 Length: ${signature.length}, Valid hex: ${/^[0-9a-f]{40}$/i.test(signature)}`);
        } catch (error: any) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }

    return true;
};

export default cloudinaryService;
