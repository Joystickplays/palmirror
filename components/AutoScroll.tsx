import { useEffect, useRef } from "react";

interface AutoScrollContainerProps {
  children: React.ReactNode;
  speed?: number;
  pauseDuration?: number;
}

const AutoScrollContainer: React.FC<AutoScrollContainerProps> = ({
  children,
  speed = 1,
  pauseDuration = 2000,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollSpeedRef = useRef(speed);

  useEffect(() => {
    autoScrollSpeedRef.current = speed;
  }, [speed]);

  const startAutoScroll = () => {
    if (intervalIdRef.current) return;
    intervalIdRef.current = setInterval(() => {
      if (!containerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      let newScrollLeft = scrollLeft + autoScrollSpeedRef.current;

      if (newScrollLeft >= scrollWidth - clientWidth) {
        autoScrollSpeedRef.current = -Math.abs(autoScrollSpeedRef.current);
        newScrollLeft = scrollWidth - clientWidth;
      } else if (newScrollLeft <= 0) {
        autoScrollSpeedRef.current = Math.abs(autoScrollSpeedRef.current);
        newScrollLeft = 0;
      }
      containerRef.current.scrollLeft = newScrollLeft;
    }, 50);
  };

  const stopAutoScroll = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  const handleUserInteraction = () => {
    stopAutoScroll();
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(startAutoScroll, pauseDuration);
  };

  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onWheel={handleUserInteraction}
      onMouseDown={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      className="overflow-x-auto whitespace-nowrap"
    >
      <div className="">{children}</div>
    </div>
  );
};

export default AutoScrollContainer;
