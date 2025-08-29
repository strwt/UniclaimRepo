import { useEffect, useRef, useCallback } from 'react';

// Simple hook to detect when user scrolls near bottom of page
export const useInfiniteScroll = (
    onLoadMore: () => void,
    hasMore: boolean,
    isLoading: boolean,
    threshold: number = 100 // pixels from bottom to trigger load
) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingRef = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const target = entries[0];
            if (target.isIntersecting && hasMore && !isLoading) {
                onLoadMore();
            }
        },
        [onLoadMore, hasMore, isLoading]
    );

    useEffect(() => {
        const element = loadingRef.current;
        if (!element) return;

        observerRef.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: `${threshold}px`,
            threshold: 0.1,
        });

        observerRef.current.observe(element);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver, threshold]);

    return loadingRef;
};
