import React, { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

type StopwatchProps = {
  startDate: Date;
};

const Stopwatch: React.FC<StopwatchProps> = ({ startDate }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let frameId: number;

    const update = () => {
      setSeconds((Date.now() - startDate.getTime()) / 1000);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frameId);
  }, [startDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
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
          className="font-mono opacity-50 cursor-pointer"
        >
          <NumberFlow
            value={seconds}
            format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          />
        </motion.div>
      </PopoverTrigger>

      <PopoverContent className="p-4 rounded-xl" side={"top"}>
        <h1 className="font-bold">Generating response</h1>

        <p className="font-mono text-sm opacity-50">Awaiting connection to server</p>
      </PopoverContent>
    </Popover>
  );
};

export default Stopwatch;
