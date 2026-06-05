/**
 * Message.js
 * MongoDB schema definition and model for Chat Messages.
 */

const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message content cannot be empty"],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
