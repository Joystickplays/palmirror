import { useEffect, useRef, useState } from "react";

interface UseTypewriterOptions {
  speed?: number;
  inBatchesOf?: number;
  punctuationDelays?: Record<string, number>;
}

export function useTypewriter(
  target: string,
  {
    speed = 50,
    inBatchesOf = 1,
    punctuationDelays = { ".": 300, ",": 150, "!": 250, "?": 250 },
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
      console.log(runs.current)
      if (runs.current < 10) {
        setText(target);
        return;
      }
    }

    if (text === target) return;

    const now = Date.now();
    if (now < lockUntilRef.current) {
      const remaining = lockUntilRef.current - now;
      const resumeTimeout = setTimeout(() => setTick((t) => t + 1), remaining);
      return () => clearTimeout(resumeTimeout);
    }

    const nextIndex = text.length;
    const quoteCountBefore = target.slice(0, nextIndex).split('"').length - 1;
    const insideQuotes = quoteCountBefore % 2 === 1;

    const effectiveSpeed = insideQuotes ? speed * 7 : speed;
    const effectiveBatch = insideQuotes ? Math.max(1, Math.floor(inBatchesOf / 7)) : inBatchesOf;

    let tentativeNext = text;

    if (text.length > target.length) {
      tentativeNext = text.slice(0, Math.max(target.length, text.length - effectiveBatch));
    } else if (text.length < target.length) {
      tentativeNext = target.slice(0, Math.min(target.length, text.length + effectiveBatch));
    } else {
      let i = 0;
      while (i < text.length && text[i] === target[i]) i++;
      tentativeNext =
        text.slice(0, i) +
        target.slice(i, i + effectiveBatch) +
        text.slice(i + effectiveBatch);
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

    let punctuationDelay = 0;
    let openingQuoteBoundary = 0;
    let closingQuoteBoundary = 0;

    if (next.length > text.length) {
      const firstAddedChar = next[text.length];

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

    const initialDelay = effectiveSpeed + openingQuoteBoundary;

    const showTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
      setText(next);
      const totalAfterDelay = (punctuationDelay || 0) + closingQuoteBoundary;
      if (totalAfterDelay > 0) {
        lockUntilRef.current = Date.now() + totalAfterDelay;
        const resumeTimer: ReturnType<typeof setTimeout> = setTimeout(
          () => setTick((t) => t + 1),
          totalAfterDelay
        );

        return () => clearTimeout(resumeTimer);
      }
    }, initialDelay);

    return () => {
      clearTimeout(showTimer);
    };

  }, [target, text, speed, inBatchesOf, punctuationDelays, tick]);

  return text;
}
