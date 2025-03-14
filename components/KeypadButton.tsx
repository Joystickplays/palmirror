import { motion } from "framer-motion";
import React, { useState } from "react";

interface KeypadButtonProps {
  btn: string;
  delay: number;
  onKeyPress: (key: string) => void;
}

const KeypadButton: React.FC<KeypadButtonProps> = ({ btn, delay, onKeyPress }) => {
  const [initialAnimationComplete, setInitialAnimationComplete] = useState(false);

  const vib = (duration: number) => {
    if ("vibrate" in navigator) navigator.vibrate(duration);
  };

  return (
    <motion.button
      onClick={() => {vib(1); onKeyPress(btn)}}
      variants={{
        hidden: { scale: 0.7, opacity: 0 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            delay: initialAnimationComplete ? 0 : delay,
            type: "spring",
            stiffness: 180,
            damping: 30,
          },
        },
        tap: {
          scale: 1.1,
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          transition: { delay: 0 },
        },
      }}
      initial="hidden"
      animate="visible"
      whileTap="tap"
      onAnimationComplete={() => setInitialAnimationComplete(true)}
      className={`w-16 h-16 flex items-center justify-center text-2xl font-medium 
        bg-white/10 rounded-full
        ${btn === "0" ? "col-span-2 justify-self-end" : ""}
        ${btn === "⌫" ? "justify-self-end" : ""}`}
    >
      {btn}
    </motion.button>
  );
};

export default KeypadButton;
