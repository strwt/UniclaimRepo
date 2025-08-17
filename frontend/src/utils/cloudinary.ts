// Cloudinary configuration for image upload and management
import { Cloudinary } from '@cloudinary/url-gen';

// Configuration values from environment variables
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'uniclaim_uploads';

// Create Cloudinary instance
export const cloudinary = new Cloudinary({
    cloud: {
        cloudName: CLOUDINARY_CLOUD_NAME
    }
});

// Cloudinary image service
export const cloudinaryService = {
    // Upload single image
    async uploadImage(file: File, folder: string = 'posts'): Promise<string> {
        try {
            // Add logging to track uploads
            console.log(`Starting upload for file: ${file.name} (${file.size} bytes) to folder: ${folder}`);

            // Cloudinary configuration is working correctly

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
            console.log(`Successfully uploaded ${file.name} to Cloudinary: ${data.secure_url}`);
            return data.secure_url;
        } catch (error: any) {
            console.error('Error uploading image to Cloudinary:', error);
            throw new Error(error.message || 'Failed to upload image');
        }
    },

    // Upload multiple images
    async uploadImages(files: (File | string)[], folder: string = 'posts'): Promise<string[]> {
        try {
            console.log(`Starting batch upload of ${files.length} files to folder: ${folder}`);

            const uploadPromises = files.map(async (file) => {
                // Skip if already a URL string
                if (typeof file === 'string' && file.startsWith('http')) {
                    console.log(`Skipping already uploaded file: ${file}`);
                    return file;
                }

                if (file instanceof File) {
                    return await this.uploadImage(file, folder);
                }

                throw new Error(`Invalid file type: ${typeof file}`);
            });

            const results = await Promise.all(uploadPromises);
            console.log(`Batch upload completed successfully. ${results.length} files uploaded.`);
            return results;
        } catch (error: any) {
            console.error('Error uploading images:', error);
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

            // Create optimized URL
            const optimizedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_${quality}/${publicId}`;
            return optimizedUrl;
        } catch (error) {
            console.error('Error creating optimized URL:', error);
            return url;
        }
    }
};

export default cloudinaryService;
