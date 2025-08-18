// Simple test to verify CryptoJS is working in mobile app
// Run this in your mobile app console

console.log('🧪 Testing CryptoJS in mobile app...');

try {
    // Test 1: Check if CryptoJS is imported
    const CryptoJS = require('crypto-js');
    console.log('✅ CryptoJS imported successfully');
    console.log('CryptoJS object:', typeof CryptoJS);

    // Test 2: Check if HmacSHA1 method exists
    if (CryptoJS.HmacSHA1) {
        console.log('✅ HmacSHA1 method found');
    } else {
        console.log('❌ HmacSHA1 method not found');
    }

    // Test 3: Try to generate a simple signature
    const testString = 'test_string';
    const testSecret = 'test_secret';

    const hash = CryptoJS.HmacSHA1(testString, testSecret);
    const signature = hash.toString(CryptoJS.enc.Hex);

    console.log('✅ Signature generation successful');
    console.log('  - Input:', testString);
    console.log('  - Secret:', testSecret);
    console.log('  - Generated signature:', signature);
    console.log('  - Signature length:', signature.length);
    console.log('  - Contains many zeros:', signature.includes('00000000000000000000000000000000'));

    if (signature.length === 40 && !signature.includes('00000000000000000000000000000000')) {
        console.log('🎉 SUCCESS: CryptoJS is working properly!');
        console.log('You should now be able to delete images from Cloudinary.');
    } else {
        console.log('⚠️ WARNING: Signature format may be invalid');
    }

} catch (error) {
    console.error('❌ CryptoJS test failed:', error);
    console.log('This means the library is not properly loaded.');
}
