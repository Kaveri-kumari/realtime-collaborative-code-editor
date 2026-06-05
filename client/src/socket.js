/**
 * socket.js
 * Configures and exports the Socket.IO client instance.
 * Connects to the Node.js/Express server running on http://localhost:5000.
 */

import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

// Create a singleton socket instance with auto-reconnection settings
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});
