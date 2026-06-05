import React, { useRef, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";

/**
 * Editor Component
 * Hosts the Monaco editor instance and synchronizes keystrokes/editor changes.
 * Avoids cursor jumping by using Monaco's native editing operations and uncontrolled state.
 *
 * @param {object} props
 * @param {string} props.roomId - The ID of the current room.
 * @param {string} props.initialCode - The initial editor content loaded from the server.
 * @param {string} props.language - The current programming language active in the room.
 * @param {function} props.onLanguageChange - Callback triggered when the local user selects a new language.
 * @param {object} props.socket - The shared socket.io-client connection instance.
 */
const LANGUAGE_TEMPLATES = {
  javascript: `// Welcome to the Collaborative Code Editor!
function hello() {
  console.log("Hello, World!");
}

hello();
`,
  typescript: `// Welcome to the Collaborative Code Editor!
function hello(): void {
  console.log("Hello, World!");
}

hello();
`,
  cpp: `// Welcome to the Collaborative Code Editor!
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`,
  c: `// Welcome to the Collaborative Code Editor!
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
  python: `# Welcome to the Collaborative Code Editor!
def hello():
    print("Hello, World!")

hello()
`,
  java: `// Welcome to the Collaborative Code Editor!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  php: `// Welcome to the Collaborative Code Editor!
<?php
echo "Hello, World!\\n";
?>
`
};

export default function Editor({
  roomId,
  initialCode,
  language,
  onLanguageChange,
  socket,
}) {
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false);
  const hasInitializedRef = useRef(false);

  // Set the initial value on mount or when the initial code is first loaded
  useEffect(() => {
    if (editorRef.current && initialCode !== undefined && !hasInitializedRef.current) {
      editorRef.current.setValue(initialCode);
      hasInitializedRef.current = true;
    }
  }, [initialCode]);

  // Hook into Monaco initialization
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    if (initialCode !== undefined && !hasInitializedRef.current) {
      editor.setValue(initialCode);
      hasInitializedRef.current = true;
    }
  };

  // Listen for real-time remote code changes from the socket
  useEffect(() => {
    if (!socket) return;

    const handleRemoteCodeChange = ({ code }) => {
      if (!editorRef.current) return;

      const model = editorRef.current.getModel();
      if (model && model.getValue() !== code) {
        // Toggle flag to prevent local change event handler from broadcasting this back
        isRemoteChange.current = true;

        // Preserve current cursor selection
        const selection = editorRef.current.getSelection();

        // Apply edits to the model. This keeps the undo/redo stack alive and prevents selection shifting.
        editorRef.current.executeEdits("remote-update", [
          {
            range: model.getFullModelRange(),
            text: code,
            forceMoveMarkers: true,
          },
        ]);

        // Restore selection if it existed
        if (selection) {
          editorRef.current.setSelection(selection);
        }

        isRemoteChange.current = false;
      }
    };

    socket.on("remote_code_change", handleRemoteCodeChange);

    return () => {
      socket.off("remote_code_change", handleRemoteCodeChange);
    };
  }, [socket]);

  // Handle local text edits made by the user
  const handleLocalChange = (newValue) => {
    // If the edit is a side-effect of a remote sync, ignore it
    if (isRemoteChange.current) return;

    // Broadcast the update to all other room members
    socket.emit("code_change", {
      roomId,
      code: newValue || "",
    });
  };

  // Switch the code template automatically if the editor is empty or matches the old template
  const handleLanguageSelect = (e) => {
    const newLang = e.target.value;

    if (editorRef.current) {
      const currentCode = editorRef.current.getValue().trim();
      const oldTemplate = (LANGUAGE_TEMPLATES[language] || "").trim();

      if (currentCode === "" || currentCode === oldTemplate) {
        const newTemplate = LANGUAGE_TEMPLATES[newLang] || "";

        // Manually update the editor instance
        editorRef.current.setValue(newTemplate);

        // Sync the code block to other clients
        socket.emit("code_change", {
          roomId,
          code: newTemplate,
        });
      }
    }

    // Inform parent component to broadcast language change
    onLanguageChange(newLang);
  };

  return (
    <div className="editor-container">
      <div className="editor-controls">
        <label htmlFor="language-select" className="control-label">
          Language:
        </label>
        <select
          id="language-select"
          className="language-select"
          value={language}
          onChange={handleLanguageSelect}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="php">PHP</option>
        </select>
      </div>

      <div className="monaco-wrapper">
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-light" // Keep minimal clean light theme style
          onMount={handleEditorDidMount}
          onChange={handleLocalChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
            lineNumbers: "on",
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: false,
          }}
        />
      </div>
    </div>
  );
}
