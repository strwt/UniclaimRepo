# Frontend README

## Setup Instructions

### Environment Variables

Copy `env_temp.txt` to `.env` and configure the following:

#### Firebase Configuration
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

#### Cloudinary Configuration
- `VITE_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Upload preset for image uploads
- `VITE_CLOUDINARY_API_KEY` - **NEW**: Admin API key for image deletion
- `VITE_CLOUDINARY_API_SECRET` - **NEW**: Admin API secret for image deletion

### Cloudinary Admin Setup (Required for Delete Functionality)

To enable image deletion when deleting tickets, you need to set up Cloudinary admin credentials:

1. **Sign up/Login** to [Cloudinary](https://cloudinary.com)
2. **Go to Dashboard** > **Settings** > **Access Keys**
3. **Copy your API Key and API Secret**
4. **Add them to your `.env` file**:
   ```
   VITE_CLOUDINARY_API_KEY=your_api_key_here
   VITE_CLOUDINARY_API_SECRET=your_api_secret_here
   ```

**⚠️ Security Note:** These credentials have admin privileges. Keep them secret and never commit them to version control.

### Features

- ✅ **Ticket Creation** - Create lost/found item tickets
- ✅ **Image Upload** - Upload up to 3 images per ticket
- ✅ **Ticket Management** - View, edit, and delete your tickets
- ✅ **Real-time Updates** - Live updates using Firebase
- ✅ **Image Deletion** - Images are properly deleted from Cloudinary when tickets are deleted
- ✅ **User Authentication** - Secure user login and registration
- ✅ **Responsive Design** - Works on desktop and mobile

### Delete Functionality

The delete ticket feature now properly:
- Removes tickets from Firebase Firestore
- Deletes associated images from Cloudinary storage
- Updates the UI immediately
- Shows success/error feedback
- Prevents multiple delete clicks during operation

## Installation

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
