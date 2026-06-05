/**
 * Sidebar.jsx
 * File tree navigator and creation utility in the workspace sidebar.
 */

import React, { useState } from "react";
import { Folder, FileCode, Plus, Check, X, AlertCircle } from "lucide-react";

// Extension mapper to determine Monaco Editor syntax modes
const getLanguageFromExtension = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "cpp":
    case "h":
    case "cc":
      return "cpp";
    case "c":
      return "c";
    case "py":
      return "python";
    case "java":
      return "java";
    case "php":
      return "php";
    case "html":
      return "html";
    case "css":
      return "css";
    default:
      return "javascript"; // Default fallback
  }
};

export default function Sidebar({ files = [], activeFileId, onFileSelect, onFileCreate }) {
  const [showInput, setShowInput] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const cleanName = newFileName.trim();

    if (!cleanName) return;

    // Validate filename rules (no slashes, length)
    if (cleanName.includes("/") || cleanName.includes("\\")) {
      setError("Directories are not supported.");
      return;
    }

    // Check for duplicate filenames
    const exists = files.some(
      (file) => file.fileName.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      setError("File name already exists.");
      return;
    }

    const language = getLanguageFromExtension(cleanName);
    onFileCreate(cleanName, language);

    // Reset fields
    setNewFileName("");
    setShowInput(false);
  };

  return (
    <aside className="w-60 border-r border-slate-200 bg-slate-50 flex flex-col h-full flex-shrink-0 select-none">
      {/* Sidebar Header Title */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Folder className="w-4 h-4 text-slate-500" />
          <span className="font-bold text-xs uppercase tracking-wider">Files</span>
        </div>
        <button
          onClick={() => {
            setShowInput(true);
            setError("");
          }}
          className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          title="Create New File"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Creation Inline Box */}
      {showInput && (
        <form onSubmit={handleSubmit} className="p-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-1 border border-slate-200 rounded px-2 py-1 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 bg-slate-50">
            <FileCode className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. main.py, App.js"
              className="bg-transparent border-none outline-none text-xs w-full text-slate-900"
            />
          </div>
          {error && (
            <div className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => {
                setShowInput(false);
                setNewFileName("");
                setError("");
              }}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              disabled={!newFileName.trim()}
              className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-8">
            No files in workspace.
          </div>
        ) : (
          files.map((file) => {
            const isActive = file.fileId === activeFileId;
            return (
              <button
                key={file.fileId}
                onClick={() => onFileSelect(file.fileId)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition select-none text-xs ${
                  isActive
                    ? "bg-slate-200/60 font-semibold text-slate-900 border-l-2 border-blue-600 pl-2 rounded-l-none"
                    : "text-slate-600 hover:bg-slate-200/30 hover:text-slate-900"
                }`}
              >
                <FileCode className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                <span className="truncate">{file.fileName}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
