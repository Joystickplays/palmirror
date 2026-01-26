"use client";

import { useSidebarStore } from "@/context/zustandStore/Sidebar";
import { motion } from "framer-motion";


export default function Sidebar() {
    const { isOpen, setOpen } = useSidebarStore();

    return (<>
    <button onClick={() => setOpen(!isOpen)} className="fixed top-4 right-4 z-51">toggle sidebar</button>
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-12 bg-white/5 border border-white/5 text-white z-50">
        


    </motion.div>  
    </>) 
}