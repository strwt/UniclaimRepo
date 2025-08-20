import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasSeenOnBoarding';

export const onboardingStorage = {
    // Check if user has seen onboarding
    async hasSeenOnBoarding(): Promise<boolean> {
        try {
            const value = await AsyncStorage.getItem(ONBOARDING_KEY);
            return value === 'true';
        } catch (error) {
            console.error('Error reading onboarding status:', error);
            return false; // Default to showing onboarding if there's an error
        }
    },

    // Mark onboarding as completed
    async setOnboardingCompleted(): Promise<void> {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    },

    // Reset onboarding status (useful for testing or if user wants to see it again)
    async resetOnboarding(): Promise<void> {
        try {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
        } catch (error) {
            console.error('Error resetting onboarding status:', error);
        }
    }
};
