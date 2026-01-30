import React, { useEffect, useRef } from 'react';

interface HorizontalScrollProps {
    children: React.ReactNode;
    className?: string;
    speed?: number;
    friction?: number;
}

export const HorizontalScroll = ({
    children,
    className = "",
    speed = 2,
    friction = 0.2
}: HorizontalScrollProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const targetScroll = useRef<number>(0);
    const currentScroll = useRef<number>(0);
    const frameId = useRef<number | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        targetScroll.current = el.scrollLeft;
        currentScroll.current = el.scrollLeft;

        const animate = () => {
            const diff = targetScroll.current - currentScroll.current;
            if (Math.abs(diff) > 0.5) {
                currentScroll.current += diff * friction;
                el.scrollLeft = currentScroll.current;
                frameId.current = requestAnimationFrame(animate);
            } else {
                frameId.current = null;
            }
        };

        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

            e.preventDefault();
            const maxScroll = el.scrollWidth - el.clientWidth;
            targetScroll.current = Math.max(0, Math.min(targetScroll.current + e.deltaY * speed, maxScroll));

            if (frameId.current === null) {
                frameId.current = requestAnimationFrame(animate);
            }
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', onWheel);
            if (frameId.current !== null) cancelAnimationFrame(frameId.current);
        };
    }, [speed, friction]);

    return (
        <div
            ref={containerRef}
            className={`overflow-x-scroll overflow-y-hidden no-scrollbar ${className}`}
        >
            {children}
        </div>
    );
};