// Test script to verify centralized dropdown constants
console.log('🧪 Testing Centralized Dropdown Constants...\n');

// Test web constants
console.log('📱 Web Frontend Constants:');
try {
    const webConstants = require('./frontend/src/constants/index.ts');
    console.log('✅ USTP_LOCATIONS:', webConstants.USTP_LOCATIONS.length, 'locations');
    console.log('✅ ITEM_CATEGORIES:', webConstants.ITEM_CATEGORIES.length, 'categories');
    console.log('✅ CATEGORIES_WITH_COLORS:', webConstants.CATEGORIES_WITH_COLORS.length, 'category objects');

    // Verify specific locations exist
    const expectedLocations = ['Library', 'Canteen', 'Security Office'];
    expectedLocations.forEach(location => {
        if (webConstants.USTP_LOCATIONS.includes(location)) {
            console.log(`  ✅ "${location}" found in locations`);
        } else {
            console.log(`  ❌ "${location}" missing from locations`);
        }
    });

    // Verify categories exist
    const expectedCategories = ['Student Essentials', 'Gadgets', 'Personal Belongings'];
    expectedCategories.forEach(category => {
        if (webConstants.ITEM_CATEGORIES.includes(category)) {
            console.log(`  ✅ "${category}" found in categories`);
        } else {
            console.log(`  ❌ "${category}" missing from categories`);
        }
    });

} catch (error) {
    console.log('❌ Error loading web constants:', error.message);
}

console.log('\n📱 Mobile Constants:');
try {
    const mobileConstants = require('./mobile/constants/index.ts');
    console.log('✅ USTP_LOCATIONS:', mobileConstants.USTP_LOCATIONS.length, 'locations');
    console.log('✅ ITEM_CATEGORIES:', mobileConstants.ITEM_CATEGORIES.length, 'categories');
    console.log('✅ CATEGORIES_WITH_COLORS:', mobileConstants.CATEGORIES_WITH_COLORS.length, 'category objects');

    // Verify specific locations exist
    const expectedLocations = ['Library', 'Canteen', 'Security Office'];
    expectedLocations.forEach(location => {
        if (mobileConstants.USTP_LOCATIONS.includes(location)) {
            console.log(`  ✅ "${location}" found in locations`);
        } else {
            console.log(`  ❌ "${location}" missing from locations`);
        }
    });

    // Verify categories exist
    const expectedCategories = ['Student Essentials', 'Gadgets', 'Personal Belongings'];
    expectedCategories.forEach(category => {
        if (mobileConstants.ITEM_CATEGORIES.includes(category)) {
            console.log(`  ✅ "${category}" found in categories`);
        } else {
            console.log(`  ❌ "${category}" missing from categories`);
        }
    });

} catch (error) {
    console.log('❌ Error loading mobile constants:', error.message);
}

console.log('\n🔍 Consistency Check:');
try {
    const webConstants = require('./frontend/src/constants/index.ts');
    const mobileConstants = require('./mobile/constants/index.ts');

    // Check if locations are consistent between platforms
    const webLocations = webConstants.USTP_LOCATIONS.sort();
    const mobileLocations = mobileConstants.USTP_LOCATIONS.sort();

    if (JSON.stringify(webLocations) === JSON.stringify(mobileLocations)) {
        console.log('✅ Locations are consistent between web and mobile');
    } else {
        console.log('❌ Locations are NOT consistent between web and mobile');
    }

    // Check if categories are consistent between platforms
    const webCategories = webConstants.ITEM_CATEGORIES.sort();
    const mobileCategories = mobileConstants.ITEM_CATEGORIES.sort();

    if (JSON.stringify(webCategories) === JSON.stringify(mobileCategories)) {
        console.log('✅ Categories are consistent between web and mobile');
    } else {
        console.log('❌ Categories are NOT consistent between web and mobile');
    }

} catch (error) {
    console.log('❌ Error during consistency check:', error.message);
}

console.log('\n🎉 Centralized Dropdown Test Complete!');
