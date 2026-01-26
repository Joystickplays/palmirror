"use client";

import { useSidebarStore } from "@/context/zustandStore/Sidebar";
import { motion } from "framer-motion";
import { Compass, MessageCircle, Plus, Settings } from "lucide-react";


export default function Sidebar() {
    const { isOpen, setOpen } = useSidebarStore();

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
            <button className="bg-white/5 p-4 rounded-2xl">
                <Compass />
            </button>
            <button className="bg-white/5 p-4 rounded-2xl">
                <MessageCircle />
            </button>
            <button className="bg-white/5 p-4 rounded-2xl">
                <Settings />
            </button>
        </div>


    </motion.div>  
    </>) 
}