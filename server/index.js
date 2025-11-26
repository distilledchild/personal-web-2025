import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Determine Redirect URI based on environment
const isProduction = process.env.NODE_ENV === 'production';
const REDIRECT_URI = isProduction
    ? 'https://www.distilledchild.space/oauth/google/callback'
    : (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/google/callback');

// Database connection
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const stateSchema = new mongoose.Schema({
    code: String,
    name: String,
    status: String
}, { collection: 'STATE' });

const State = mongoose.model('State', stateSchema);

const citySchema = new mongoose.Schema({
    state_code: String,
    name: String,
    status: String
}, { collection: 'CITY' });

const City = mongoose.model('City', citySchema);

const techBlogSchema = new mongoose.Schema({
    category: String,
    title: String,
    content: String,
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    createdAt: Date,
    updatedAt: Date,
    isPublished: { type: Boolean, default: true },
    slug: String,
    tags: [String],
    author: {
        name: String,
        email: String,
        avatar: String
    },
    likedBy: [{ type: String }],  // Array of email strings
    show: { type: String, default: 'Y' }  // 'Y' or 'N'
}, { collection: 'TECH_BLOG' });

const TechBlog = mongoose.model('TechBlog', techBlogSchema);

// Workout Schema for Strava activities
const workoutSchema = new mongoose.Schema({
    activity_id: { type: Number, unique: true, required: true },
    name: String,
    distance: Number,
    moving_time: Number,
    elapsed_time: Number,
    total_elevation_gain: Number,
    type: String,
    sport_type: String,
    start_date: Date,
    start_date_local: Date,
    average_speed: Number,
    max_speed: Number,
    athlete_id: Number,
    insertedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'INTERESTS_WORKOUT' });

const Workout = mongoose.model('Workout', workoutSchema);

// Google OAuth Endpoint
app.post('/api/auth/google', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    try {
        // 1. Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            console.error('Token exchange failed:', tokenData);
            return res.status(500).json({ error: 'Failed to exchange token', details: tokenData });
        }

        // 2. Get User Profile
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const userData = await userResponse.json();
        if (!userResponse.ok) {
            return res.status(500).json({ error: 'Failed to get user info' });
        }

        res.json({
            name: userData.name,
            email: userData.email,
            picture: userData.picture,
        });

    } catch (error) {
        console.error('Error exchanging token:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to authenticate' });
    }
});

