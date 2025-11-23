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
}, { collection: 'states' });

const State = mongoose.model('State', stateSchema);

const citySchema = new mongoose.Schema({
    state_code: String,
    name: String,
    status: String
}, { collection: 'cities' });

const City = mongoose.model('City', citySchema);

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
