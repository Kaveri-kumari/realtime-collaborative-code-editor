/**
 * roomController.js
 * Controller handling Room creation and joining, multi-file workspace setups,
 * file modifications, and chat message databases.
 */

const Room = require("../models/Room");
const File = require("../models/File");
const Message = require("../models/Message");

// Starter code templates
const JS_TEMPLATE = `// Welcome to the Collaborative Code Editor!

function hello() {
    console.log("Hello, World!");
}

hello();
`;

const CPP_TEMPLATE = `// Welcome to the Collaborative Code Editor!

#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`;

const PYTHON_TEMPLATE = `# Welcome to the Collaborative Code Editor!

def hello():
    print("Hello, World!")

hello()
`;

const JAVA_TEMPLATE = `// Welcome to the Collaborative Code Editor!

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`;

const C_TEMPLATE = `// Welcome to the Collaborative Code Editor!

#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`;

const TS_TEMPLATE = `// Welcome to the Collaborative Code Editor!

function hello(): void {
    console.log("Hello, World!");
}

hello();
`;

const PHP_TEMPLATE = `<?php
// Welcome to the Collaborative Code Editor!

echo "Hello, World!";
?>
`;

const getTemplateByLanguage = (language, fileName) => {
  switch (language?.toLowerCase()) {
    case "javascript":
    case "js":
      return JS_TEMPLATE;
    case "typescript":
    case "ts":
      return TS_TEMPLATE;
    case "cpp":
    case "c++":
      return CPP_TEMPLATE;
    case "c":
      return C_TEMPLATE;
    case "python":
    case "py":
      return PYTHON_TEMPLATE;
    case "java":
      return JAVA_TEMPLATE;
    case "php":
      return PHP_TEMPLATE;
    default:
      return `// Dynamic template for ${fileName}\n`;
  }
};

/**
 * @desc    Create a new collaborative room
 * @route   POST /api/rooms/create
 * @access  Private
 */
const createRoom = async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({ message: "Please provide a room name" });
    }

    // Generate a unique 7-digit alphanumeric Room ID
    let roomId;
    let roomExists = true;
    while (roomExists) {
      roomId = Math.random().toString(36).substring(2, 9);
      const existing = await Room.findOne({ roomId });
      if (!existing) {
        roomExists = false;
      }
    }

    // Create the room
    const room = await Room.create({
      roomId,
      roomName,
      createdBy: req.user._id,
      participants: [req.user._id],
    });

    // Create a default file (index.js) so the workspace starts with a file
    const fileId = Math.random().toString(36).substring(2, 9);
    const defaultFile = await File.create({
      fileId,
      roomId,
      fileName: "index.js",
      content: JS_TEMPLATE,
      language: "javascript",
    });

    res.status(201).json({
      room,
      defaultFile,
    });
  } catch (error) {
    console.error("Create Room Error: ", error.message);
    res.status(500).json({ message: "Server error creating room" });
  }
};

/**
 * @desc    Get all files in a specific room
 * @route   GET /api/rooms/:roomId/files
 * @access  Private
 */
const getRoomFiles = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Fetch all files associated with this room
    const files = await File.find({ roomId });
    res.json({ room, files });
  } catch (error) {
    console.error("Get Room Files Error: ", error.message);
    res.status(500).json({ message: "Server error loading workspace files" });
  }
};

/**
 * @desc    Create a new file in a room
 * @route   POST /api/rooms/:roomId/files/create
 * @access  Private
 */
const createFile = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { fileName, language } = req.body;

    if (!fileName || !language) {
      return res.status(400).json({ message: "Please enter fileName and language" });
    }

    // Check if room exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Prevent duplicate filenames in the same room
    const fileExists = await File.findOne({ roomId, fileName });
    if (fileExists) {
      return res.status(400).json({ message: "A file with that name already exists" });
    }

    // Create file
    const fileId = Math.random().toString(36).substring(2, 9);
    const file = await File.create({
      fileId,
      roomId,
      fileName,
      content: getTemplateByLanguage(language, fileName),
      language,
    });

    res.status(201).json(file);
  } catch (error) {
    console.error("Create File Error: ", error.message);
    res.status(500).json({ message: "Server error creating new file" });
  }
};

/**
 * @desc    Save the contents of a file
 * @route   PUT /api/rooms/:roomId/files/:fileId
 * @access  Private
 */
const saveFileContent = async (req, res) => {
  try {
    const { roomId, fileId } = req.params;
    const { content } = req.body;

    const file = await File.findOneAndUpdate(
      { roomId, fileId },
      { content },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(file);
  } catch (error) {
    console.error("Save File Error: ", error.message);
    res.status(500).json({ message: "Server error saving code" });
  }
};

/**
 * @desc    Get chat message archives for a room
 * @route   GET /api/rooms/:roomId/messages
 * @access  Private
 */
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Fetch messages populated with sender's profile detail name
    const messages = await Message.find({ roomId })
      .populate("sender", "name")
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error("Get Messages Error: ", error.message);
    res.status(500).json({ message: "Server error loading chat archives" });
  }
};

module.exports = {
  createRoom,
  getRoomFiles,
  createFile,
  saveFileContent,
  getRoomMessages,
};
