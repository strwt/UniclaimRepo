# Cloudinary Setup Instructions

We've switched from Firebase Storage to **Cloudinary** (free tier) for image storage to avoid costs.

## Why Cloudinary?
- **Free Tier**: 25 GB storage + 25 GB bandwidth/month
- **No CORS issues**: Works perfectly with localhost
- **Image optimization**: Automatic image compression and resizing
- **Easy to use**: Simple upload API

## Setup Steps:

### 1. Create Cloudinary Account (Free)
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Note down your **Cloud Name** from the dashboard

### 2. Create Upload Preset
1. In Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Set:
   - **Preset name**: `uniclaim_uploads` (or any name you like)
   - **Signing Mode**: **Unsigned** (important for frontend uploads)
   - **Folder**: `posts` (optional, organizes your images)
5. Save the preset

### 3. Environment Variables
Create a `.env` file in the `frontend` folder with:

```env
# Your existing Firebase config...
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Add these new Cloudinary variables:
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=uniclaim_uploads
```

### 4. What Changed in the Code:
- ✅ Installed Cloudinary packages
- ✅ Created `src/utils/cloudinary.ts` for image handling
- ✅ Updated `src/utils/firebase.ts` to use Cloudinary instead of Firebase Storage
- ✅ Your components will now work without CORS issues!

### 5. Test the App:
After setting up the environment variables, your app should work perfectly with image uploads!

## Benefits:
- **No more CORS errors** 🎉
- **Free to use** 💰
- **Better performance** with automatic image optimization
- **25 GB free storage** per month

## Need Help?
If you have any issues setting this up, let me know!
