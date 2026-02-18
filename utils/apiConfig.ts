/**
 * API Configuration
 * Centralized configuration for API URLs
 */

/**
 * Get the API base URL based on environment
 * - Development (localhost): http://localhost:4000
 * - Production: https://api.distilledchild.space
 */
export const getApiUrl = (): string => {
    // Highest priority: explicit env override
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Local development hosts
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:4000';
    }

    // Production URL (custom domain with CORS configured)
    return 'https://api.distilledchild.space';
};

/**
 * API_URL constant for convenience
 */
export const API_URL = getApiUrl();
