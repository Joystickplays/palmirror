"use client";
import { motion, AnimatePresence } from "framer-motion";

interface PinDisplayProps {
  input: string;
  show: boolean;
}

export default function PinDisplay({ input, show }: PinDisplayProps) {
  return (
    <div className="flex gap-2 justify-center min-h-[31px] w-full">
      <AnimatePresence mode="popLayout">
        {input.split("").map((digit, index) => (
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
