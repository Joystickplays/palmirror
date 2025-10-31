import React, { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

type StopwatchProps = {
  startDate: Date;
  tokenHitStamps: Array<number>; // unix timestamps
};

const Stopwatch: React.FC<StopwatchProps> = ({ startDate, tokenHitStamps }) => {
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
          className="font-mono opacity-20 cursor-pointer"
        >
          <NumberFlow
            value={seconds}
            format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          />
        </motion.div>
      </PopoverTrigger>

      <PopoverContent className="p-4 rounded-xl" side={"top"}>
        <h1 className="font-bold">Generating response</h1>

        {tokenHitStamps.length > 0 ? (
          <div className="font-mono text-sm opacity-80">
            <p>TTFT: {((tokenHitStamps[0] - startDate.getTime()) / 1000).toFixed(1)}s</p>
            {
              (() => {
                const now = Date.now();
                const windowMs = 1000;
                const tokensLastSec = tokenHitStamps.filter(ts => now - ts <= windowMs).length;
                return (
                  <p>
                    Speed now: {tokensLastSec > 0 ? (
                      <>
                        <NumberFlow
                          transformTiming={{ duration: 200, easing: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
                          value={tokensLastSec / (windowMs / 1000)}
                          format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                        />{" "}
                        tokens/s
                      </>
                    ) : "—"}
                  </p>
                );
              })()
            }
            <p>
              Tokens generated:{" "}
              <NumberFlow transformTiming={{ duration: 200, easing: 'cubic-bezier(0.19, 1, 0.22, 1)' }} value={tokenHitStamps.length} format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} />
            </p>
            {
              (() => {
                const total = tokenHitStamps.length;
                if (total < 2) return <p>Average speed: —</p>;
                const durationSec = (tokenHitStamps[total - 1] - tokenHitStamps[0]) / 1000;
                if (durationSec <= 0) return <p>Average speed: —</p>;
                const avg = total / durationSec;
                return (
                  <p>
                    Average speed:{" "}
                    <NumberFlow transformTiming={{ duration: 200, easing: 'cubic-bezier(0.19, 1, 0.22, 1)' }} value={avg} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> tokens/s
                  </p>
                );
              })()
            }
          </div>
        ) : (
          <p className="font-mono text-sm opacity-50">Awaiting connection to server</p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default Stopwatch;
