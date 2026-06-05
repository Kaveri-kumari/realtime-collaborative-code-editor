/**
 * ConsolePanel.jsx
 * Outputs and compilation console on the right side of the editor dashboard.
 * Simulates code runs and displays syntax runtime outputs or compile errors.
 */

import React from "react";
import { Terminal, RefreshCw, AlertTriangle } from "lucide-react";

export default function ConsolePanel({ output, isRunning, error }) {
  return (
    <div className="w-72 border-l border-slate-200 bg-white flex flex-col h-full flex-shrink-0">
      {/* Console Header bar */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0 select-none">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-slate-500" />
          <span>Console Output</span>
        </div>
      </div>

      {/* Console Print Area */}
      <div className="flex-1 bg-slate-950 p-4 font-mono text-xs overflow-y-auto text-slate-350 flex flex-col">
        {isRunning ? (
          <div className="flex items-center gap-2 text-slate-400 select-none">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Compiling and running code...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 space-y-1.5 select-text">
            <div className="flex items-center gap-1 font-semibold text-red-500">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Runtime Error:</span>
            </div>
            <pre className="pl-3 border-l-2 border-red-600/70 whitespace-pre-wrap leading-relaxed font-mono">
              {error}
            </pre>
          </div>
        ) : output ? (
          <pre className="whitespace-pre-wrap flex-1 leading-relaxed text-slate-200 select-text font-mono">
            {output}
          </pre>
        ) : (
          <div className="text-slate-600 italic flex-1 flex items-center justify-center text-center p-4 select-none">
            Click the "Run Code" button below to execute the active file.
          </div>
        )}
      </div>
    </div>
  );
}
