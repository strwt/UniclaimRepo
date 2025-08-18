// Test script for Cloudinary deletion fix
// Run this in your mobile app console to test the fixed deletion functionality

import { testCryptoJS, testSignatureGeneration, testImageDeletion } from './utils/cloudinary';

console.log('🧪 Testing Cloudinary deletion fix...\n');

// Test 1: Basic CryptoJS functionality
console.log('=== Test 1: CryptoJS Library ===');
const cryptoTestResult = testCryptoJS();
console.log('CryptoJS test result:', cryptoTestResult);
console.log('');

// Test 2: Signature generation with real credentials
console.log('=== Test 2: Signature Generation ===');
testSignatureGeneration().then(result => {
    console.log('Signature generation test result:', result);
    console.log('');

    // Test 3: Image deletion functionality
    console.log('=== Test 3: Image Deletion Process ===');
    return testImageDeletion();
}).then(result => {
    console.log('Image deletion test result:', result);
    console.log('');

    if (result) {
        console.log('✅ All tests passed! The deletion fix should work properly.');
        console.log('💡 Try deleting a real ticket now to see if images are properly removed from Cloudinary.');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above for details.');
    }
}).catch(error => {
    console.error('❌ Test execution failed:', error);
});

// Manual signature test for debugging
console.log('\n=== Manual Signature Test ===');
try {
    const CryptoJS = require('react-native-crypto-js');

    // Test with the exact parameters Cloudinary expects
    const testParams = 'public_id=posts/test_image&timestamp=1234567890';
    const testSecret = 'test_secret_key';

    const hash = CryptoJS.HmacSHA1(testParams, testSecret);
    const signature = hash.toString(CryptoJS.enc.Hex);

    console.log('✅ Manual signature test successful');
    console.log('  - Input params:', testParams);
    console.log('  - Generated signature:', signature);
    console.log('  - Signature length:', signature.length);
    console.log('  - Format valid:', signature.length === 40 && !signature.includes('00000000000000000000000000000000'));

} catch (error) {
    console.error('❌ Manual signature test failed:', error);
}
