/**
 * Navbar.jsx
 * Top navigation bar of the editor workspace.
 * Displays room details, online user count, share link triggers, and exit routes.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Code, Share2, LogOut, Users, Check, Copy } from "lucide-react";

export default function Navbar({ roomId, roomName, usersCount, onLeave, onShare }) {
  const handleShare = () => {
    if (onShare) onShare();
  };

  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 flex-shrink-0 select-none">
      {/* Brand Group */}
      <div className="flex items-center gap-3">
        <div className="p-1 bg-slate-900 rounded text-white flex-shrink-0">
          <Code className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-sm text-slate-900 tracking-tight block">
            Collaborative Code Editor
          </span>
          <span className="text-xs text-slate-400 font-medium block -mt-0.5">
            Room: {roomName || "Loading..."}
          </span>
        </div>
      </div>

      {/* Middle Status Items */}
      <div className="flex items-center gap-3">
        {/* Room ID Display */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700">
          <span className="font-semibold text-slate-400">ID:</span>
          <code className="font-mono font-bold tracking-wider">{roomId}</code>
        </div>

        {/* Online User Counter */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700">
          <Users className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-bold">{usersCount}</span>
          <span className="text-slate-400">online</span>
        </div>
      </div>

      {/* Actions Group */}
      <div className="flex items-center gap-2">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition duration-150 bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Invite</span>
        </button>

        {/* Exit Workspace Button */}
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 text-xs font-semibold border border-red-100 hover:border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 px-3 py-1.5 rounded transition duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Workspace</span>
        </button>
      </div>
    </header>
  );
}
