import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDeveloperLogs } from "@/store/developerLogs";
import { Code } from "lucide-react";


interface DeveloperBarProps {
}
const DeveloperBar: React.FC<DeveloperBarProps> = ({ }) => {
    const logs = useDeveloperLogs((state) => state.logs);
    return (
        <>
            <div
                className="flex gap-2 -mb-2 overflow-y-hidden items-center px-1">
                {logs.slice(-1).map((log, index) => (
                    <>
                        <Code className={`opacity-50 ${log.level === 'error' ? 'text-red-400'
                                        : log.level === 'warn' ? 'text-yellow-400'
                                            : 'text-green-400'}`} />

                        <AnimatePresence mode="popLayout">
                            <motion.p
                                key={log.message}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{
                                    type: 'spring',
                                    mass: 1,
                                    stiffness: 160,
                                    damping: 22,
                                }}
                                className={`${log.level === 'error' ? 'text-red-400'
                                        : log.level === 'warn' ? 'text-yellow-400'
                                            : 'text-green-400'
                                    } text-xs truncate opacity-80`}
                            >
                                {log.message}
                            </motion.p>
                        </AnimatePresence>

                        <p className={`ml-auto font-mono text-xs text-muted-foreground ${log.level === 'error' ? 'text-red-400'
                                        : log.level === 'warn' ? 'text-yellow-400'
                                            : 'text-green-400'}`}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                        </p>
                    </>
                ))}
            </div>
        </>
    )
}

export default DeveloperBar;