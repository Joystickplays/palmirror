"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"; // what i sthis??? gemini ure magic but like wth
import { useContext, useEffect, useRef } from "react";

function FrozenRoute({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;

  if (!frozen) {
    return <>{children}</>;
  }

  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isFirstLoad = useRef(true);

  useEffect(() => {
    isFirstLoad.current = false;
  }, []);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={
          isFirstLoad.current 
            ? false 
            : { opacity: 0, scale: pathname === "chat" ? 0 : 0.95 }
        }
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ 
            type: 'spring',
            mass: 1,
            stiffness: 160,
            damping: 22,
            restDelta: 0.0001
         }}
        className="h-full w-full font-sans origin-top"
      >
        <FrozenRoute>{children}</FrozenRoute>
      </motion.div>
    </AnimatePresence>
  );
}