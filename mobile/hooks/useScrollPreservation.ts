import { useRef, useCallback } from 'react';
import { FlatList } from 'react-native';

// Global scroll position cache
const scrollPositions = new Map<string, number>();

export const useScrollPreservation = (tabKey: string) => {
    const flatListRef = useRef<FlatList>(null);

    // Save scroll position when user scrolls
    const handleScroll = useCallback((event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        scrollPositions.set(tabKey, offsetY);
    }, [tabKey]);

    // Restore scroll position when tab becomes visible
    const restoreScrollPosition = useCallback(() => {
        const savedPosition = scrollPositions.get(tabKey);
        if (savedPosition !== undefined && flatListRef.current) {
            // Use requestAnimationFrame to ensure the component is fully rendered
            requestAnimationFrame(() => {
                flatListRef.current?.scrollToOffset({
                    offset: savedPosition,
                    animated: false, // Don't animate to prevent visual jumps
                });
            });
        }
    }, [tabKey]);

    // Get the saved scroll position
    const getSavedPosition = useCallback(() => {
        return scrollPositions.get(tabKey) || 0;
    }, [tabKey]);

    // Clear saved position (useful for logout or refresh)
    const clearSavedPosition = useCallback(() => {
        scrollPositions.delete(tabKey);
    }, [tabKey]);

    return {
        flatListRef,
        handleScroll,
        restoreScrollPosition,
        getSavedPosition,
        clearSavedPosition,
    };
};
