/**
 * EditorContainer.jsx
 * Hosts the tabbed interface, the Monaco editor instance,
 * real-time socket keystroke syncing, and auto-save indicators.
 */

import React, { useRef, useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import api from "../services/api";
import { FileCode, CloudLightning, Save, CloudCheck } from "lucide-react";

export default function EditorContainer({
  roomId,
  activeFile,
  socket,
  onFileContentUpdate, // Callback to update file cache in parent state
}) {
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved", "saving", "error"
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false);
  const saveTimeoutRef = useRef(null);

  // Set the initial value on mount or when switching active files
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    if (activeFile) {
      editor.setValue(activeFile.content);
    }
  };

  // Sync state if activeFile content changes remotely
  useEffect(() => {
    if (!socket || !activeFile) return;

    const handleRemoteCodeChange = ({ fileId, code }) => {
      // Check if the update belongs to our current active file
      if (fileId !== activeFile.fileId) {
        // Update the file cache in parent state anyway so it doesn't get lost
        onFileContentUpdate(fileId, code);
        return;
      }

      if (!editorRef.current) return;

      const model = editorRef.current.getModel();
      if (model && model.getValue() !== code) {
        isRemoteChange.current = true;

        const selection = editorRef.current.getSelection();

        // Apply remote changes cleanly
        editorRef.current.executeEdits("remote-update", [
          {
            range: model.getFullModelRange(),
            text: code,
            forceMoveMarkers: true,
          },
        ]);

        if (selection) {
          editorRef.current.setSelection(selection);
        }

        // Cache the code back in the parent state
        onFileContentUpdate(activeFile.fileId, code);

        isRemoteChange.current = false;
      }
    };

    socket.on("receive-code", handleRemoteCodeChange);

    return () => {
      socket.off("receive-code", handleRemoteCodeChange);
    };
  }, [socket, activeFile, onFileContentUpdate]);

  // Handle local text edits
  const handleLocalChange = (newValue) => {
    if (isRemoteChange.current || !activeFile) return;

    const codeContent = newValue || "";

    // 1. Instantly update the parent state cache
    onFileContentUpdate(activeFile.fileId, codeContent);

    // 2. Broadcast changes to other collaborators in real-time
    socket.emit("code-change", {
      roomId,
      fileId: activeFile.fileId,
      code: codeContent,
    });

    // 3. Trigger database auto-save debounce (1.5 seconds)
    setSaveStatus("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/rooms/${roomId}/files/${activeFile.fileId}`, {
          content: codeContent,
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Database auto-save error: ", err);
        setSaveStatus("error");
      }
    }, 1500);
  };

  // Clean up pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!activeFile) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center text-slate-400 select-none">
        <FileCode className="w-12 h-12 mb-3 stroke-[1.5]" />
        <p className="text-sm">Select a file from the sidebar to start writing code</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      {/* File Header Details & Save Indicator */}
      <div className="h-10 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50 flex-shrink-0 select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-slate-700">
            {activeFile.fileName}
          </span>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-200/50 px-1.5 py-0.5 rounded uppercase">
            {activeFile.language}
          </span>
        </div>

        {/* Auto Save Status Lights */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium">
          {saveStatus === "saving" && (
            <div className="flex items-center gap-1 text-amber-600">
              <CloudLightning className="w-3.5 h-3.5 animate-pulse" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="flex items-center gap-1 text-slate-400">
              <CloudCheck className="w-3.5 h-3.5 text-green-500" />
              <span>All changes saved</span>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-1 text-red-600">
              <Save className="w-3.5 h-3.5" />
              <span>Save error</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor Frame */}
      <div className="flex-1 relative">
        <MonacoEditor
          // Force remount when changing active file to avoid value bleeds or layout glitches
          key={activeFile.fileId}
          height="100%"
          language={activeFile.language}
          theme="vs-light"
          onMount={handleEditorDidMount}
          onChange={handleLocalChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "Fira Code, Consolas, Courier New, monospace",
            wordWrap: "on",
            automaticLayout: true,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            roundedSelection: true,
            readOnly: false,
          }}
        />
      </div>
    </div>
  );
}
