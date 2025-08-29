# Photo Cleanup Fix for Claim Request Messages

## Problem Description
Previously, when deleting a claim request chat bubble, the system would:
- ✅ Delete the ID photo from Cloudinary
- ❌ **NOT delete the 3 evidence photos** from Cloudinary
- ❌ **NOT delete legacy verification photos** from Cloudinary

This resulted in orphaned evidence photos remaining in Cloudinary storage, which could:
- Accumulate storage costs over time
- Create confusion for administrators
- Waste cloud storage resources

## What Was Fixed
We've updated the `extractMessageImages` function in both frontend and mobile versions to detect and delete **ALL** photos associated with claim request messages:

### Before (Incomplete):
- Only detected `claimData.idPhotoUrl`
- Missed evidence photos and verification photos

### After (Complete):
- ✅ Detects `claimData.idPhotoUrl` (ID photo)
- ✅ Detects `claimData.evidencePhotos[]` (up to 3 evidence photos)
- ✅ Detects `claimData.verificationPhotos[]` (legacy verification photos)

## How It Works Now

### Step 1: Photo Detection
When you delete a claim request message, the system now scans for:
1. **ID Photo**: `claimData.idPhotoUrl`
2. **Evidence Photos**: `claimData.evidencePhotos[].url` (array of up to 3 photos)
3. **Legacy Photos**: `claimData.verificationPhotos[].url` (backward compatibility)

### Step 2: Cloudinary Cleanup
All detected photos are deleted from Cloudinary before the message is removed from the database.

### Step 3: Database Cleanup
After successful photo deletion, the message is deleted and conversation flags are reset.

## Files Modified
- `frontend/src/utils/cloudinary.ts` - Updated `extractMessageImages` function
- `mobile/utils/cloudinary.ts` - Updated `extractMessageImages` function

## Example: What Gets Deleted Now
When you delete a claim request message with:
- 1 ID photo
- 3 evidence photos
- 1 legacy verification photo

**Total: 5 photos will be deleted from Cloudinary** instead of just 1.

## Benefits
1. **Complete Cleanup**: No more orphaned photos in Cloudinary
2. **Cost Savings**: Prevents accumulation of unused storage
3. **Data Integrity**: Ensures complete removal of all associated resources
4. **User Experience**: Seamless cleanup without manual intervention

## Testing
The updated function automatically handles:
- ✅ Handover requests (ID photos only)
- ✅ Claim requests (ID + evidence + verification photos)
- ✅ Regular text messages (no photos)
- ✅ Messages with missing or invalid photo data

## For Non-Programmers
Think of it like cleaning your house - you don't just throw away the main item, you also clean up all the related photos and documents that were attached to it. The system now does this automatically for all types of photos.
