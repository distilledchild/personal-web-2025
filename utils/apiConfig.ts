/**
 * API Configuration
 * Centralized configuration for API URLs
 */

/**
 * Get the API base URL based on environment
 * - Development (localhost): http://localhost:4000
 * - Production: https://personal-web-backend-495733529369.us-central1.run.app
 */
export const getApiUrl = (): string => {
    // Check if we're in development (localhost)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:4000';
    }

    // Production URL
    return 'https://personal-web-backend-495733529369.us-central1.run.app';
};

/**
 * API_URL constant for convenience
 */
export const API_URL = getApiUrl();
