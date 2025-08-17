# Cloudinary Setup Instructions

## Why Images Aren't Being Deleted

The delete ticket button is currently only deleting data from Firestore but not images from Cloudinary because the Cloudinary API credentials are not properly configured.

## How to Fix This

### Step 1: Create a Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your Cloudinary Credentials
1. Log into your Cloudinary dashboard
2. Go to **Settings** → **Access Keys**
3. Copy your **API Key** and **API Secret**
4. Note your **Cloud Name** (shown in the dashboard header)

### Step 3: Create an Upload Preset
1. In your Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Set **Preset name** to something like `uniclaim_uploads`
5. Set **Signing Mode** to **Unsigned** (for security)
6. Click **Save**

### Step 4: Update Your Environment Variables
1. In your `frontend` folder, create a `.env` file (if it doesn't exist)
2. Add the following variables with your actual values:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_actual_upload_preset
VITE_CLOUDINARY_API_KEY=your_actual_api_key
VITE_CLOUDINARY_API_SECRET=your_actual_api_secret

# Keep your existing Firebase configuration
VITE_FIREBASE_API_KEY=AIzaSyCgN70CTX2wQpcgoSZF6AK0fuq7ikcQgNs
VITE_FIREBASE_AUTH_DOMAIN=uniclaim2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=uniclaim2
VITE_FIREBASE_STORAGE_BUCKET=uniclaim2.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=38339063459
VITE_FIREBASE_APP_ID=1:38339063459:web:3b5650ebe6fabd352b1916
VITE_FIREBASE_MEASUREMENT_ID=G-E693CKMPSY
```

### Step 5: Restart Your Development Server
After updating the `.env` file, restart your development server for the changes to take effect.

## What This Fixes

Once properly configured, the delete ticket button will:
1. ✅ Delete the ticket data from Firestore
2. ✅ Delete all associated images from Cloudinary storage
3. ✅ Provide proper error messages if something goes wrong

## Troubleshooting

### "API credentials not configured" Error
- Make sure you've created a `.env` file in the `frontend` folder
- Verify all Cloudinary environment variables are set correctly
- Restart your development server after making changes

### "Permissions insufficient" Error
- Free Cloudinary accounts may have limited permissions
- Check your account status in the Cloudinary dashboard
- Consider upgrading to a paid plan for full functionality

### Images Still Not Deleting
- Check the browser console for detailed error messages
- Verify your API key and secret are correct
- Ensure your Cloudinary account is active and not suspended

## Security Note

⚠️ **Important**: Never commit your `.env` file to version control. It contains sensitive API credentials that should remain private.

The `.env` file is already in your `.gitignore`, so it won't be accidentally committed.
