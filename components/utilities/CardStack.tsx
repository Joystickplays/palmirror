"use client";
import { usePLMGlobalConfig } from '@/context/PLMGlobalConfig';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { MoveLeft, MoveRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';



interface CardStackProps {
    children: React.ReactNode;
    currentIndex?: number;
    className?: string;
    center?: boolean;
    tooltip?: boolean;
}


const CardStack: React.FC<CardStackProps> = ({
    children,
    currentIndex = 0,
    className,
    center = false,
    tooltip = false,
}) => {

    const PLMGC = usePLMGlobalConfig();
    const [configHighend, setConfigHighend] = useState(false);
    
    useEffect(() => {
        setConfigHighend(!!PLMGC.get("highend"))
    }, [PLMGC]);

    const [curIndexLocal, setCurIndexLocal] = useState(currentIndex);

    const [fadeToolTip, setFadeToolTip] = useState(false);

    useEffect(() => {
        setCurIndexLocal(currentIndex);
    }, [currentIndex]);

    const currentCardRef = useRef<HTMLDivElement | null>(null);
    const [cardHeight, setCardHeight] = useState<number | null>(null);

    useEffect(() => {
        if (!currentCardRef.current) return;
        const updateHeight = () => {
            setCardHeight(currentCardRef.current!.offsetHeight);
        };
        updateHeight();

        const observer = new ResizeObserver(updateHeight);
        observer.observe(currentCardRef.current);

        return () => observer.disconnect();
    }, [curIndexLocal]);


    return (
        <AnimatePresence mode="popLayout">
            <div className='relative w-full h-full'>
                <div style={{ height: cardHeight ?? 'auto' }} className={cn("relative w-full h-full overflow-hidden", className)}>
                    {React.Children.map(children, (child, index) => {

                        const currentIndex = curIndexLocal;

                        return (
                            <motion.div
                                ref={index === currentIndex ? currentCardRef : null}
                                className={`absolute top-0 ${center ? "left-1/2 transform -translate-x-1/2" : ""} ${index === currentIndex ? "cursor-grab" : ""}`}
                                key={index}
                                initial={{
                                    scale: 0.95,
                                    x: 40,
                                    rotate: 4,
                                    opacity: 0.5,
                                }}
                                animate={{
                                    scale: index === currentIndex ? 1 : 1 - Math.abs(index - currentIndex) * 0.05,
                                    x: index === currentIndex ? 0 : (index < currentIndex ? -350 : (20 * Math.sqrt(index - currentIndex))),
                                    rotate: index === currentIndex ? 0 : (index < currentIndex ? 0 : Math.sqrt(index - currentIndex) * 4),
                                    opacity: index === currentIndex ? 1 : 0.5,
                                    filter: index === currentIndex ? "none" : configHighend ? `blur(${Math.abs(index - currentIndex) * 2.5}px)` : "none",
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                }}
                                style={{
                                    zIndex: currentIndex - index,
                                }}

                                drag={index === currentIndex ? "x" : false}
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0.5}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x < -100) {
                                        setCurIndexLocal((prev) => Math.min(prev + 1, React.Children.count(children) - 1));
                                    } else if (info.offset.x > 100) {
                                        setCurIndexLocal((prev) => Math.max(prev - 1, 0));
                                    }
                                    setFadeToolTip(true);
                                }}
                                // onPointerDownCapture={e => e.stopPropagation()} 


                                transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 21 }}
                            >
                                {child}
                            </motion.div>
                        )
                    })}
                </div>
                {tooltip && (
                    <motion.div 
                    animate={{ opacity: fadeToolTip ? 0 : 1 }}
                    transition={{ duration: 1, delay: 2 }}
                    className="absolute pt-2 w-full text-center text-xs text-muted-foreground select-none">
                        <p>Drag <MoveLeft className="inline-block w-4 h-4" /> or <MoveRight className="inline-block w-4 h-4" /> to navigate</p>
                    </motion.div>
                )}
            </div>
        </AnimatePresence>
    );
};

export default CardStack;

