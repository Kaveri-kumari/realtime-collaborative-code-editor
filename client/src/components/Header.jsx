import React from "react";

/**
 * Header Component
 * Renders the top navigation/header area of the application.
 * Shows the application title and the connection state with a status dot.
 *
 * @param {object} props
 * @param {boolean} props.connected - State indicating whether Socket.IO is connected to the backend.
 */
export default function Header({ connected }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <h1 className="header-title">Collaborative Code Editor</h1>
      </div>
      <div className="connection-status-panel">
        <span className={`status-dot ${connected ? "connected" : "disconnected"}`}></span>
        <span className="status-label">{connected ? "Connected" : "Disconnected"}</span>
      </div>
    </header>
  );
}
