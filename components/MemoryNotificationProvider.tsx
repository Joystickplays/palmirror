"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

type NotificationData = {
  id: number;
  message: string;
};

type NotificationContextType = {
  create: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useMemoryNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useMemoryNotification must be used within <MemoryNotificationProvider>");
  return ctx;
}

export default function MemoryNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const create = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    const notif = { id, message };
    setNotifications((prev) => [...prev, notif]);
  }, []);

  const remove = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ create }}>
      {children}

      {/* Notification layer */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center items-center gap-2 z-[9999] pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => (
            <MemoryNotificationInstance
              key={notif.id}
              data={notif}
              onDone={() => remove(notif.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

function MemoryNotificationInstance({
  data,
  onDone,
}: {
  data: NotificationData;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      key={data.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: "spring", mass: 1, stiffness: 161, damping: 16 }}
      className="p-4 border border-white/10 bg-background rounded-2xl shadow-lg pointer-events-auto font-sans"
      layout
    >
      <p className="text-sm font-medium text-white">{data.message}</p>
    </motion.div>
  );
}
