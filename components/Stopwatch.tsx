import React, { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";

import { motion, AnimatePresence } from "framer-motion";

type StopwatchProps = {
  startDate: Date;
};

const Stopwatch: React.FC<StopwatchProps> = ({ startDate }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let frameId: number

    const update = () => {
      setSeconds((Date.now() - startDate.getTime()) / 1000);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frameId);
  }, [startDate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.5, scale: 1 }}
      transition={{
        type: "spring",
        mass: 1,
        stiffness: 100,
        damping: 30,
        delay: 3,
      }}
      style={{
        fontSize: "0.7rem",
        fontVariantNumeric: "tabular-nums",
      }}
      className="font-mono opacity-50"
    >
      <NumberFlow
        value={seconds}
        format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
      />
    </motion.div>
  );
};

export default Stopwatch;
