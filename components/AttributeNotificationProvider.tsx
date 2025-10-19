"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AttributeProgress from "./AttributeProgress";

type NotificationData = {
  id: number;
  attribute: string;
  fromVal: number;
  toVal: number;
};

type NotificationContextType = {
  create: (data: Omit<NotificationData, "id">) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useAttributeNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useAttributeNotification must be used within <AttributeNotificationProvider>");
  return ctx;
}

export default function AttributeNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const create = useCallback((data: Omit<NotificationData, "id">) => {
    const id = Date.now() + Math.random();
    const notif = { id, ...data };
    setNotifications((prev) => [...prev, notif]);
  }, []);

  const remove = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ create }}>
      {children}

      {/* Notification layer */}
      <div className="fixed top-4 left-0 right-0 flex justify-center items-center gap-2 z-[9999] pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => (
            <AttributeNotificationInstance
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

function AttributeNotificationInstance({
  data,
  onDone,
}: {
  data: NotificationData;
  onDone: () => void;
}) {
  const [value, setValue] = useState(data.fromVal);
  const [animate, setAnimate] = useState(false);

  
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setValue(data.toVal);
      setAnimate(true)
    }, 1000);

    const timer2 = setTimeout(() => {
      onDone();
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [data, onDone]);

  return (
    <motion.div
      key={data.id}
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 16 }}
      className="p-4 border border-white/10 bg-background rounded-2xl font-sans" 
      layout
    >
      <AttributeProgress
        attr={{
          key: data.id,
          attribute: data.attribute,
          value,
          history: []
        }}
        animated={animate}
      />
    </motion.div>
  );
}
