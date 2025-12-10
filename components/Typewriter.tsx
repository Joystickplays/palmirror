import { useEffect, useRef, useState } from "react";

interface UseTypewriterOptions {
  speed?: number;
  inBatchesOf?: number;
  punctuationDelays?: Record<string, number>;
  haptics?: boolean;
}

const vibrate = (duration: number) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(duration);
  }
};

export function useTypewriter(
  target: string,
  {
    speed = 50,
    inBatchesOf = 1,
    punctuationDelays = { ".": 500, ",": 250, "!": 400, "?": 400 },
    haptics = true,
  }: UseTypewriterOptions = {}
): string {
  const [text, setText] = useState<string>(target);
  const mountRef = useRef(0);
  const QUOTE_BOUNDARY_MS = 500;

  useEffect(() => {
    if (mountRef.current < 7) {
      mountRef.current += 1;
      setText(target);
      return;
    }

    if (text === target) return;

    let nextText = text;
    let delay = 0;
    let shouldVibrate = false;

    const isBackspacing = !target.startsWith(text) || text.length > target.length;

    if (isBackspacing) {
      delay = Math.max(10, speed / 2);
      nextText = text.slice(0, -1);
      shouldVibrate = true;
    } else {
      const lastChar = text.slice(-1);
      if (punctuationDelays[lastChar]) {
        delay += punctuationDelays[lastChar];
      }
      const quotesInCurrentText = (text.match(/"/g) || []).length;
      const currentlyInsideQuotes = quotesInCurrentText % 2 === 1;
      if (lastChar === '"') {
        if (currentlyInsideQuotes) {

          delay += QUOTE_BOUNDARY_MS;
        } else {
          if (!text.endsWith('."')) {
            delay += QUOTE_BOUNDARY_MS;
          }
        }
      }
      const nextIndex = text.length;
      const effectiveSpeed = currentlyInsideQuotes ? speed * 7 : speed;
      const effectiveBatch = currentlyInsideQuotes
        ? Math.max(1, Math.floor(inBatchesOf / 7))
        : inBatchesOf;
      delay += effectiveSpeed;
      let charsToAdd = target.slice(nextIndex, nextIndex + effectiveBatch);
      const quoteIndex = charsToAdd.indexOf('"');
      if (
        target[nextIndex] === "." &&
        target[nextIndex + 1] === '"'
      ) {
        charsToAdd = '."';
      } else if (quoteIndex !== -1) {
        if (quoteIndex === 0) charsToAdd = '"';
        else charsToAdd = charsToAdd.slice(0, quoteIndex);
      }
      nextText = text + charsToAdd;
      shouldVibrate = haptics;
    }


    const timeout = setTimeout(() => {
      setText(nextText);
      if (shouldVibrate) vibrate(10);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, target, speed, inBatchesOf, punctuationDelays, haptics]);

  return text;
}