/**
 * socketHandler.js
 * Handle all socket communication logic, room assignment, text changes,
 * programming language changes, and nickname customization.
 */

const roomsManager = require("./rooms");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Triggered when a client joins a collaborative editing room
    socket.on("join_room", ({ roomId, username }) => {
      if (!roomId || !username) {
        console.error(`Invalid room details: roomId=${roomId}, username=${username}`);
        return;
      }

      // Join Socket.IO room
      socket.join(roomId);
      console.log(`User "${username}" (${socket.id}) joined room: ${roomId}`);

      // Register user inside our in-memory room store
      roomsManager.joinRoom(roomId, socket.id, username);

      // Fetch current room state to initialize the joining user
      const room = roomsManager.getRoom(roomId);
      const userList = roomsManager.getRoomUsersList(roomId);

      // Send current code, selected language, and user list to the joining user
      socket.emit("init_room", {
        code: room.code,
        language: room.language,
        users: userList,
      });

      // Broadcast updated user list to all other clients in the room
      socket.to(roomId).emit("room_users_update", {
        users: userList,
      });
    });

    // Triggered when a client modifies editor content
    socket.on("code_change", ({ roomId, code }) => {
      if (!roomId || typeof code !== "string") return;

      // Update room code cache
      roomsManager.updateCode(roomId, code);

      // Broadcast changes to all users in the room EXCEPT the sender
      socket.to(roomId).emit("remote_code_change", { code });
    });

    // Triggered when a client alters the programming language selector
    socket.on("language_change", ({ roomId, language }) => {
      if (!roomId || !language) return;

      // Update selected language in room cache
      roomsManager.updateLanguage(roomId, language);

      // Broadcast language change to other clients in the room
      socket.to(roomId).emit("remote_language_change", { language });
    });

    // Triggered when a user edits their username inside the sidebar
    socket.on("username_change", ({ roomId, username }) => {
      if (!roomId || !username) return;

      // Update the user's nickname in the room cache
      roomsManager.updateUserNickname(roomId, socket.id, username);

      const userList = roomsManager.getRoomUsersList(roomId);

      // Broadcast updated user list to everyone in the room
      io.in(roomId).emit("room_users_update", { users: userList });
    });

    // Handle user disconnecting
    socket.on("disconnecting", () => {
      // Find room user belongs to
      const roomInfo = roomsManager.getUserRoom(socket.id);

      if (roomInfo) {
        const { roomId } = roomInfo;
        
        // Remove user from the room state
        roomsManager.leaveRoom(roomId, socket.id);
        console.log(`User (${socket.id}) disconnected from room: ${roomId}`);

        // Fetch remaining users in the room
        const remainingUsers = roomsManager.getRoomUsersList(roomId);

        // If other users are still in the room, notify them of the departure
        if (remainingUsers.length > 0) {
          socket.to(roomId).emit("room_users_update", {
            users: remainingUsers,
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
