"use client";

import { useSidebarStore } from "@/context/zustandStore/Sidebar";
import { motion } from "framer-motion";
import { Compass, MessageCircle, Plus, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarButton from "./SidebarButton";

const PathMapping = {
    "/": "Chats",
    "/discover": "Discover",
    "/settings": "Settings",
}
export default function Sidebar() {
    const { isOpen, setOpen } = useSidebarStore();

    const pathname = usePathname();
    const [currentPath, setCurrentPath] = useState<keyof typeof PathMapping>("/");


    useEffect(() => {
        if (pathname in PathMapping) {
            setCurrentPath(pathname as keyof typeof PathMapping);
        }
    }, [pathname]);

    return (<>
        <button onClick={() => setOpen(!isOpen)} className="fixed top-4 right-4 z-51">toggle sidebar</button>
        <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: isOpen ? 0 : '-100%' }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            className="flex flex-col items-center gap-2 fixed top-0 left-0 h-full bg-white/2 border border-white/5 text-white z-50 p-6 backdrop-blur-xl">

            <img src="./palmirror.png" width={64} />
            <div className="w-full h-0.5 bg-white/5 mb-6"></div>

            <motion.button className="rounded-full bg-white/5 border border-white/5 p-3">
                <Plus size={32} />
            </motion.button>

            <div className="flex flex-col gap-2 h-full justify-center">
                <SidebarButton path="/discover" icon={<Compass />} onClick={() => setCurrentPath("/discover")} isActive={currentPath === "/discover"} />
                <SidebarButton path="/" icon={<MessageCircle />} onClick={() => setCurrentPath("/")} isActive={currentPath === "/"} />
                <SidebarButton path="/settings" icon={<Settings />} onClick={() => setCurrentPath("/settings")} isActive={currentPath === "/settings"} />
            </div>


        </motion.div>
    </>)
}