/**
 * File.js
 * MongoDB schema definition and model for Files.
 * Allows multiple files to be created and saved in each room.
 */

const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true, // Speeds up lookups of files by room
    },
    fileName: {
      type: String,
      required: [true, "Please provide a file name"],
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "javascript",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", FileSchema);
