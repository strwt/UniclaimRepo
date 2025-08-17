# Cloudinary Troubleshooting Guide

## Issue: 401 Unauthorized Error when Deleting Images

If you're getting a `401 (Unauthorized)` error when trying to delete tickets/images, follow these steps:

### 1. Check Your .env File

Make sure your `.env` file in the frontend folder contains the correct Cloudinary credentials:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Verify Cloudinary Account Settings

1. **Login to your Cloudinary Dashboard**: https://cloudinary.com/console
2. **Check Account Status**: Ensure your account is active and not suspended
3. **Enable Admin API Access**: Go to Settings > Access Keys and ensure admin API access is enabled
4. **Verify API Key Permissions**: Make sure your API key has the necessary permissions

### 3. Restart Development Server

After updating your `.env` file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### 4. Check Browser Console

Open your browser's developer console and look for:
- Cloudinary configuration logs
- Any error messages about missing environment variables
- Authentication failure details

### 5. Test Configuration

The app now includes automatic testing of your Cloudinary configuration. When you open a ticket modal, check the console for:
- ✅ Configuration validation messages
- ❌ Any error messages about missing credentials

### 6. Common Solutions

#### Missing Environment Variables
- Ensure your `.env` file is in the `frontend` folder
- Check that variable names start with `VITE_`
- Verify there are no extra spaces or quotes

#### Invalid Credentials
- Double-check your API key and secret
- Ensure you copied the full values from Cloudinary
- Try regenerating your API key and secret

#### Account Permissions
- Upgrade to a paid plan if you're on the free tier
- Contact Cloudinary support if admin API access is disabled

### 7. Fallback Behavior

Even if image deletion fails, the app will:
- ✅ Delete the ticket from the database
- ✅ Remove it from your ticket list
- ⚠️ Keep images in Cloudinary storage (this won't affect functionality)

### 8. Still Having Issues?

1. Check the browser console for detailed error messages
2. Verify your Cloudinary account has admin API access
3. Try creating a new Cloudinary account for testing
4. Contact support with the specific error messages you see

## Quick Test

To test if your configuration is working, open any ticket modal and check the browser console. You should see either:
- ✅ Success messages about Cloudinary configuration
- ❌ Clear error messages about what's wrong

This will help identify the exact issue with your setup.
