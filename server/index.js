import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"], // Allow Vite dev server on both ports
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

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
