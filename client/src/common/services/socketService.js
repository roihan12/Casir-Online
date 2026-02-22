import { io } from "socket.io-client";

// Get base URL without /api suffix
// Assuming REACT_APP_API_URL is something like "http://localhost:3000/api" or "/api"
const API_URL = import.meta.env?.VITE_API_URL || "/api";
const SOCKET_URL = API_URL === "/api" ? "/" : API_URL.replace(/\/api\/?$/, '');

console.log('Connecting to socket at:', SOCKET_URL);

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Socket disconnected');
});

socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
});

export default socket;
