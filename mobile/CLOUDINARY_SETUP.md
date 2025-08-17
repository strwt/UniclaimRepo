# Cloudinary Setup for Mobile App

This mobile app now uses Cloudinary for image storage instead of Firebase Storage to avoid additional costs.

## Quick Setup

1. **Create Cloudinary Account**
   - Go to https://cloudinary.com and create a free account
   - Note down your **Cloud Name** from the dashboard

2. **Create Upload Preset**
   - Go to Settings > Upload > Upload presets
   - Click "Add upload preset"
   - Name it: `uniclaim_uploads`
   - Set Mode to: **Unsigned**
   - Set Folder to: `posts` (optional)
   - Save the preset

3. **Configure Environment Variables**
   ```bash
   # Copy the template file
   cp env_template.txt .env
   
   # Edit .env file and replace:
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=uniclaim_uploads
   ```

4. **Restart Development Server**
   ```bash
   npm start
   ```

## How It Works

- Mobile app uploads images directly to Cloudinary
- Images are stored in your Cloudinary account
- URLs are saved to Firebase Firestore
- Both web and mobile apps can view all images
- Free Cloudinary account includes 25GB storage and 25GB bandwidth per month

## Troubleshooting

### "Cloud name not configured" Error
- Make sure your .env file has the correct `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
- Restart your development server after changing .env

### "Upload preset not configured" Error  
- Ensure you created the upload preset named `uniclaim_uploads`
- Make sure it's set to "Unsigned" mode
- Check the preset name matches exactly in your .env file

### Images Not Uploading
- Check your internet connection
- Verify Cloudinary account is active
- Check expo console for detailed error messages

## Benefits of Using Cloudinary

✅ **Free tier available** - No payment required for basic usage  
✅ **Automatic optimization** - Images are compressed and optimized  
✅ **Global CDN** - Fast image loading worldwide  
✅ **Cross-platform** - Works with both web and mobile  
✅ **No Firebase Storage costs** - Avoid Firebase Storage billing
