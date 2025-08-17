// Cloudinary configuration for React Native/Expo
// Using fetch-only approach for better React Native compatibility

// Configuration values from environment variables (Expo format)
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'uniclaim_uploads';

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

    // Delete image (optional - requires admin API key)
    async deleteImage(publicId: string): Promise<void> {
        try {
            // Note: Deletion requires server-side implementation with admin API key
            // For now, we'll just log the deletion attempt
            console.log('Image deletion requested for:', publicId);

            // You would need to implement this on your backend with admin credentials
            // const response = await fetch('/api/delete-image', {
            //   method: 'DELETE',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ publicId })
            // });
        } catch (error: any) {
            console.error('Error deleting image:', error);
            // Don't throw error for deletion failures
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

export default cloudinaryService;
