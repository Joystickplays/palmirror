"use client";


// gemini slop made this
// sorry
import React, { useEffect, useRef } from "react";
import { useDeveloperLogs } from "@/store/developerLogs";
import { usePLMGlobalConfig } from "@/context/PLMGlobalConfig";

export const DeveloperLogsViewer = () => {
  const PLMGC = usePLMGlobalConfig();
  const logs = useDeveloperLogs((state) => state.logs);
  const clearLogs = useDeveloperLogs((state) => state.clearLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!PLMGC.get("developerMode")) {
    return null;
  }

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-64 flex flex-col bg-black/80 backdrop-blur-md text-white text-xs rounded-lg shadow-xl border border-white/20 z-50 font-mono overflow-hidden">
      <div className="flex justify-between items-center p-2 bg-black/50 border-b border-white/10">
        <h3 className="font-bold text-gray-200">Developer Logs ({logs.length})</h3>
        <button 
          onClick={clearLogs} 
          className="bg-red-500/80 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors"
        >
          Clear
        </button>
      </div>
      
      <div ref={scrollRef} className="flex flex-col gap-1 p-2 overflow-y-auto">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`flex gap-2 ${
              log.level === 'error' ? 'text-red-400' 
              : log.level === 'warn' ? 'text-yellow-400' 
              : 'text-green-400'
            }`}
          >
            <span className="opacity-50 shrink-0">
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
            </span>
            <span className="break-all">{log.message}</span>
            {log.data && (
              <span className="opacity-70 truncate" title={JSON.stringify(log.data)}>
                {JSON.stringify(log.data)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
