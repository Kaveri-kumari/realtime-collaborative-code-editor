/**
 * roomRoutes.js
 * Routing for workspaces, file uploads, file savings, and message history logs.
 */

const express = require("express");
const router = express.Router();
const {
  createRoom,
  getRoomFiles,
  createFile,
  saveFileContent,
  getRoomMessages,
} = require("../controllers/roomController");
const protect = require("../middleware/auth");

router.post("/create", protect, createRoom);
router.get("/:roomId/files", protect, getRoomFiles);
router.post("/:roomId/files/create", protect, createFile);
router.put("/:roomId/files/:fileId", protect, saveFileContent);
router.get("/:roomId/messages", protect, getRoomMessages);

module.exports = router;
