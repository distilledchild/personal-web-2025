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
    // Check if we're in development (localhost)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:4000';
    }

    // Production URL (custom domain with CORS configured)
    return 'https://api.distilledchild.space';
};

/**
 * API_URL constant for convenience
 */
export const API_URL = getApiUrl();

