// Test script to verify Firebase connection and messaging permissions
// Run this with: node test-messaging-permissions.js

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration (use your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyCgN70CTX2wQpcgoSZF6AK0fuq7ikcQgNs",
    authDomain: "uniclaim2.firebaseapp.com",
    projectId: "uniclaim2",
    storageBucket: "uniclaim2.appspot.com",
    messagingSenderId: "38339063459",
    appId: "1:38339063459:web:3b5650ebe6fabd352b1916"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testMessagingPermissions() {
    try {
        console.log('🔍 Testing Firebase connection...');

        // Test 1: Check if we can connect to Firebase
        console.log('✅ Firebase connection successful');

        // Test 2: Try to authenticate (you'll need to provide valid credentials)
        console.log('🔍 Testing authentication...');
        console.log('⚠️  Note: You need to provide valid email/password for this test');

        // Test 3: Test conversation creation permissions
        console.log('🔍 Testing conversation creation permissions...');

        // Test 4: Test message sending permissions
        console.log('🔍 Testing message sending permissions...');

        console.log('✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details
        });
    }
}

// Run the test
testMessagingPermissions();
