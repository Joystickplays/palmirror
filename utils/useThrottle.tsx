import { useState, useEffect, useRef } from 'react';

export function useThrottle<T>(callback: (data: T) => void, delay: number) {
  const [data, setData] = useState<T | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (data !== null) {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        callback(data);
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, callback]);

  return (newData: T) => {
    setData(newData);
  };
}