// Travel States Endpoint
app.get('/api/travel/states', async (req, res) => {
    try {
        const states = await State.find({}, 'code status');
        res.json(states);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Tech Blog Endpoint
app.get('/api/tech-blog', async (req, res) => {
    try {
        const blogs = await TechBlog.find({ isPublished: true, show: 'Y' })
            .sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Tech Blog Post
app.post('/api/tech-blog', async (req, res) => {
    try {
        const { category, title, content, author } = req.body;

        if (!category || !title || !content || !author || !author.email) {
            return res.status(400).json({ error: 'Category, title, content, and author are required' });
        }

        // Check if user is authorized (distilledchild or wellclouder)
        const authorizedEmails = ['distilledchild@gmail.com', 'wellclouder@gmail.com'];
        if (!authorizedEmails.includes(author.email)) {
            return res.status(403).json({ error: 'Unauthorized: Only authorized users can create posts' });
        }

        const newBlog = new TechBlog({
            category,
            title,
            content,
            author: {
                name: author.name,
                email: author.email,
                avatar: author.avatar
            },
            likes: 0,
            views: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPublished: true,
            show: 'Y',
            likedBy: []
        });

        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Like/Unlike Tech Blog Post
app.post('/api/tech-blog/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const blog = await TechBlog.findById(id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        // Initialize likedBy if it doesn't exist
        if (!blog.likedBy) {
            blog.likedBy = [];
        }

        // Check if user already liked (by email)
        const likedIndex = blog.likedBy.indexOf(email);

        if (likedIndex > -1) {
            // Unlike: remove email from likedBy
            blog.likedBy.splice(likedIndex, 1);
        } else {
            // Like: add email to likedBy
            blog.likedBy.push(email);
        }

        // Update likes count based on likedBy array length
        blog.likes = blog.likedBy.length;

        await blog.save();
        res.json({
            likes: blog.likes,
            likedBy: blog.likedBy,
            isLiked: likedIndex === -1
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Tech Blog Post
app.put('/api/tech-blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category, title, content, email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const blog = await TechBlog.findById(id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        // Check if user is the author
        if (blog.author.email !== email) {
            return res.status(403).json({ error: 'Unauthorized: Only author can update' });
        }

        // Update fields
        if (category) blog.category = category;
        if (title) blog.title = title;
        if (content) blog.content = content;
        blog.updatedAt = new Date();

        await blog.save();
        res.json(blog);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete (Soft Delete) Tech Blog Post
app.delete('/api/tech-blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const blog = await TechBlog.findById(id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        // Check if user is the author
        if (blog.author.email !== email) {
            return res.status(403).json({ error: 'Unauthorized: Only author can delete' });
        }

        // Soft delete: set show to 'N'
        blog.show = 'N';
        blog.updatedAt = new Date();

        await blog.save();
        res.json({ message: 'Blog post deleted successfully', blog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Milestone (About Page) Schema & Endpoints ---

const milestoneSchema = new mongoose.Schema({
    date: Date,
    title: String,
    description: String,
    createdAt: Date,
    category: String // 'ME' or 'WEB'
}, { collection: 'ABOUT_MILESTONE' });

const Milestone = mongoose.model('Milestone', milestoneSchema);

// Get Milestones
app.get('/api/milestones', async (req, res) => {
    try {
        // Sort by date ascending (chronological) as per "time order" request for history
        const milestones = await Milestone.find({}).sort({ date: 1 });
        res.json(milestones);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Milestone
app.post('/api/milestones', async (req, res) => {
    try {
        const { date, title, description, category, email } = req.body;

        const authorizedEmails = ['distilledchild@gmail.com', 'wellclouder@gmail.com'];
        if (!authorizedEmails.includes(email)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const newMilestone = new Milestone({
            date: new Date(date),
            title,
            description,
            category,
            createdAt: new Date()
        });

        await newMilestone.save();
        res.status(201).json(newMilestone);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Milestone
app.put('/api/milestones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, title, description, category, email } = req.body;

        const authorizedEmails = ['distilledchild@gmail.com', 'wellclouder@gmail.com'];
        if (!authorizedEmails.includes(email)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const milestone = await Milestone.findById(id);
        if (!milestone) return res.status(404).json({ error: 'Not found' });

        if (date) milestone.date = new Date(date);
        if (title) milestone.title = title;
        if (description) milestone.description = description;
        if (category) milestone.category = category;

        await milestone.save();
        res.json(milestone);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete Milestone
app.delete('/api/milestones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        const authorizedEmails = ['distilledchild@gmail.com', 'wellclouder@gmail.com'];
        if (!authorizedEmails.includes(email)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await Milestone.findByIdAndDelete(id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000", "https://www.distilledchild.space"], // Added production domain
        methods: ["GET", "POST"]
    }
});

// State
let waitingQueue = []; // Array of socket IDs
let activeChat = null; // { visitorId: string, ownerId: string } | null
let ownerSocketId = null;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. Register Owner
    socket.on('register_owner', () => {
        console.log('Owner registered:', socket.id);
        ownerSocketId = socket.id;

        // Send current queue count to owner
        socket.emit('queue_update', {
            count: waitingQueue.length,
            active: !!activeChat
        });

        // If there's no active chat but people are waiting, start next chat automatically
        if (!activeChat && waitingQueue.length > 0) {
            startNextChat();
        }
    });

    // 2. Visitor Joins Queue
    socket.on('join_queue', () => {
        if (socket.id === ownerSocketId) return; // Owner doesn't join queue

        // Check if already in queue or active
        if (waitingQueue.includes(socket.id)) return;
        if (activeChat && activeChat.visitorId === socket.id) return;

        console.log('Visitor joined queue:', socket.id);
        waitingQueue.push(socket.id);

        // Notify visitor of their position
        updateVisitorStatus(socket.id);

        // Notify owner of new queue count
        if (ownerSocketId) {
            io.to(ownerSocketId).emit('queue_update', {
                count: waitingQueue.length,
                active: !!activeChat
            });
        }

        // Try to start chat if owner is free
        if (ownerSocketId && !activeChat) {
            startNextChat();
        }
    });

    // 3. Send Message
    socket.on('send_message', (data) => {
        // data: { text: string }
        if (!activeChat) return;

        if (socket.id === ownerSocketId) {
            // Owner sent message -> send to active visitor
            io.to(activeChat.visitorId).emit('receive_message', {
                text: data.text,
                sender: 'owner'
            });
        } else if (socket.id === activeChat.visitorId) {
            // Visitor sent message -> send to owner
            io.to(ownerSocketId).emit('receive_message', {
                text: data.text,
                sender: 'visitor'
            });
        }
    });

    // 4. End Chat (Owner triggered)
    socket.on('end_chat', () => {
        if (socket.id !== ownerSocketId) return;
        endCurrentChat();
    });

    // 5. Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        if (socket.id === ownerSocketId) {
            ownerSocketId = null;
            // Optionally notify active visitor that owner left?
        } else {
            // Remove from queue if present
            const queueIndex = waitingQueue.indexOf(socket.id);
            if (queueIndex !== -1) {
                waitingQueue.splice(queueIndex, 1);
                // Notify everyone behind them that position changed? 
                // Simplification: Just notify everyone to update their status
                waitingQueue.forEach(id => updateVisitorStatus(id));

                // Notify owner
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('queue_update', {
                        count: waitingQueue.length,
                        active: !!activeChat
                    });
                }
            }

            // End active chat if it was this visitor
            if (activeChat && activeChat.visitorId === socket.id) {
                io.to(ownerSocketId).emit('chat_ended', { reason: 'visitor_disconnected' });
                activeChat = null;
                // Auto-start next chat?
                startNextChat();
            }
        }
    });
});

function startNextChat() {
    if (waitingQueue.length === 0) return;
    if (!ownerSocketId) return;

    const nextVisitorId = waitingQueue.shift();
    activeChat = { visitorId: nextVisitorId, ownerId: ownerSocketId };

    console.log('Starting chat with:', nextVisitorId);

    // Notify Owner
    io.to(ownerSocketId).emit('chat_started', { visitorId: nextVisitorId });
    io.to(ownerSocketId).emit('queue_update', {
        count: waitingQueue.length,
        active: true
    });

    // Notify Visitor
    io.to(nextVisitorId).emit('chat_started', { position: 0 });

    // Update remaining queue
    waitingQueue.forEach(id => updateVisitorStatus(id));
}

function endCurrentChat() {
    if (!activeChat) return;

    const { visitorId } = activeChat;

    // Notify Visitor
    io.to(visitorId).emit('chat_ended', { reason: 'owner_ended' });

    activeChat = null;

    // Notify Owner (update UI)
    if (ownerSocketId) {
        io.to(ownerSocketId).emit('queue_update', {
            count: waitingQueue.length,
            active: false
        });
    }

    // Start next
    startNextChat();
}

function updateVisitorStatus(socketId) {
    const index = waitingQueue.indexOf(socketId);
    if (index !== -1) {
        // Position 1 means 0 people ahead
        io.to(socketId).emit('queue_status', { position: index + 1 });
    }
}

// --- Strava API Endpoints ---

// Strava OAuth - Initiate Authorization
app.get('/api/strava/auth', (req, res) => {
    const clientId = process.env.STRAVA_CLIENT_ID || '187016';
    const redirectUri = encodeURIComponent('http://localhost:3000/strava/callback');
    const scope = 'read,activity:read_all,profile:read_all,read_all';

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;

    res.json({ authUrl });
});

// Strava OAuth - Exchange Code for Token
app.post('/api/strava/exchange_token', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }

        const clientId = process.env.STRAVA_CLIENT_ID || '187016';
        const clientSecret = process.env.STRAVA_CLIENT_SECRET || '021ca34790af66291ff4b82a8e02101744080353';

        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token exchange failed:', response.status, errorText);
            return res.status(response.status).json({ error: 'Failed to exchange token', details: errorText });
        }

        const data = await response.json();
        console.log('Successfully exchanged code for token');
        res.json(data);
    } catch (err) {
        console.error('Token exchange error:', err);
        res.status(500).json({ error: 'Failed to exchange token', details: err.message });
    }
});

// Get Strava Activities with provided access token
app.post('/api/strava/activities-with-token', async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Access token is required' });
        }

        const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Strava API Error:', response.status, errorText);
            return res.status(response.status).json({ error: `Strava API error: ${response.status}`, details: errorText });
        }

        const activities = await response.json();
        console.log(`Fetched ${activities.length} activities from Strava`);

        // Sync with database
        try {
            const dbCount = await Workout.countDocuments();
            const apiCount = activities.length;

            console.log(`DB has ${dbCount} activities, API returned ${apiCount} activities`);

            // Always try to sync/insert new activities
            // We'll filter out ones that already exist by ID to avoid duplicate key errors filling up logs,
            // or just rely on the unique index and ordered: false.
            // Since we want to be robust, let's just try to insert all and let Mongo handle duplicates.

            console.log(`Attempting to sync ${apiCount} activities to DB`);

            if (apiCount > 0) {
                console.log('Sample activity structure:', JSON.stringify(activities[0], null, 2));
            }

            // Prepare activities for insertion
            const activitiesToInsert = activities.map(activity => {
                // Ensure required fields are present
                if (!activity.id) {
                    console.warn('Activity missing ID:', activity);
                }
                return {
                    activity_id: activity.id,
                    name: activity.name,
                    distance: activity.distance,
                    moving_time: activity.moving_time,
                    elapsed_time: activity.elapsed_time,
                    total_elevation_gain: activity.total_elevation_gain,
                    type: activity.type,
                    sport_type: activity.sport_type,
                    start_date: new Date(activity.start_date),
                    start_date_local: new Date(activity.start_date_local),
                    average_speed: activity.average_speed,
                    max_speed: activity.max_speed,
                    athlete_id: activity.athlete?.id,
                    insertedAt: new Date()
                };
            });

            console.log(`Prepared ${activitiesToInsert.length} documents for insertion`);

            // Insert new activities (ignore duplicates)
            try {
                const result = await Workout.insertMany(activitiesToInsert, { ordered: false });
                console.log(`Successfully inserted ${result.length} activities.`);
            } catch (err) {
                // Ignore duplicate key errors (code 11000)
                if (err.code === 11000) {
                    console.log(`Sync complete. Some activities already existed.`);
                    if (err.insertedDocs && err.insertedDocs.length > 0) {
                        console.log(`Inserted ${err.insertedDocs.length} new activities (others were duplicates).`);
                    } else {
                        console.log('No new activities inserted (all were duplicates).');
                    }
                } else {
                    console.error('Error inserting activities:', err);
                    // Log validation errors if any
                    if (err.name === 'ValidationError') {
                        console.error('Validation Errors:', err.errors);
                    }
                }
            }

            // Verify final count
            const finalCount = await Workout.countDocuments();
            console.log(`Final DB count: ${finalCount}`);

        } catch (dbErr) {
            console.error('Database sync error:', dbErr);
        }

        res.json(activities);
    } catch (err) {
        console.error('Strava API handler error:', err);
        res.status(500).json({ error: 'Failed to fetch Strava activities', details: err.message });
    }
});

// Function to refresh Strava Access Token
async function refreshStravaToken() {
    try {
        console.log('Refreshing Strava Access Token...');
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: process.env.STRAVA_REFRESH_TOKEN
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to refresh token response:', response.status, errorText);
            throw new Error(`Failed to refresh token: ${response.status}`);
        }

        const data = await response.json();
        console.log('Successfully refreshed Strava token');
        return data.access_token;
    } catch (error) {
        console.error('Error refreshing Strava token:', error);
        return null;
    }
}

// Get Strava Activities
app.get('/api/strava/activities', async (req, res) => {
    try {
        let accessToken = process.env.STRAVA_ACCESS_TOKEN;

        if (!accessToken) {
            // Try refreshing if no access token is set initially
            accessToken = await refreshStravaToken();
            if (!accessToken) {
                return res.status(500).json({ error: 'Strava configuration missing' });
            }
            process.env.STRAVA_ACCESS_TOKEN = accessToken;
        }

        // Helper to fetch activities
        const fetchActivities = async (token) => {
            return await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        };

        let response = await fetchActivities(accessToken);

        // If 401 Unauthorized, try refreshing token
        if (response.status === 401) {
            console.log('Strava token expired (401), attempting refresh...');
            const newToken = await refreshStravaToken();

            if (newToken) {
                process.env.STRAVA_ACCESS_TOKEN = newToken; // Update in memory
                response = await fetchActivities(newToken);
            } else {
                return res.status(401).json({ error: 'Failed to refresh Strava token' });
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Strava API Error:', response.status, errorText);
            return res.status(response.status).json({ error: `Strava API error: ${response.status}`, details: errorText });
        }

        const activities = await response.json();
        console.log(`Fetched ${activities.length} activities from Strava`);
        res.json(activities);
    } catch (err) {
        console.error('Strava API handler error:', err);
        res.status(500).json({ error: 'Failed to fetch Strava activities', details: err.message });
    }
});

// Get stored workouts from Database
app.get('/api/workouts', async (req, res) => {
    try {
        const workouts = await Workout.find().sort({ start_date: -1 });
        console.log(`Fetched ${workouts.length} workouts from DB`);
        res.json(workouts);
    } catch (err) {
        console.error('Database fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch workouts from database', details: err.message });
    }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
