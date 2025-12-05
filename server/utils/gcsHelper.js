/**
 * Google Cloud Storage Helper Functions
 * Provides common utilities for GCS operations including Signed URL generation
 */

/**
 * Generate a signed URL for a GCS file
 * @param {Object} storage - GCS Storage instance
 * @param {string} bucketName - GCS bucket name
 * @param {string} filePath - File path within the bucket (e.g., 'blog/bio/image.jpg')
 * @param {number} expiryMinutes - Expiry time in minutes (default: 60)
 * @returns {Promise<string>} Signed URL
 */
export async function generateSignedUrl(storage, bucketName, filePath, expiryMinutes = 60) {
    try {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(filePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Generate signed URL
        const [signedUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiryMinutes * 60 * 1000,
        });

        return signedUrl;
    } catch (error) {
        console.error(`Error generating signed URL for ${filePath}:`, error);
        throw error;
    }
}

/**
 * Generate signed URLs for multiple files
 * @param {Object} storage - GCS Storage instance
 * @param {string} bucketName - GCS bucket name
 * @param {string[]} filePaths - Array of file paths
 * @param {number} expiryMinutes - Expiry time in minutes (default: 60)
 * @returns {Promise<string[]>} Array of signed URLs
 */
export async function generateSignedUrls(storage, bucketName, filePaths, expiryMinutes = 60) {
    const promises = filePaths.map(filePath =>
        generateSignedUrl(storage, bucketName, filePath, expiryMinutes)
    );
    return Promise.all(promises);
}

/**
 * Generate signed URLs for all files matching a prefix
 * @param {Object} storage - GCS Storage instance
 * @param {string} bucketName - GCS bucket name
 * @param {string} prefix - File prefix (e.g., 'interests/art/MFA/')
 * @param {RegExp} fileFilter - Optional regex to filter files (default: image files)
 * @param {number} expiryMinutes - Expiry time in minutes (default: 60)
 * @returns {Promise<string[]>} Array of signed URLs
 */
export async function generateSignedUrlsForPrefix(
    storage,
    bucketName,
    prefix,
    fileFilter = /\.(png|jpg|jpeg|gif|webp)$/i,
    expiryMinutes = 60
) {
    try {
        const bucket = storage.bucket(bucketName);
        const [files] = await bucket.getFiles({
            prefix: prefix,
            delimiter: '/'
        });

        // Filter files based on regex
        const filteredFiles = files.filter(file => fileFilter.test(file.name));

        // Generate signed URLs
        const signedUrlPromises = filteredFiles.map(async (file) => {
            const [signedUrl] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + expiryMinutes * 60 * 1000,
            });
            return signedUrl;
        });

        return Promise.all(signedUrlPromises);
    } catch (error) {
        console.error(`Error generating signed URLs for prefix ${prefix}:`, error);
        throw error;
    }
}

/**
 * Validate file path to prevent path traversal attacks
 * @param {string} filePath - File path to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidFilePath(filePath) {
    // Prevent path traversal
    if (filePath.includes('..')) {
        return false;
    }

    // Ensure no absolute paths
    if (filePath.startsWith('/')) {
        return false;
    }

    return true;
}
