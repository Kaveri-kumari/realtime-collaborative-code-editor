/**
 * ChatPanel.jsx
 * Side chat panel for collaborators.
 * Features message logs, typing indicators, collapsible frames, and system alerts.
 */

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ChevronRight, MessageCircle } from "lucide-react";

export default function ChatPanel({
  roomId,
  user,
  socket,
  messages = [],
  onSendMessage,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]); // List of users typing
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll messages list to the bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  // Listen for socket typing broadcasts
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = ({ name }) => {
      setTypingUsers((prev) => {
        if (prev.includes(name)) return prev;
        return [...prev, name];
      });
    };

    const handleUserStopTyping = ({ name }) => {
      setTypingUsers((prev) => prev.filter((username) => username !== name));
    };

    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);

    return () => {
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
    };
  }, [socket]);

  // Handle keypresses to broadcast typing state
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (socket && user) {
      socket.emit("typing-start", {
        roomId,
        name: user.name,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing notification after 1.5 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing-stop", {
          roomId,
          name: user.name,
        });
      }, 1500);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) return;

    onSendMessage(cleanText);
    setText("");

    // Reset typing flags immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socket && user) {
      socket.emit("typing-stop", {
        roomId,
        name: user.name,
      });
    }
  };

  const renderTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return "Several users are typing...";
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-105 z-40 select-none border border-slate-700"
        title="Open Workspace Chat"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside className="w-76 border-l border-slate-200 bg-white flex flex-col h-full flex-shrink-0 select-none">
      {/* Chat header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <span>Workspace Chat</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
          title="Minimize Chat"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Messages logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-12">
            No messages yet. Send a greeting to the workspace!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystem = msg.system;
            const isSelf = msg.sender?._id === user?._id;

            if (isSystem) {
              return (
                <div
                  key={index}
                  className="flex flex-col items-start mb-2"
                >
                  <span className="text-[10px] font-semibold text-slate-400 mb-0.5 px-1">
                    System:
                  </span>
                  <div className="text-xs text-slate-500 px-1">
                    {msg.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] font-semibold text-slate-400 mb-0.5 px-1">
                  {isSelf ? "You" : msg.sender?.name}:
                </span>
                <div
                  className={`text-xs px-3 py-2 rounded-lg max-w-[85%] break-words shadow-sm leading-relaxed ${
                    isSelf
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Inputs bar */}
      <div className="border-t border-slate-200 p-3 bg-white flex-shrink-0">
        {typingUsers.length > 0 && (
          <div className="text-xs text-slate-500 pb-1.5 px-1">
            {renderTypingText()}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder="Send message..."
            className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white p-1.5 rounded-md transition flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
