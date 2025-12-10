"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, X } from "lucide-react";

type NotificationData = {
    id: number;
    message: string;
    type: "neutral" | "info" | "success" | "error";
    createdAt: number;
    duration: number;
};

type NotificationContextType = {
    create: (message: string, type?: "neutral" | "info" | "success" | "error", durationMs?: number) => void;
    info: (message: string, durationMs?: number) => void;
    success: (message: string, durationMs?: number) => void;
    error: (message: string, durationMs?: number) => void;
};

const notificationVariants = {
    neutral: {
        textColor: "text-white",
        bgColor: "bg-background",
        accentColor: "border-l-white/50",
        icon: null,
    },
    info: {
        textColor: "text-blue-400",
        bgColor: "bg-blue-400",
        accentColor: "border-l-blue-400",
        icon: Info,
    },
    success: {
        textColor: "text-green-400",
        bgColor: "bg-green-400",
        accentColor: "border-l-green-400",
        icon: CheckCircle,
    },
    error: {
        textColor: "text-red-400",
        bgColor: "bg-red-400",
        accentColor: "border-l-red-400",
        icon: X,
    },
}

const NotificationContext = createContext<NotificationContextType | null>(null);



export function usePMNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("usePMNotification must be used within <PMNotificationProvider>");
    return ctx;
}

export default function PMNotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    const create = useCallback((
        message: string,
        type: "neutral" | "info" | "success" | "error" = "neutral",
        durationMs = 7500
    ) => {
        const id = Date.now() + Math.random();
        const notif: NotificationData = { id, message, type, createdAt: Date.now(), duration: durationMs };
        setNotifications((prev) => [notif, ...prev]);
    }, []);

    // helper functions
    const info = useCallback((message: string, durationMs = 7500) => {
        create(message, "info", durationMs);
    }, [create]);

    const success = useCallback((message: string, durationMs = 7500) => {
        create(message, "success", durationMs);
    }, [create]);

    const error = useCallback((message: string, durationMs = 7500) => {
        create(message, "error", durationMs);
    }, [create]);

    const remove = useCallback((id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);



    return (
        <NotificationContext.Provider value={{ create, info, success, error }}>
            {children}

            <div className="fixed top-4 left-0 right-4 flex flex-col justify-center items-end gap-2 z-9999 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {notifications.map((notif, index) => (
                        <motion.div
                            key={notif.id}
                            className="w-80"
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ type: "spring", mass: 1, stiffness: 161, damping: 16 }}>
                            <PMNotificationInstance
                                key={notif.id}
                                data={notif}
                                index={index}
                                onDone={() => remove(notif.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
}



function PMNotificationInstance({
    data,
    index,
    onDone,
}: {
    data: NotificationData;
    index: number;
    onDone: () => void;
}) {
    const timerRef = useRef<number | null>(null);
    const remainingRef = useRef<number>(data.duration - (Date.now() - data.createdAt));
    const endTimeRef = useRef<number>(Date.now() + remainingRef.current);
    const mountedRef = useRef(true);

    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        mountedRef.current = true;

        const initialRemaining = data.duration - (Date.now() - data.createdAt);
        remainingRef.current = Math.max(0, initialRemaining);
        endTimeRef.current = Date.now() + remainingRef.current;

        if (remainingRef.current <= 0) {
            onDone();
            return;
        }

        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            if (!mountedRef.current) return;
            onDone();
        }, remainingRef.current);

        return () => {
            mountedRef.current = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [data.createdAt, data.duration, onDone]);

    const handleMouseEnter = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        const rem = endTimeRef.current - Date.now();
        remainingRef.current = Math.max(0, rem);
        setHovering(true);
    };

    const handleMouseLeave = () => {
        if (remainingRef.current <= 0) {
            onDone();
            return;
        }
        endTimeRef.current = Date.now() + remainingRef.current;
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            onDone();
        }, remainingRef.current);
        setHovering(false);
    };

    const forceClose = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        remainingRef.current = 0;
        mountedRef.current = false;
        onDone();
    }, [onDone]);


    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{
                paddingRight: "28px",
                scale: 1.02,
                transition: {
                    duration: 0.2,
                    ease: "easeInOut"
                }
            }}
            transition={{ type: "spring", mass: 1, stiffness: 161 - (index), damping: 16 + (index), delay: index * 0.02 }}
            className={`relative p-4 w-full max-w-80 flex flex-row gap-4 border bg-background rounded-2xl shadow-lg pointer-events-auto font-sans ${notificationVariants[data.type].accentColor}`}
            layout
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={`${notificationVariants[data.type].bgColor} px-1 h-full max-h-3/4 absolute top-1/2 bottom-0 -left-2 -translate-y-1/2 blur-xl`}></div>

            {/* <div 
            style={{ transform: `scaleY(${remainingRef.current / data.duration})` }}
            className={`absolute h-full w-1 ${notificationVariants[data.type].bgColor} bottom-0 left-0 origin-bottom rounded`}></div> */}

            <div className="my-auto">
                {notificationVariants[data.type].icon &&
                    React.createElement(notificationVariants[data.type].icon!, { className: `w-6 h-6 ${notificationVariants[data.type].textColor}` })
                }
            </div>

            <p className={`text-sm text-white ml-auto my-auto`}>{data.message}</p>
            <motion.button 
            animate={hovering ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            onClick={forceClose} className="absolute top-0 right-0 m-2">
               <X className="w-4 h-4" />
            </motion.button>

        </motion.div>
    );
}
