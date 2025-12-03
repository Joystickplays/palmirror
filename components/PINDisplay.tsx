"use client";
import { motion, AnimatePresence } from "framer-motion";

interface PinDisplayProps {
  input: string;
  show: boolean;
  many?: number;
}

export default function PinDisplay({ input, show, many }: PinDisplayProps) {
  return (
    <div className="flex gap-3 justify-center min-h-[31px] w-full">
      <AnimatePresence mode="popLayout">
        { many ? 
        Array.from({ length: many }).map((_, idx) => (
          <motion.div 
          animate={{
            scale: input.split("").length > idx ? 1.2 : 0.8
          }}
          transition={{
            type: 'spring', mass: 1, stiffness: 160, damping: 12
          }}
          className={`rounded-full w-3 h-3 ${input.split("").length > idx ? "bg-white" : ""} border border-white transition-colors`}>

          </motion.div>
          // <p className="text-2xl">
          //   {input.split("").length > idx ? "•" : "◦"}
          // </p>
        ))
        : 
        input.split("").map((digit, index) => (
          <motion.p
            key={index}
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-2xl font-medium text-center"
          >
            {show ? digit : "•"}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}
