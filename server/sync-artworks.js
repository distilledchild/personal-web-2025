import { Storage } from '@google-cloud/storage';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize GCS
const storage = new Storage();
const bucketName = 'distilledchild';

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI;

// Art Museum Schema (matching existing schema)
const artMuseumSchema = new mongoose.Schema({
    id: Number,
    city: String,
    city_code: String,
    museum_code: String,
    museum_name: String,
    state: String,
    show: String,
    artworks: [{
        artwork_id: String,
        title: String,
        artist: String,
        year: String,
        medium: String,
        dimensions: String,
        image_url: String,
        thumbnail_url: String,
        description: String,
        show: String
    }]
}, { collection: 'INTERESTS_ART_MUSEUM' });

const ArtMuseum = mongoose.model('ArtMuseum', artMuseumSchema);

async function syncArtworks() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('📂 Scanning GCS bucket...');
        const bucket = storage.bucket(bucketName);
        const [files] = await bucket.getFiles({ prefix: 'interests/art/' });

        // Group files by museum code
        const museumFiles = {};

        files.forEach(file => {
            const filePath = file.name;
            // interests/art/AIC/image.jpg
            const parts = filePath.split('/');

            if (parts.length >= 4 && parts[0] === 'interests' && parts[1] === 'art') {
                const museumCode = parts[2];
                const fileName = parts[3];

                // Skip if not an image file
                if (!fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    return;
                }

                if (!museumFiles[museumCode]) {
                    museumFiles[museumCode] = [];
                }

                museumFiles[museumCode].push({
                    fileName: fileName,
                    fullPath: filePath,
                    publicUrl: `https://storage.googleapis.com/${bucketName}/${filePath}`
                });
            }
        });

        console.log(`📊 Found ${Object.keys(museumFiles).length} museums with images`);

        // Update each museum
        for (const [museumCode, images] of Object.entries(museumFiles)) {
            console.log(`\n🎨 Processing ${museumCode} (${images.length} images)...`);

            const museum = await ArtMuseum.findOne({ museum_code: museumCode });

            if (!museum) {
                console.log(`  ⚠️  Museum ${museumCode} not found in database, skipping...`);
                continue;
            }

            // Create artwork entries
            const artworks = images.map((img, index) => {
                // Extract title from filename (remove extension)
                const title = img.fileName.replace(/\.[^/.]+$/, '').replace(/-|_/g, ' ');

                return {
                    artwork_id: `${museumCode}-${index + 1}`,
                    title: title,
                    artist: 'Unknown', // Can be updated manually later
                    year: '',
                    medium: '',
                    dimensions: '',
                    image_url: img.publicUrl,
                    thumbnail_url: img.publicUrl,
                    description: '',
                    show: 'Y'
                };
            });

            // Update museum with artworks
            museum.artworks = artworks;
            await museum.save();

            console.log(`  ✅ Updated ${museum.museum_name} with ${artworks.length} artworks`);
        }

        console.log('\n🎉 Sync completed successfully!');

    } catch (error) {
        console.error('❌ Error syncing artworks:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the sync
syncArtworks();
