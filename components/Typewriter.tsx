import { useEffect, useRef, useState } from "react";
// just chatgpted everything and hoped for the best imsorry
interface UseTypewriterOptions {
  speed?: number;
  inBatchesOf?: number;
  punctuationDelays?: Record<string, number>;
  haptics?: boolean;
}

const vibrate = (duration: number) => {
  if ("vibrate" in navigator) navigator.vibrate(duration);
};

export function useTypewriter(
  target: string,
  {
    speed = 50,
    inBatchesOf = 1,
    punctuationDelays = { ".": 300, ",": 150, "!": 250, "?": 250 },
    haptics = true
  }: UseTypewriterOptions = {}
): string {
  const [text, setText] = useState<string>("");
  const [tick, setTick] = useState(0);
  const runs = useRef(1);
  const lockUntilRef = useRef<number>(0);
  const QUOTE_BOUNDARY_MS = 500;

  useEffect(() => {
    if (runs.current) {
      runs.current += 1;
      if (runs.current < 10) {
        setText(target);
        return;
      }
    }

    if (text === target) return;

    const now = Date.now();
    if (now < lockUntilRef.current) {
      const remaining = lockUntilRef.current - now;
      const timer = setTimeout(() => setTick((t) => t + 1), remaining);
      return () => clearTimeout(timer);
    }

    const nextIndex = text.length;
    const quoteCountBefore = target.slice(0, nextIndex).split('"').length - 1;
    const insideQuotes = quoteCountBefore % 2 === 1;

    const baseBatch = insideQuotes ? Math.max(1, Math.floor(inBatchesOf / 7)) : inBatchesOf;

    let tentativeNext = text;

    if (text.length > target.length) {
      tentativeNext = text.slice(0, Math.max(target.length, text.length - baseBatch));
    } else if (text.length < target.length) {
      tentativeNext = target.slice(0, Math.min(target.length, text.length + baseBatch));
    } else {
      let i = 0;
      while (i < text.length && text[i] === target[i]) i++;
      tentativeNext = text.slice(0, i) + target.slice(i, i + baseBatch) + text.slice(i + baseBatch);
    }

    let next = tentativeNext;

    if (tentativeNext.length > text.length) {
      const start = text.length;
      const end = tentativeNext.length;
      const addedSegment = target.slice(start, end);

      if (target[start] === "." && target[start + 1] === '"') {
        next = target.slice(0, start + 2);
      } else {
        const localQuoteIdx = addedSegment.indexOf('"');
        if (localQuoteIdx !== -1) {
          const globalQuotePos = start + localQuoteIdx;
          if (globalQuotePos > text.length) {
            next = target.slice(0, globalQuotePos);
          }
        }
      }
    }

    let start = text.length;
    let end = next.length;
    let addedSegment = target.slice(start, end);
    const hasUppercaseAnywhere = /[A-Z]/.test(addedSegment);

    if (hasUppercaseAnywhere && baseBatch > 1) {
      const singleBatch = 1;
      if (text.length > target.length) {
        tentativeNext = text.slice(0, Math.max(target.length, text.length - singleBatch));
      } else if (text.length < target.length) {
        tentativeNext = target.slice(0, Math.min(target.length, text.length + singleBatch));
      } else {
        let i = 0;
        while (i < text.length && text[i] === target[i]) i++;
        tentativeNext = text.slice(0, i) + target.slice(i, i + singleBatch) + text.slice(i + singleBatch);
      }

      next = tentativeNext;

      if (tentativeNext.length > text.length) {
        const s = text.length;
        const e = tentativeNext.length;
        const seg = target.slice(s, e);
        if (target[s] === "." && target[s + 1] === '"') {
          next = target.slice(0, s + 2);
        } else {
          const qidx = seg.indexOf('"');
          if (qidx !== -1) {
            const globalQuotePos = s + qidx;
            if (globalQuotePos > text.length) next = target.slice(0, globalQuotePos);
          }
        }
      }

      start = text.length;
      end = next.length;
      addedSegment = target.slice(start, end);
    }

    const hasUppercase = /^[A-Z]/.test(addedSegment);

    const effectiveSpeed = insideQuotes ? speed * 7 : speed;
    const effectiveBatch = hasUppercase ? 1 : insideQuotes ? Math.max(1, Math.floor(inBatchesOf / 7)) : inBatchesOf;

    const firstAddedChar = addedSegment[0];
    let punctuationDelay = 0;
    let openingQuoteBoundary = 0;
    let closingQuoteBoundary = 0;

    if (firstAddedChar) {
      if (punctuationDelays[firstAddedChar] != null) {
        punctuationDelay = punctuationDelays[firstAddedChar];
      }

      if (firstAddedChar === '"') {
        const quotePos = text.length;
        const quotesBeforeThis = target.slice(0, quotePos).split('"').length - 1;
        if (quotesBeforeThis % 2 === 0) {
          openingQuoteBoundary = QUOTE_BOUNDARY_MS;
        } else {
          closingQuoteBoundary = QUOTE_BOUNDARY_MS;
        }
      }

      if (firstAddedChar === "." && target[text.length + 1] === '"') {
        punctuationDelay = punctuationDelays["."] ?? punctuationDelay;
        closingQuoteBoundary = 0;
      }
    }

    const initialDelay = hasUppercase ? 10 : effectiveSpeed + openingQuoteBoundary;

    let resumeTimer: ReturnType<typeof setTimeout> | undefined;
    const showTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
      setText(next);
      if (haptics) vibrate(10);

      const totalAfter = (punctuationDelay || 0) + closingQuoteBoundary;
      if (totalAfter > 0) {
        lockUntilRef.current = Date.now() + totalAfter;
        resumeTimer = setTimeout(() => setTick((t) => t + 1), totalAfter);
      } else {
        setTick((t) => t + 1);
      }
    }, initialDelay);

    return () => {
      clearTimeout(showTimer);
      if (resumeTimer) clearTimeout(resumeTimer);
    };
  }, [target, text, speed, inBatchesOf, punctuationDelays, tick, haptics]);

  return text;
}
