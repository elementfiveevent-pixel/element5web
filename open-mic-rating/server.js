const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // In production, restrict this to the Next.js app's URL
        methods: ['GET', 'POST']
    }
});

// Centralized In-Memory Event State
// This replaces the Firestore document for rapid, 0-cost polling
let eventState = {
    currentPerformerId: null,
    votingOpen: false,
    performanceLive: false,
    roundID: null,
    performanceEndsAt: null,
    votingEndsAt: null,
    liveVoteCount: 0,
    revealLeaderboard: false,
    actCompleted: false
};

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Immediately send the current state to newly connected clients
    socket.emit('state_update', eventState);

    // === ADMIN COMMANDS ===
    socket.on('admin_update_state', (newState) => {
        // Merge new state
        eventState = { ...eventState, ...newState };

        // Broadcast the updated state to ALL connected clients
        io.emit('state_update', eventState);
        console.log('State updated by admin:', eventState);
    });

    socket.on('admin_reset_votes', () => {
        eventState.liveVoteCount = 0;
        io.emit('state_update', eventState);
    });

    // === AUDIENCE ACTIONS ===
    socket.on('vote_cast', () => {
        // When a user successfully writes a vote to Firestore, they tell the socket
        eventState.liveVoteCount += 1;
        // Broadcast the new count to the admin panel
        io.emit('state_update', eventState);
    });

    socket.on('send_reaction', (emoji) => {
        // Relay the emoji to the Stage screen(s)
        // We broadcast this to everyone, but only the Stage UI will render them
        io.emit('stage_reaction', { emoji, id: Date.now() + Math.random() });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`🚀 Real-time Socket.io server running on http://localhost:${PORT}`);
});
