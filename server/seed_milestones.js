import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const milestoneSchema = new mongoose.Schema({
    date: Date,
    title: String,
    description: String,
    createdAt: Date,
    category: String // 'ME' or 'WEB'
}, { collection: 'ABOUT_MILESTONE' });

const Milestone = mongoose.model('Milestone', milestoneSchema);

const dummyData = [
    {
        "date": new Date("2025-11-22T00:00:00Z"),
        "title": "Domain purchase",
        "description": "distilledchild domain purchased",
        "createdAt": new Date("2025-11-22T12:00:00Z"),
        "category": "WEB"
    },
    {
        "date": new Date("2025-11-23T00:00:00Z"),
        "title": "Interest menu launch",
        "description": "Initial launch of interest menu",
        "createdAt": new Date("2025-11-23T12:00:00Z"),
        "category": "WEB"
    },
    {
        "date": new Date("2025-09-01T00:00:00Z"),
        "title": "Earned Ph.D degree",
        "description": "Completed Ph.D degree in Genetics, Genomics, and Informatics",
        "createdAt": new Date("2025-11-24T14:22:00Z"),
        "category": "ME"
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const count = await Milestone.countDocuments();
        console.log(`Current milestone count: ${count}`);

        if (count === 0) {
            console.log('Seeding dummy data...');
            await Milestone.insertMany(dummyData);
            console.log('Seeding complete!');
        } else {
            console.log('Data already exists, skipping seed.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
