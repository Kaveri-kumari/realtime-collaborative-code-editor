/**
 * Lobby.jsx
 * Dashboard page for authenticated users to create or join collaborative rooms.
 */

import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { LogOut, Code, Plus, ArrowRight, User, AlertCircle } from "lucide-react";

export default function Lobby() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Read URL parameters on page load to pre-populate Room ID if redirecting from a shared link
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const roomParam = searchParams.get("room");
    if (roomParam) {
      setRoomIdToJoin(roomParam.trim());
    }
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError("");
    const cleanName = roomName.trim();
    if (!cleanName) return;

    setLoading(true);
    try {
      const res = await api.post("/rooms/create", { roomName: cleanName });
      const { roomId } = res.data.room;
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setError("");
    const cleanId = roomIdToJoin.trim();
    if (!cleanId) return;

    navigate(`/room/${cleanId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-900 rounded text-white">
            <Code className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Collaborative Editor</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 uppercase text-slate-800 text-xs font-bold">
              {user?.name?.charAt(0)}
            </div>
            <span>{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-md bg-white transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Sections */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome, {user?.name}!</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Create a new collaborative room, or enter a Room ID to join an ongoing workspace.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-md flex items-start gap-2 w-full max-w-2xl">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Card: Create Room */}
          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Create Workspace</h3>
              <p className="text-xs text-slate-500 mb-6">
                Start a fresh room, select custom files, and invite collaborators.
              </p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1" htmlFor="roomName">
                  Workspace Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Frontend Refactor"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !roomName.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <span>{loading ? "Creating..." : "Create Room"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Card: Join Room */}
          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Join Workspace</h3>
              <p className="text-xs text-slate-500 mb-6">
                Enter a unique 7-digit Room ID to connect to an existing room.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1" htmlFor="roomId">
                  Room ID
                </label>
                <input
                  id="roomId"
                  type="text"
                  required
                  value={roomIdToJoin}
                  onChange={(e) => setRoomIdToJoin(e.target.value)}
                  placeholder="e.g. z9k2p8a"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
              <button
                type="submit"
                disabled={!roomIdToJoin.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <span>Join Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
