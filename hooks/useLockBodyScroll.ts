import { useEffect } from 'react';

/**
 * Hook to lock the body scroll when a condition is met (e.g., modal is open).
 * @param isLocked - Boolean indicating if the scroll should be locked.
 */
export const useLockBodyScroll = (isLocked: boolean) => {
    useEffect(() => {
        if (isLocked) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to ensure scroll is unlocked when component unmounts
        // or when isLocked becomes false.
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isLocked]);
};
