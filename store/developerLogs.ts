import { create } from 'zustand';
import { PLMGlobalConfigServiceInstance } from '@/context/PLMGlobalConfigService';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  data?: any;
  level: LogLevel;
}

interface DeveloperLogsState {
  logs: LogEntry[];
  addLog: (message: string, level?: LogLevel, data?: any) => void;
  clearLogs: () => void;
}

export const useDeveloperLogs = create<DeveloperLogsState>((set) => ({
  logs: [],
  addLog: (message, level = 'info', data) =>
    set((state) => {
      const newLogs = [...state.logs, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        message,
        data,
        level,
      }];
      if (newLogs.length > 20) newLogs.shift();
      return { logs: newLogs };
    }),
  clearLogs: () => set({ logs: [] }),
}));

export const devLog = (message: string, level: LogLevel = 'info', data?: any) => {
  if (!PLMGlobalConfigServiceInstance.get("developerMode")) return;
  useDeveloperLogs.getState().addLog(message, level, data);
};
