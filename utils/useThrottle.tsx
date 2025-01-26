import { useState, useEffect, useRef } from 'react';

export function useThrottle(callback, delay) {
  const [data, setData] = useState(null);
  const timerRef = useRef(null);

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

  return (newData) => {
    setData(newData);
  };
}
