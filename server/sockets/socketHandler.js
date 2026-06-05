/**
 * socketHandler.js
 * Handle Socket.IO connections for the collaborative editor dashboard.
 * Supports room joining, text synchronizations, real-time chat logging, and typing indicators.
 */

const Message = require("../models/Message");

// In-memory cache for online users: roomId -> Map(socketId -> { userId, name })
const roomUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Triggered when a user enters a room
    socket.on("join-room", async ({ roomId, user }) => {
      if (!roomId || !user) return;

      socket.join(roomId);
      console.log(`User "${user.name}" (${user._id}) joined room: ${roomId}`);

      // Initialize room user list if not exists
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      
      // Add user to the in-memory cache
      roomUsers.get(roomId).set(socket.id, {
        userId: user._id,
        name: user.name,
      });

      // Construct unique array of active participants
      const usersList = Array.from(roomUsers.get(roomId).values());

      // Send the updated active users list to everyone in the room
      io.to(roomId).emit("online-users-list", usersList);

      // Broadcast join alert notification to others in the room
      socket.to(roomId).emit("user-joined", {
        name: user.name,
        socketId: socket.id,
      });
    });

    // Triggered when client modifies file editor text
    socket.on("code-change", ({ roomId, fileId, code }) => {
      if (!roomId || !fileId || typeof code !== "string") return;

      // Broadcast new code text buffer to other participants in the room
      socket.to(roomId).emit("receive-code", { fileId, code });
    });

    // Triggered when a user sends a chat message
    socket.on("send-message", async ({ roomId, userId, message }) => {
      if (!roomId || !userId || !message) return;

      try {
        // Save the chat message into MongoDB
        const chatDoc = await Message.create({
          sender: userId,
          roomId,
          message,
        });

        // Populate sender's username before broadcasting
        const populated = await Message.findById(chatDoc._id).populate("sender", "name");

        // Broadcast message to everyone in the room (including sender)
        io.to(roomId).emit("receive-message", populated);
      } catch (error) {
        console.error("Socket send-message database error: ", error.message);
      }
    });

    // Triggered when a user starts or stops typing in the chat
    socket.on("typing-start", ({ roomId, name }) => {
      if (!roomId || !name) return;

      // Broadcast typing notification to other room members
      socket.to(roomId).emit("user-typing", { name });
    });

    socket.on("typing-stop", ({ roomId, name }) => {
      if (!roomId || !name) return;

      socket.to(roomId).emit("user-stop-typing", { name });
    });

    // Triggered when a client explicitly leaves the room
    socket.on("leave-room", ({ roomId, user }) => {
      if (!roomId || !user) return;

      socket.leave(roomId);

      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
        
        // Clean up room in memory if empty
        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId);
        } else {
          // Broadcast updated user list and departure alerts to remaining users
          const remainingUsers = Array.from(roomUsers.get(roomId).values());
          io.to(roomId).emit("online-users-list", remainingUsers);
          socket.to(roomId).emit("user-left", { name: user.name });
        }
      }
    });

    // Handle abrupt socket disconnections (refreshing, tab closures)
    socket.on("disconnecting", () => {
      socket.rooms.forEach((roomId) => {
        if (roomUsers.has(roomId)) {
          const user = roomUsers.get(roomId).get(socket.id);
          if (user) {
            roomUsers.get(roomId).delete(socket.id);
            
            // Clean up room in memory if empty
            if (roomUsers.get(roomId).size === 0) {
              roomUsers.delete(roomId);
            } else {
              // Send updated list and notifications
              const remainingUsers = Array.from(roomUsers.get(roomId).values());
              io.to(roomId).emit("online-users-list", remainingUsers);
              socket.to(roomId).emit("user-left", { name: user.name });
            }
          }
        }
      });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
