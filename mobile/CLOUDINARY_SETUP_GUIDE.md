# 🚀 Cloudinary Setup Guide - Fix Your Image Deletion Issue

## 🔍 **Root Cause Identified**

The issue is **NOT** with our HMAC-SHA1 signature generation (which is working perfectly). The problem is that **your Cloudinary environment variables are not configured**, so the app can't authenticate with Cloudinary for deletion operations.

## 📋 **What You Need to Do**

### **Step 1: Get Your Cloudinary Credentials**

1. **Go to your Cloudinary Dashboard**: https://cloudinary.com/console
2. **Find your Cloud Name** (it's `dmos0vv6a` based on your logs)
3. **Get your API Key and Secret**:
   - Go to **Settings** > **Access Keys**
   - Copy your **API Key** and **API Secret**

### **Step 2: Create the .env File**

Create a file named `.env` in your `mobile` folder with this content:

```bash
# Cloudinary Configuration for Mobile App
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dmos0vv6a
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=uniclaim_uploads
EXPO_PUBLIC_CLOUDINARY_API_KEY=your_actual_api_key_here
EXPO_PUBLIC_CLOUDINARY_API_SECRET=your_actual_api_secret_here

# Firebase Configuration (already set)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyCgN70CTX2wQpcgoSZF6AK0fuq7ikcQgNs
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=uniclaim2.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=uniclaim2
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=uniclaim2.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=38339063459
EXPO_PUBLIC_FIREBASE_APP_ID=1:38339063459:web:3b5650ebe6fabd352b1916
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-E693CKMPSY
```

**Replace these values:**
- `your_actual_api_key_here` → Your real Cloudinary API Key
- `your_actual_api_secret_here` → Your real Cloudinary API Secret

### **Step 3: Create Upload Preset**

1. In your Cloudinary Dashboard, go to **Settings** > **Upload**
2. Click **Add upload preset**
3. Name it: `uniclaim_uploads`
4. Set **Signing Mode** to: `Unsigned`
5. Set **Folder** to: `posts`
6. Click **Save**

### **Step 4: Restart Your App**

After creating the `.env` file:
1. **Stop your Expo development server** (Ctrl+C)
2. **Restart it** with `npm start` or `expo start`
3. **Test the image deletion** again

## 🔐 **Why This Fixes the Issue**

- **Before**: Environment variables were `NOT_SET`, so the app couldn't authenticate with Cloudinary
- **After**: With proper credentials, the app can generate valid signatures and authenticate deletion requests
- **Result**: Image deletion will work properly instead of getting 401 "Invalid Signature" errors

## 🧪 **Test the Fix**

After setting up the `.env` file, run this diagnostic script to verify:

```bash
node debug-cloudinary-credentials.js
```

You should see:
- ✅ **Credentials Status: VALID**
- All environment variables properly loaded
- No more "NOT_SET" values

## 🎯 **Expected Results**

1. **Image uploads** will continue to work (they already do)
2. **Image deletions** will now work properly
3. **No more 401 errors** from Cloudinary
4. **Proper cleanup** of images when posts are deleted

## 🆘 **If It Still Doesn't Work**

1. **Check your Cloudinary account plan** - Free accounts often can't delete images
2. **Verify your credentials** are correct in the dashboard
3. **Ensure the upload preset** is set to "Unsigned" mode
4. **Check that your cloud name** matches exactly

## 💡 **Pro Tip**

The HMAC-SHA1 signature generation is working perfectly - the issue was just missing credentials. Once you add the `.env` file with your real Cloudinary credentials, everything should work smoothly!

---

**Next Steps:**
1. Create the `.env` file with your credentials
2. Restart your Expo server
3. Test image deletion
4. Enjoy working image cleanup! 🎉
