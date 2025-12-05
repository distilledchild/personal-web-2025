/**
 * Signed URL Helper for Frontend
 * Provides common utilities for fetching signed URLs from backend API
 */

import { getApiUrl } from './apiConfig';

// API base URL - automatically determined by environment
const API_URL = getApiUrl();

// Cache for signed URLs (valid for 1 hour)
interface SignedUrlCacheEntry {
    url: string;
    expiry: number;
}

const signedUrlCache: { [key: string]: SignedUrlCacheEntry } = {};

/**
 * Categories for different GCS data types
 */
export type SignedUrlCategory = 'blog' | 'research' | 'interests';

/**
 * Get signed URL from backend with caching
 * @param category - Category of the file (blog, research, interests)
 * @param fileName - Name of the file
 * @param cacheMinutes - Cache duration in minutes (default: 55)
 * @returns Signed URL
 */
export async function getSignedUrl(
    category: SignedUrlCategory,
    fileName: string,
    cacheMinutes: number = 55
): Promise<string> {
    const cacheKey = `${category}:${fileName}`;

    // Check cache first
    const cached = signedUrlCache[cacheKey];
    if (cached && cached.expiry > Date.now()) {
        return cached.url;
    }

    try {
        // Determine API endpoint based on category
        let endpoint: string;
        switch (category) {
            case 'research':
                endpoint = `/api/research/hic-data?fileName=${encodeURIComponent(fileName)}`;
                break;
            case 'blog':
                // Blog images are uploaded via different endpoint
                throw new Error('Blog images use upload endpoint, not getSignedUrl');
            case 'interests':
                // Art museum images are fetched via /api/interests/art-museums
                throw new Error('Interest images are fetched via art-museums endpoint');
            default:
                throw new Error(`Unknown category: ${category}`);
        }

        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`Failed to get signed URL for ${fileName}`);
        }

        const data = await response.json();

        // Cache the signed URL
        signedUrlCache[cacheKey] = {
            url: data.url,
            expiry: Date.now() + cacheMinutes * 60 * 1000
        };

        return data.url;
    } catch (error) {
        console.error(`Error getting signed URL for ${category}:${fileName}:`, error);
        throw error;
    }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
    const now = Date.now();
    Object.keys(signedUrlCache).forEach(key => {
        if (signedUrlCache[key].expiry <= now) {
            delete signedUrlCache[key];
        }
    });
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
    Object.keys(signedUrlCache).forEach(key => {
        delete signedUrlCache[key];
    });
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { total: number; expired: number } {
    const now = Date.now();
    const total = Object.keys(signedUrlCache).length;
    const expired = Object.values(signedUrlCache).filter(entry => entry.expiry <= now).length;
    return { total, expired };
}
