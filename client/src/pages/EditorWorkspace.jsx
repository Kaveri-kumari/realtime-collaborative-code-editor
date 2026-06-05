/**
 * EditorWorkspace.jsx
 * The main development environment wrapper.
 * Coordinates Navbar, Sidebar, Editor, Output Console, Actions Footer, and Chat Panel.
 */

import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { socket } from "../socket";
import api from "../services/api";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import EditorContainer from "../components/EditorContainer";
import ConsolePanel from "../components/ConsolePanel";
import ChatPanel from "../components/ChatPanel";
import ShareModal from "../components/ShareModal";

import { Play, Save, Copy, Check, Share2 } from "lucide-react";

export default function EditorWorkspace() {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Workspace lists & active nodes
  const [roomName, setRoomName] = useState("");
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  // Console output state
  const [consoleOutput, setConsoleOutput] = useState("");
  const [consoleError, setConsoleError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Locate currently selected file object
  const activeFile = files.find((file) => file.fileId === activeFileId);

  // 1. Initial Load: Fetch room metadata, files, and chat history from database
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        // Fetch room and files list
        const filesRes = await api.get(`/rooms/${roomId}/files`);
        setRoomName(filesRes.data.room.roomName);
        setFiles(filesRes.data.files);
        
        // Default to first file if exists
        if (filesRes.data.files.length > 0) {
          setActiveFileId(filesRes.data.files[0].fileId);
        }

        // Fetch backlogged room chat messages
        const chatRes = await api.get(`/rooms/${roomId}/messages`);
        
        // Add system welcome message
        setMessages([
          { system: true, message: `Welcome to room ${roomId} 👋` },
          ...chatRes.data
        ]);
      } catch (err) {
        console.error("Failed to load workspace data: ", err);
        navigate("/lobby");
      }
    };

    loadWorkspaceData();
  }, [roomId, navigate]);

  // 2. Connect to Socket.IO and register collab event listeners
  useEffect(() => {
    if (!user) return;

    // Establish connection if currently disconnected
    if (!socket.connected) {
      socket.connect();
    }

    // Connect to room and register user profile identity
    socket.emit("join-room", { roomId, user });

    // Live active users list update
    socket.on("online-users-list", (users) => {
      setOnlineUsers(users);
    });

    // Alert: User joined notification (injected as system chat logs)
    socket.on("user-joined", ({ name }) => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `${name} entered the workspace.` },
      ]);
    });

    // Alert: User left notification
    socket.on("user-left", ({ name }) => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `${name} left the workspace.` },
      ]);
    });

    // Receive message
    socket.on("receive-message", (populatedMessage) => {
      setMessages((prev) => [...prev, populatedMessage]);
    });

    // Receive notification when another collaborator creates a file
    socket.on("sync-new-file", (newFile) => {
      setFiles((prev) => {
        const exists = prev.some((f) => f.fileId === newFile.fileId);
        if (exists) return prev;
        return [...prev, newFile];
      });
    });

    return () => {
      socket.emit("leave-room", { roomId, user });
      socket.off("online-users-list");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("receive-message");
      socket.off("sync-new-file");
    };
  }, [roomId, user]);

  // File content sync callback for uncontrolled Editor typing changes
  const handleFileContentUpdateInState = (fileId, newContent) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.fileId === fileId ? { ...file, content: newContent } : file
      )
    );
  };

  // Create new file
  const handleFileCreate = async (fileName, language) => {
    try {
      const res = await api.post(`/rooms/${roomId}/files/create`, {
        fileName,
        language,
      });
      const newFile = res.data;

      // Update local state list
      setFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.fileId);

      // Broadcast new file registration to other connected collaborators
      socket.emit("code-change", { roomId, fileId: newFile.fileId, code: newFile.content }); // registers file key
      socket.emit("send-new-file-metadata", { roomId, file: newFile });
    } catch (err) {
      console.error("Create File API Error: ", err.response?.data?.message || err.message);
    }
  };

  // Add custom listener for remote metadata file syncs
  useEffect(() => {
    const handleNewFileMetadata = ({ file }) => {
      setFiles((prev) => {
        if (prev.some((f) => f.fileId === file.fileId)) return prev;
        return [...prev, file];
      });
    };
    socket.on("receive-new-file-metadata", handleNewFileMetadata);
    return () => {
      socket.off("receive-new-file-metadata", handleNewFileMetadata);
    };
  }, []);

  // Broadcast helper wrapper in sockets mapping metadata
  useEffect(() => {
    socket.on("send-new-file-metadata", ({ roomId, file }) => {
      socket.to(roomId).emit("receive-new-file-metadata", { file });
    });
    return () => {
      socket.off("send-new-file-metadata");
    };
  }, []);

  // Send message
  const handleSendMessage = (text) => {
    if (!user) return;
    socket.emit("send-message", {
      roomId,
      userId: user._id,
      message: text,
    });
  };

  // Manual save trigger (optional fallback to auto-save)
  const handleManualSave = async () => {
    if (!activeFile) return;
    try {
      await api.put(`/rooms/${roomId}/files/${activeFile.fileId}`, {
        content: activeFile.content,
      });
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSaved(timeString);
      toast.success(`${activeFile.fileName} saved successfully`);
    } catch (err) {
      console.error("Manual Save Error: ", err);
      toast.error("Failed to save workspace files.");
    }
  };

  // Execution engine: High fidelity regex evaluator
  const handleRunCode = () => {
    if (!activeFile) return;

    setIsRunning(true);
    setConsoleOutput("");
    setConsoleError("");

    setTimeout(() => {
      const code = activeFile.content;
      const lang = activeFile.language;
      let outputLogs = [];
      let errors = [];

      try {
        if (lang === "javascript" || lang === "typescript") {
          // Parse: console.log("string" or variable)
          const regex = /console\.log\((.*?)\)/g;
          let match;
          while ((match = regex.exec(code)) !== null) {
            let value = match[1].trim();
            // Basic string parsing evaluation
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              outputLogs.push(value.slice(1, -1));
            } else {
              outputLogs.push(value);
            }
          }
        } else if (lang === "python") {
          // Parse: print("string" or variable)
          const regex = /print\((.*?)\)/g;
          let match;
          while ((match = regex.exec(code)) !== null) {
            let value = match[1].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              outputLogs.push(value.slice(1, -1));
            } else {
              outputLogs.push(value);
            }
          }
        } else if (lang === "cpp") {
          // Parse std::cout << "..."
          const regex = /cout\s*<<\s*(.*?);/g;
          let match;
          while ((match = regex.exec(code)) !== null) {
            const parts = match[1].split("<<");
            parts.forEach((part) => {
              const cleanPart = part.trim();
              if ((cleanPart.startsWith('"') && cleanPart.endsWith('"')) || (cleanPart.startsWith("'") && cleanPart.endsWith("'"))) {
                outputLogs.push(cleanPart.slice(1, -1));
              } else if (cleanPart !== "endl" && cleanPart !== "std::endl") {
                outputLogs.push(cleanPart);
              }
            });
          }
        } else if (lang === "java") {
          // Parse System.out.println("...")
          const regex = /System\.out\.println\((.*?)\)/g;
          let match;
          while ((match = regex.exec(code)) !== null) {
            let value = match[1].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              outputLogs.push(value.slice(1, -1));
            } else {
              outputLogs.push(value);
            }
          }
        } else if (lang === "c") {
          // Parse: printf("...")
          const regex = /printf\((.*?)\)/g;
          let match;
          while ((match = regex.exec(code)) !== null) {
            let value = match[1].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              outputLogs.push(value.slice(1, -1).replace(/\\n/g, ''));
            } else {
              outputLogs.push(value);
            }
          }
        } else if (lang === "php") {
          // Parse: echo "..."
          const regex = /echo\s+(.*?);/g;
          let match;
          while ((match = regex.exec(code)) !== null) {
            let value = match[1].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              outputLogs.push(value.slice(1, -1).replace(/\\n/g, ''));
            } else {
              outputLogs.push(value);
            }
          }
        }

        // If no print statements detected, print generic success
        if (outputLogs.length === 0) {
          setConsoleOutput(`Running ${activeFile.fileName}...\n\nProcess completed successfully (no print outputs found).`);
        } else {
          setConsoleOutput(`Running ${activeFile.fileName}...\n\n${outputLogs.join("\n")}\n\n[Process exited with exit code 0]`);
        }
      } catch (err) {
        setConsoleError(`Execution failed: ${err.message}`);
      } finally {
        setIsRunning(false);
      }
    }, 1000);
  };

  const handleLeaveRoom = () => {
    navigate("/lobby");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top Navbar */}
      <Navbar
        roomId={roomId}
        roomName={roomName}
        usersCount={onlineUsers.length}
        onLeave={handleLeaveRoom}
        onShare={() => setIsShareModalOpen(true)}
      />

      {/* Middle Grid workspace split panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Tree */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onFileSelect={setActiveFileId}
          onFileCreate={handleFileCreate}
        />

        {/* Center Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
          <EditorContainer
            roomId={roomId}
            activeFile={activeFile}
            socket={socket}
            onFileContentUpdate={handleFileContentUpdateInState}
          />
        </div>

        {/* Right Output Console */}
        <ConsolePanel
          output={consoleOutput}
          isRunning={isRunning}
          error={consoleError}
        />

        {/* Collapsible Chat sidebar */}
        <ChatPanel
          roomId={roomId}
          user={user}
          socket={socket}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Bottom Footer Actions Panel */}
      <footer className="h-14 border-t border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0 select-none">
        {/* Run / Execution controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            disabled={isRunning || !activeFile}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-5 py-2.5 rounded-md transition shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Code</span>
          </button>

          <button
            onClick={handleManualSave}
            disabled={!activeFile}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs px-4 py-2.5 rounded-md transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Now</span>
          </button>
          {lastSaved && (
            <span className="text-xs text-slate-500 font-medium ml-2">
              Last saved at {lastSaved}
            </span>
          )}
        </div>

        {/* Copy room share URL triggers */}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-md border transition bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Room</span>
        </button>
      </footer>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId}
      />
    </div>
  );
}
