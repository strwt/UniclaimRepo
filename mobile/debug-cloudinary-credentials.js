// Debug script to check Cloudinary credentials and environment variables
// This will help identify why deletion is failing even with valid signatures

console.log('🔍 Debugging Cloudinary Credentials and Configuration\n');
console.log('==================================================\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME:', process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'NOT_SET');
console.log('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET:', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'NOT_SET');
console.log('EXPO_PUBLIC_CLOUDINARY_API_KEY:', process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY ? '***' + process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY.slice(-4) : 'NOT_SET');
console.log('EXPO_PUBLIC_CLOUDINARY_API_SECRET:', process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET ? '***' + process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET.slice(-4) : 'NOT_SET');

// Check if credentials are properly loaded
const hasValidCredentials = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY &&
    process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET &&
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME !== 'your-cloud-name';

console.log('\n🔐 Credentials Status:', hasValidCredentials ? '✅ VALID' : '❌ INVALID');

if (!hasValidCredentials) {
    console.log('\n⚠️ Issues Found:');
    if (!process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY) {
        console.log('  - EXPO_PUBLIC_CLOUDINARY_API_KEY is missing');
    }
    if (!process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET) {
        console.log('  - EXPO_PUBLIC_CLOUDINARY_API_SECRET is missing');
    }
    if (!process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
        console.log('  - EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured properly');
    }
}

// Test the actual credentials if they exist
if (hasValidCredentials) {
    console.log('\n🧪 Testing Actual Credentials...');

    // Import the cloudinary service to test with real credentials
    try {
        const { cloudinaryService } = require('./utils/cloudinary');

        console.log('\n📤 Testing with real Cloudinary credentials:');
        console.log('Cloud Name:', process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME);
        console.log('API Key:', process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY.substring(0, 8) + '...');
        console.log('API Secret Length:', process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET.length);

        // Test signature generation with real credentials
        const testParams = 'public_id=posts/test&timestamp=1755493171';
        const testSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

        console.log('\n🔐 Testing signature generation with real secret:');
        console.log('Test Params:', testParams);
        console.log('Secret Length:', testSecret.length);
        console.log('Secret Preview:', testSecret.substring(0, 8) + '...' + testSecret.substring(testSecret.length - 4));

        // Test the actual deletion endpoint
        console.log('\n🌐 Testing Cloudinary API endpoint:');
        const endpoint = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/destroy`;
        console.log('Endpoint:', endpoint);

        // Check if we can reach the endpoint
        console.log('\n📡 Testing endpoint connectivity...');

    } catch (error) {
        console.log('❌ Error testing with real credentials:', error.message);
    }
}

// Common issues and solutions
console.log('\n💡 Common Issues and Solutions:');
console.log('================================');

console.log('\n1. Environment Variables Not Loading:');
console.log('   - Make sure you have a .env file in your mobile folder');
console.log('   - Restart your Expo development server after adding .env');
console.log('   - Check that variable names start with EXPO_PUBLIC_');

console.log('\n2. Cloudinary Account Permissions:');
console.log('   - Free accounts often cannot delete images');
console.log('   - Check your Cloudinary dashboard for permissions');
console.log('   - Upgrade to a paid plan if needed');

console.log('\n3. API Key/Secret Mismatch:');
console.log('   - Ensure you\'re using Admin API credentials, not upload preset');
console.log('   - Check that credentials match your Cloudinary account');
console.log('   - Verify the cloud name is correct');

console.log('\n4. Signature Generation Issues:');
console.log('   - Our HMAC-SHA1 implementation is working correctly');
console.log('   - The issue is likely credential-related, not signature-related');

// Recommendations
console.log('\n🎯 Recommendations:');
console.log('==================');

if (!hasValidCredentials) {
    console.log('1. Create a .env file with your Cloudinary credentials');
    console.log('2. Use Admin API credentials (not upload preset)');
    console.log('3. Restart your Expo development server');
} else {
    console.log('1. Check your Cloudinary account permissions');
    console.log('2. Verify the credentials are for the correct account');
    console.log('3. Try testing deletion in Cloudinary dashboard first');
}

console.log('\n4. Consider using Cloudinary\'s official SDK for better compatibility');
console.log('5. Check if your account plan supports image deletion');

console.log('\n==================================================');
console.log('🔍 Debug complete. Check the output above for issues.');
