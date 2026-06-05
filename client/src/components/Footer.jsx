import React, { useState } from "react";

/**
 * Footer Component
 * Renders the room identity details, and a button to copy the room ID
 * to clipboard for easy sharing.
 *
 * @param {object} props
 * @param {string} props.roomId - The ID of the collaborative room.
 */
export default function Footer({ roomId }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!roomId) return;
    
    // Copy the Room ID string to clipboard
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy room ID: ", err);
    });
  };

  return (
    <footer className="app-footer">
      <div className="footer-room-details">
        <span className="room-label">Room ID:</span>
        <span className="room-value-display">{roomId}</span>
        <button
          onClick={handleCopy}
          className={`copy-room-btn ${copied ? "copied" : ""}`}
          type="button"
        >
          {copied ? "Copied!" : "Copy Room ID"}
        </button>
      </div>
      <div className="footer-info-note">
        Share the Room ID or the URL with other users to collaborate in real-time.
      </div>
    </footer>
  );
}
