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
  
  const QUOTE_BOUNDARY_MS = 1000;
  const CAPS_SPEED_MS = 5;

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
      delay = 1;
      nextText = text.slice(0, -1);
      shouldVibrate = true;
    } else {
      
      const currentIndex = text.length;
      const lastChar = text.slice(-1);
      

      if (punctuationDelays[lastChar]) {
        delay += punctuationDelays[lastChar];
      }

      if (lastChar === '"') {
        const quoteCount = (text.match(/"/g) || []).length;
        const isClosingQuote = quoteCount % 2 === 0;

        if (isClosingQuote) {
          if (text.endsWith('."')) {
             delay = Math.max(delay, QUOTE_BOUNDARY_MS);
          } else {
             delay += QUOTE_BOUNDARY_MS;
          }
        }
      }

      const quotesUpToNow = (target.slice(0, currentIndex).match(/"/g) || []).length;
      const insideQuotes = quotesUpToNow % 2 === 1;

      const nextChar = target[currentIndex];
      
      const isNextCaps = /[A-Z]/.test(nextChar);

      let currentSpeed = speed;
      if (isNextCaps) {
        currentSpeed = CAPS_SPEED_MS;
      } else if (insideQuotes) {
        currentSpeed = speed * 7;
      }

      delay += currentSpeed;

      if (nextChar === '"') {
         if (!insideQuotes) {
           delay += QUOTE_BOUNDARY_MS;
         }
      }

      let effectiveBatch = inBatchesOf;
      if (isNextCaps || insideQuotes || nextChar === '"') {
        effectiveBatch = 1;
      } else if (insideQuotes) {
        effectiveBatch = Math.max(1, Math.floor(inBatchesOf / 7));
      }

      let charsToAdd = target.slice(currentIndex, currentIndex + effectiveBatch);

      const batchQuoteIndex = charsToAdd.indexOf('"');
      if (batchQuoteIndex !== -1 && batchQuoteIndex > 0) {
        charsToAdd = charsToAdd.slice(0, batchQuoteIndex);
      } else if (batchQuoteIndex === 0) {
        charsToAdd = '"';
      }

      if (target[currentIndex] === '.' && target[currentIndex + 1] === '"') {
        charsToAdd = '."';
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
