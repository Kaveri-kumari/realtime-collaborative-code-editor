/**
 * db.js
 * MongoDB database connection manager using Mongoose.
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Falls back to a local MongoDB instance if MONGO_URI environment variable is not defined
    const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collab-editor";
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
