// Test script for CryptoJS implementation
// Run this in your mobile app console to test the crypto functionality

import { testCryptoJS, testSignatureGeneration } from './utils/cloudinary';

// Test 1: Basic CryptoJS functionality
console.log('🧪 Running CryptoJS test...');
const cryptoTestResult = testCryptoJS();
console.log('CryptoJS test result:', cryptoTestResult);

// Test 2: Signature generation with real credentials (if available)
console.log('\n🧪 Running signature generation test...');
testSignatureGeneration().then(result => {
    console.log('Signature generation test result:', result);
}).catch(error => {
    console.log('Signature generation test failed:', error);
});

// Test 3: Manual signature generation test
console.log('\n🧪 Manual signature test...');
try {
    // Test with sample data
    const testParams = 'public_id=posts/test_image&timestamp=1234567890';
    const testSecret = 'test_secret_key';

    // This should generate a proper 40-character signature
    const CryptoJS = require('react-native-crypto-js');
    const hash = CryptoJS.HmacSHA1(testParams, testSecret);
    const signature = hash.toString(CryptoJS.enc.Hex);

    console.log('✅ Manual signature test successful');
    console.log('  - Input params:', testParams);
    console.log('  - Generated signature:', signature);
    console.log('  - Signature length:', signature.length);
    console.log('  - Contains many zeros:', signature.includes('00000000000000000000000000000000'));

    if (signature.length === 40 && !signature.includes('00000000000000000000000000000000')) {
        console.log('✅ Signature format is valid!');
    } else {
        console.log('⚠️ Signature format may be invalid');
    }

} catch (error) {
    console.error('❌ Manual signature test failed:', error);
}
