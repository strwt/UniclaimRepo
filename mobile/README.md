# Mobile App - Lost and Found Ticket System

This is a [React Native](https://reactnative.dev) app built with [Expo](https://expo.dev) for managing lost and found tickets.

## Features

- ✅ **Ticket Creation** - Create lost/found item tickets
- ✅ **Image Upload** - Upload images for tickets using Cloudinary
- ✅ **Ticket Management** - View, edit, and delete your tickets
- ✅ **Real-time Updates** - Live updates using Firebase
- ✅ **Image Deletion** - Images are properly deleted from Cloudinary when tickets are deleted
- ✅ **User Authentication** - Secure user login and registration
- ✅ **Responsive Design** - Works on both Android and iOS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `env_template.txt` to `.env` and configure:

#### Cloudinary Configuration
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - Upload preset for image uploads
- `EXPO_PUBLIC_CLOUDINARY_API_KEY` - **NEW**: Admin API key for image deletion
- `EXPO_PUBLIC_CLOUDINARY_API_SECRET` - **NEW**: Admin API secret for image deletion

#### Firebase Configuration
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

### 3. Cloudinary Admin Setup (Required for Delete Functionality)

To enable image deletion when deleting tickets:

1. **Sign up/Login** to [Cloudinary](https://cloudinary.com)
2. **Go to Dashboard** > **Settings** > **Access Keys**
3. **Copy your API Key and API Secret**
4. **Add them to your `.env` file**:
   ```
   EXPO_PUBLIC_CLOUDINARY_API_KEY=your_api_key_here
   EXPO_PUBLIC_CLOUDINARY_API_SECRET=your_api_secret_here
   ```

**⚠️ Security Note:** These credentials have admin privileges. Keep them secret and never commit them to version control.

## Delete Functionality

The delete ticket feature now properly:
- Removes tickets from Firebase Firestore
- Deletes associated images from Cloudinary storage
- Updates the UI immediately
- Shows confirmation dialog before deletion
- Shows success/error feedback
- Prevents multiple delete clicks during operation

## Start the App

```bash
npx expo start
```

## Build

```bash
npx expo build:android  # For Android
npx expo build:ios      # For iOS
```

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/)
- [Expo Router](https://expo.github.io/router/)
