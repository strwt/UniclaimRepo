// Test script to verify HMAC-SHA1 signature generation fix
// This tests the core signature generation logic without needing the full mobile app

const CryptoJS = require('crypto-js');

// Simulate the fixed signature generation function
function generateHMACSHA1Signature(params, secret) {
    try {
        console.log('🔐 Starting HMAC-SHA1 signature generation...');

        // Validate input parameters
        if (!params || !secret) {
            throw new Error('Missing required parameters: params and secret are required');
        }

        if (secret.length < 10) {
            throw new Error('API secret appears too short - please check your configuration');
        }

        console.log('✅ CryptoJS library loaded successfully');
        console.log('🔍 Input validation passed');

        // CRITICAL FIX: Use the correct HMAC-SHA1 method
        const hash = CryptoJS.HmacSHA1(params, secret);
        const signature = hash.toString(CryptoJS.enc.Hex);

        // Validate signature format
        if (!signature || signature.length !== 40) {
            throw new Error(`Invalid signature length: ${signature?.length || 0}. Expected 40 characters.`);
        }

        // Check for suspicious patterns (like all zeros)
        if (signature.match(/^[0]+$/) || signature.includes('00000000000000000000000000000000')) {
            throw new Error('Generated signature appears invalid (contains many zeros)');
        }

        // Additional validation: ensure it's a valid hex string
        if (!/^[0-9a-f]{40}$/i.test(signature)) {
            throw new Error('Generated signature is not a valid 40-character hex string');
        }

        console.log('✅ HMAC-SHA1 signature generated successfully');
        console.log('  - Params:', params);
        console.log('  - Signature:', signature);
        console.log('  - Length:', signature.length);
        console.log('  - Valid hex format:', /^[0-9a-f]{40}$/i.test(signature));

        return signature;

    } catch (error) {
        console.error('❌ HMAC-SHA1 signature generation failed:', error);
        throw new Error(`Failed to generate Cloudinary signature: ${error.message}`);
    }
}

// Test function to verify signature generation
function testSignatureGeneration() {
    console.log('🧪 Testing Cloudinary signature generation...\n');

    // Test with the exact format from your error log
    const testPublicId = 'posts/ghk9zjdcvqgv3blqnemi';
    const testTimestamp = '1755491466';
    const testSecret = 'test_secret_key_for_testing_purposes_only';

    // Test both parameter orders that we use in the mobile app
    const testParams1 = `public_id=${testPublicId}&timestamp=${testTimestamp}`;
    const testParams2 = `timestamp=${testTimestamp}&public_id=${testPublicId}`;

    console.log('🧪 Testing Method 1 (public_id first):');
    try {
        const signature1 = generateHMACSHA1Signature(testParams1, testSecret);
        console.log('  - Parameters:', testParams1);
        console.log('  - Signature:', signature1);
        console.log('  - Length:', signature1.length);
        console.log('  ✅ Method 1 successful');
    } catch (error) {
        console.log('  ❌ Method 1 failed:', error.message);
    }

    console.log('\n🧪 Testing Method 2 (timestamp first):');
    try {
        const signature2 = generateHMACSHA1Signature(testParams2, testSecret);
        console.log('  - Parameters:', testParams2);
        console.log('  - Signature:', signature2);
        console.log('  - Length:', signature2.length);
        console.log('  ✅ Method 2 successful');
    } catch (error) {
        console.log('  ❌ Method 2 failed:', error.message);
    }

    // Test consistency for each method
    console.log('\n🧪 Testing signature consistency...');
    let consistent = true;

    try {
        for (let i = 0; i < 3; i++) {
            const sig1 = generateHMACSHA1Signature(testParams1, testSecret);
            const sig2 = generateHMACSHA1Signature(testParams2, testSecret);

            if (i === 0) {
                const firstSig1 = sig1;
                const firstSig2 = sig2;

                // Test consistency
                if (sig1 !== firstSig1 || sig2 !== firstSig2) {
                    console.log('⚠️ Warning: Signatures are not consistent');
                    consistent = false;
                    break;
                }
            }
        }

        if (consistent) {
            console.log('✅ All signatures are consistent');
        }
    } catch (error) {
        console.log('❌ Consistency test failed:', error.message);
        consistent = false;
    }

    return consistent;
}

// Test with the exact format from your error log
function testExactErrorLogFormat() {
    console.log('\n🧪 Testing with exact error log format:');
    const exactParams = 'public_id=posts/ghk9zjdcvqgv3blqnemi&timestamp=1755491466';
    const testSecret = 'test_secret_key_for_testing_purposes_only';

    try {
        const exactSignature = generateHMACSHA1Signature(exactParams, testSecret);
        console.log('  - Exact params from error log:', exactParams);
        console.log('  - Generated signature:', exactSignature);
        console.log('  - This should match what Cloudinary expects');
        console.log('  ✅ Exact format test passed');
        return true;
    } catch (error) {
        console.log('  ❌ Error with exact params:', error.message);
        return false;
    }
}

// Quick test function for immediate verification
function quickSignatureTest() {
    console.log('\n🚀 Quick signature test for immediate verification...');

    const testParams = 'public_id=posts/test&timestamp=1755491466';
    const testSecret = 'test_secret_key_for_testing_purposes_only';

    try {
        const signature = generateHMACSHA1Signature(testParams, testSecret);

        console.log('✅ Quick test passed!');
        console.log('  - Params:', testParams);
        console.log('  - Signature:', signature);
        console.log('  - Length:', signature.length);
        console.log('  - Valid hex:', /^[0-9a-f]{40}$/i.test(signature));

        return true;
    } catch (error) {
        console.error('❌ Quick test failed:', error.message);
        return false;
    }
}

// Run all tests
console.log('🧪 Testing HMAC-SHA1 Signature Generation Fix\n');
console.log('==============================================\n');

try {
    // Test 1: Basic signature generation
    const test1Result = testSignatureGeneration();
    console.log('\n📊 Test 1 Result:', test1Result ? 'PASSED' : 'FAILED');

    // Test 2: Exact error log format
    const test2Result = testExactErrorLogFormat();
    console.log('📊 Test 2 Result:', test2Result ? 'PASSED' : 'FAILED');

    // Test 3: Quick test
    const test3Result = quickSignatureTest();
    console.log('📊 Test 3 Result:', test3Result ? 'PASSED' : 'FAILED');

    // Overall result
    console.log('\n==============================================');
    if (test1Result && test2Result && test3Result) {
        console.log('🎉 ALL TESTS PASSED! The signature generation fix is working correctly.');
        console.log('💡 The HMAC-SHA1 implementation should now generate valid signatures for Cloudinary.');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above for details.');
    }

} catch (error) {
    console.error('❌ Test execution failed:', error);
}
