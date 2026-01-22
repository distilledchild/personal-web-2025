import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices.
 * Combines screen width check with user agent detection for reliability.
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        // SSR safe - check if window exists
        if (typeof window === 'undefined') return false;

        return checkIsMobile();
    });

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(checkIsMobile());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
}

function checkIsMobile(): boolean {
    if (typeof window === 'undefined') return false;

    // Check screen width (tablets and phones typically < 1024px)
    const isSmallScreen = window.innerWidth < 1024;

    // Check user agent for mobile/tablet devices
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);

    // Also check for touch capability as additional signal
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Consider it mobile if it's a small screen OR has mobile user agent
    // The touch check helps catch tablets that may have larger screens
    return isSmallScreen || (isMobileUA && hasTouch);
}

export default useIsMobile;
