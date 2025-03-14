import { useRef, useEffect, useCallback } from 'react';

export function useDebounce<T>(callback: (data: T) => void, delay: number) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback((newData: T) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      callback(newData);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFunction;
}
