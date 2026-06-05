import React, { useState } from 'react';
import { Copy, Check, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareModal({ isOpen, onClose, roomId }) {
  const [copied, setCopied] = useState(false);
  const roomUrl = `${window.location.origin}/lobby?room=${roomId}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopied(true);
      toast.success("Room link copied successfully!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-bold text-slate-900 mb-4">Share Room</h2>
        <p className="text-sm text-slate-600 mb-4">
          Invite others to collaborate by sharing this link:
        </p>

        {/* Read-only input field */}
        <div className="flex items-center mb-4">
          <input
            type="text"
            readOnly
            value={roomUrl}
            className="flex-1 border border-slate-300 rounded-l-md px-3 py-2 text-sm text-slate-700 bg-slate-50 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-r-md flex items-center gap-2 text-sm font-semibold transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Clickable anchor tag */}
        <div className="mb-6">
          <a
            href={roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
          >
            {roomUrl}
          </a>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
          >
            Cancel
          </button>
          <a
            href={roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open Link
          </a>
        </div>
      </div>
    </div>
  );
}
