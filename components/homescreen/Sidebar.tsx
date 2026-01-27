"use client";

import { useSidebarStore } from "@/context/zustandStore/Sidebar";
import { motion } from "framer-motion";
import { ChevronsLeft, Compass, Menu, MessageCircle, Plus, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarButton from "./SidebarButton";

export default function Sidebar() {
    const { isOpen, setOpen } = useSidebarStore();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState(pathname);

    useEffect(() => {
        setActiveTab(pathname);
    }, [pathname]);


    return (
        <>
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: isOpen ? 0 : '-100%' }}
                transition={{ type: "spring", stiffness: 160, damping: 20 }}
                className="flex flex-col items-center gap-2 fixed top-0 left-0 h-full bg-white/2 border border-white/5 text-white z-50 p-6 backdrop-blur-xl backdrop-brightness-50 backdrop-saturate-200"
            >

                <button onClick={() => setOpen(!isOpen)} className="absolute top-4 right-0 translate-x-[140%] p-2 rounded-md hover:bg-white/5 opacity-20 hover:opacity-90 transition-all">
                    {isOpen ? <ChevronsLeft size={32} /> : <Menu size={32} />}
                </button>

                <div 
                onMouseEnter={() => setOpen(true)}
                className="absolute top-0 right-0 translate-x-full h-full w-4"></div>

                <img src="./palmirror.png" width={64} alt="logo" />
                <div className="w-full h-0.5 bg-white/5 mb-6"></div>

                <motion.button className="rounded-full bg-white/5 border border-white/5 p-3">
                    <Plus size={32} />
                </motion.button>

                <div className="flex flex-col gap-2 h-full justify-center">
                    <SidebarButton 
                        path="/discover" 
                        icon={<Compass />} 
                        onClick={() => setActiveTab("/discover")} 
                        isActive={activeTab === "/discover"} 
                    />
                    <SidebarButton 
                        path="/" 
                        icon={<MessageCircle />} 
                        onClick={() => setActiveTab("/")} 
                        isActive={activeTab === "/"} 
                    />
                    <SidebarButton 
                        path="/settings" 
                        icon={<Settings />} 
                        onClick={() => setActiveTab("/settings")} 
                        isActive={activeTab === "/settings"} 
                    />
                </div>
            </motion.div>
        </>
    );
}