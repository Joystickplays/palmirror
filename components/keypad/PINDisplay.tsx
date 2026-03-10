"use client";
import { motion, AnimatePresence } from "framer-motion";

interface PinDisplayProps {
  input: string;
  show: boolean;
  many?: number;
  correct?: boolean;
}

export default function PinDisplay({ input, show, many, correct }: PinDisplayProps) {
  return (
    <div className="flex gap-3 justify-center min-h-[31px] w-full">
      <AnimatePresence mode="popLayout">
        { many ? 
        Array.from({ length: many }).map((_, idx) => (
          <motion.div 
          animate={{
            scale: correct ?
              1.2 :
              input.split("").length > idx ? 1 : 0.8,
            backgroundColor: correct ? "#22c55e" : input.split("").length > idx ? "#fff" : "transparent",
            borderColor: correct ? "#22c55e" : input.split("").length > idx ? "#fff" : "#fff"
          }}
          transition={{
            type: 'spring', mass: 1, stiffness: 160, damping: 12, delay: correct ? idx * 0.05 : 0

          }}
          className={`rounded-full w-3 h-3 border border-white transition-colors`}>

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
