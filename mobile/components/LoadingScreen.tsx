import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated } from 'react-native';

export default function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View 
      className="flex-1 bg-white items-center justify-center"
      style={{ opacity: fadeAnim }}
    >
      <View className="items-center">
        {/* Loading spinner */}
        <ActivityIndicator size="large" color="#0A193A" />
        
        {/* Loading text */}
        <Text className="text-gray-600 text-lg font-manrope-medium mt-4">
          Loading the app...
        </Text>
        
        {/* Subtitle */}
        <Text className="text-gray-400 text-sm font-manrope mt-2 text-center px-8">
          Please wait while we prepare everything for you
        </Text>
      </View>
    </Animated.View>
  );
}
