import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectSchema = new mongoose.Schema({
    project_name: String,
    status: String,
    show: String
}, { collection: 'PROJECT' });

const Project = mongoose.model('Project', projectSchema);

async function updateProjects() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all projects
        const allProjects = await Project.find({});
        console.log('Total projects found:', allProjects.length);
        console.log('Projects:', JSON.stringify(allProjects, null, 2));

        // Update projects that don't have show field
        const result = await Project.updateMany(
            { show: { $exists: false } },
            { $set: { show: 'Y' } }
        );

        console.log('Updated projects:', result.modifiedCount);

        // Show all projects after update
        const updatedProjects = await Project.find({});
        console.log('Projects after update:', JSON.stringify(updatedProjects, null, 2));

        await mongoose.connection.close();
        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateProjects();
