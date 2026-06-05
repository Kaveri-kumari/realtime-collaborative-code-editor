/**
 * rooms.js
 * In-memory state manager for collaborative rooms.
 * Maintains editor content, programming languages, and active socket user associations.
 */

// Map of roomId -> { code, language, users: Map(socketId -> username) }
const rooms = new Map();

// Starter code template for newly created rooms
const DEFAULT_CODE = `// Welcome to the Collaborative Code Editor!
function hello() {
  console.log("Hello, World!");
}

hello();
`;

/**
 * Gets a room's configuration and content.
 * @param {string} roomId 
 * @returns {object|undefined}
 */
function getRoom(roomId) {
  return rooms.get(roomId);
}

/**
 * Serializes active users in a room to an array of structures suitable for Socket.IO JSON transmission.
 * @param {string} roomId 
 * @returns {Array<{socketId: string, username: string}>}
 */
function getRoomUsersList(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.users.entries()).map(([socketId, username]) => ({
    socketId,
    username
  }));
}

/**
 * Joins a user to a room. Creates the room if it doesn't already exist.
 * @param {string} roomId 
 * @param {string} socketId 
 * @param {string} username 
 * @returns {object} The room object
 */
function joinRoom(roomId, socketId, username) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      code: DEFAULT_CODE,
      language: "javascript",
      users: new Map()
    });
  }
  const room = rooms.get(roomId);
  room.users.set(socketId, username);
  return room;
}

/**
 * Removes a user from a room by socketId.
 * Cleans up and deletes the room if no users remain.
 * @param {string} roomId 
 * @param {string} socketId 
 * @returns {object|null} The updated room, or null if deleted/not found
 */
function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.users.delete(socketId);

  // If room is empty, delete it to prevent memory leaks
  if (room.users.size === 0) {
    rooms.delete(roomId);
    return null;
  }

  return room;
}

/**
 * Updates the editor text/code for a room.
 * @param {string} roomId 
 * @param {string} code 
 */
function updateCode(roomId, code) {
  const room = rooms.get(roomId);
  if (room) {
    room.code = code;
  }
}

/**
 * Updates the active language choice for a room.
 * @param {string} roomId 
 * @param {string} language 
 */
function updateLanguage(roomId, language) {
  const room = rooms.get(roomId);
  if (room) {
    room.language = language;
  }
}

/**
 * Finds the roomId and room data associated with a user's socket.
 * @param {string} socketId 
 * @returns {{roomId: string, room: object}|null}
 */
function getUserRoom(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.users.has(socketId)) {
      return { roomId, room };
    }
  }
  return null;
}

/**
 * Updates the user's nickname.
 * @param {string} roomId 
 * @param {string} socketId 
 * @param {string} newUsername 
 * @returns {object|null} The updated room, or null
 */
function updateUserNickname(roomId, socketId, newUsername) {
  const room = rooms.get(roomId);
  if (room && room.users.has(socketId)) {
    room.users.set(socketId, newUsername);
    return room;
  }
  return null;
}

module.exports = {
  getRoom,
  getRoomUsersList,
  joinRoom,
  leaveRoom,
  updateCode,
  updateLanguage,
  getUserRoom,
  updateUserNickname
};
