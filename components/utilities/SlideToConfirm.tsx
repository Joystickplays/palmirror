import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ChevronsRight } from "lucide-react";

import { useRef, useState, useLayoutEffect } from "react"

interface SlideToConfirmProps {
    onSlid: () => void;
}

export default function SlideToConfirm({ onSlid }: SlideToConfirmProps) {
    const dragX = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [maxDrag, setMaxDrag] = useState(0);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const resize = () => {
            const el = containerRef.current!;
            const styles = getComputedStyle(el);

            const paddingLeft = parseFloat(styles.paddingLeft);
            const paddingRight = parseFloat(styles.paddingRight);

            const innerWidth =
                el.clientWidth - paddingLeft - paddingRight;

            setMaxDrag(innerWidth - 48);
        };

        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);


    const width = useTransform(dragX, [0, maxDrag], [48, maxDrag + 48]);

    return (
        <motion.div
            ref={containerRef}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0}
            style={{ x: 0 }}
            onDrag={(_, info) => dragX.set(info.offset.x)}
            onDragEnd={() => {
                if (dragX.get() > maxDrag * 0.9) {
                    onSlid();
                }

                animate(dragX, 0, {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                });
            }}
            className="relative h-16 max-w-92 w-full rounded-full border border-white/10 p-2 overflow-hidden mx-auto"
        >
            <motion.div
                style={{ width }}
                className="h-full bg-white rounded-full flex items-center justify-end text-black px-3"
            >
                <ChevronsRight />
            </motion.div>

            <p className="absolute inset-0 flex items-center justify-center tracking-wide font-semibold opacity-50 pointer-events-none">
                Slide to confirm
            </p>
        </motion.div>
    );
}
