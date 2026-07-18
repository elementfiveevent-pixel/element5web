import { io, Socket } from 'socket.io-client';

// In production, this should point to your backend domain.
// During development, it points to the concurrently running local Node server.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://open-mic-socket-server.onrender.com';

export const socket: Socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on('connect', () => {
    console.log('🔗 Connected to Live Event Socket Server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('⚠️ Disconnected from Socket Server');
});
