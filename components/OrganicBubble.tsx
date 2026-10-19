import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  motionValue,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  type Transition,
} from "framer-motion";

interface OrganicBubbleProps {
  image?: string | null;
  /** false: once ready, flatten into a plain rectangle (no radii, edge colour or halo) */
  keepBubble?: boolean;
}

// clawd
const GENERATING = { center: 48, amp: 9, rotate: 4, pulse: 0.02, interval: 1.1, stiffness: 10, damping: 5.5 };
const READY = { center: 12.5, amp: 7.5, rotate: 0.5, pulse: 0.004, interval: 2.4, stiffness: 6, damping: 4.2 };

// faster spring used only when switching between states
const SWITCH: Transition = { type: "spring", stiffness: 70, damping: 15 };

const rand = (centre: number, amp: number) => centre + (Math.random() * 2 - 1) * amp;

const radiiString = (v: number[]) =>
  `${v[0]}% ${v[1]}% ${v[2]}% ${v[3]}% / ${v[4]}% ${v[5]}% ${v[6]}% ${v[7]}%`;

export default function OrganicBubble({ image, keepBubble = true }: OrganicBubbleProps) {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [loaded, setLoaded] = useState<{ src: string; w: number; h: number } | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the bubble only becomes "ready" once the image has loaded and its size is known
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => setLoaded({ src: image, w: img.naturalWidth, h: img.naturalHeight });
    img.src = image;
    return () => {
      img.onload = null;
    };
  }, [image]);

  const size = loaded && loaded.src === image ? loaded : null;
  const ready = Boolean(size);
  const flat = ready && !keepBubble;

  // final size = the image's natural size, shrunk only if it wouldn't fit the container
  const idle = Math.min(300, Math.min(stage.w, stage.h) * 0.7 || 300);
  const fit = size && stage.w && stage.h ? Math.min(1, stage.w / size.w, stage.h / size.h) : 1;
  const width = size ? size.w * fit : idle;
  const height = size ? size.h * fit : idle;

  const [radii] = useState(() =>
    Array.from({ length: 8 }, () => motionValue(ready ? READY.center : GENERATING.center)),
  );
  const [rotate] = useState(() => motionValue(0));
  const [pulse] = useState(() => motionValue(1));
  const radius = useMotionValue(radiiString(radii.map((m) => m.get())));
  const mounted = useRef(false);

  useAnimationFrame(() => {
    radius.set(radiiString(radii.map((m) => Math.max(0, +m.get().toFixed(2)))));
  });

  useEffect(() => {
    const feel = ready ? READY : GENERATING;
    const idleSpring: Transition = { type: "spring", stiffness: feel.stiffness, damping: feel.damping };
    const switching = mounted.current;
    mounted.current = true;

    // flattening uses one shared tween (not springs) so every corner, the tilt and
    // the pulse reach their end together, whatever velocity they had
    if (flat) {
      const flatten: Transition = { duration: 0.8, ease: "easeInOut" };
      radii.forEach((m) => animate(m, 0, flatten));
      animate(rotate, 0, flatten);
      animate(pulse, 1, flatten);
      return;
    }

    if (reduce) {
      radii.forEach((m) => animate(m, feel.center, SWITCH));
      animate(rotate, 0, SWITCH);
      animate(pulse, 1, SWITCH);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;
    const idleWait = () => feel.interval * (0.75 + Math.random() * 0.5) * 1000;

    // every value gets a new target at the same moment so the shape moves as one
    const retarget = (spring: Transition, wait: number) => {
      radii.forEach((m) => animate(m, rand(feel.center, feel.amp), spring));
      animate(rotate, rand(0, feel.rotate), spring);
      animate(pulse, rand(1, feel.pulse), spring);
      timer = setTimeout(() => alive && retarget(idleSpring, idleWait()), wait);
    };

    if (switching) retarget(SWITCH, 800);
    else retarget(idleSpring, idleWait());

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ready, flat, reduce, radii, rotate, pulse]);

  const sizeSpring: Transition = ready
    ? { type: "spring", stiffness: 120, damping: 12, mass: 0.9 }
    : { type: "spring", stiffness: 90, damping: 16 };

  return (
    <div className="grid size-full place-items-center" ref={stageRef}>
      <motion.div
        className="group relative"
        data-edge={flat ? "off" : ready ? "dim" : "full"}
        initial={{ width: idle, height: idle, scale: 0.5, opacity: 0, filter: "blur(18px)" }}
        animate={{ width, height, scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{
          width: sizeSpring,
          height: sizeSpring,
          scale: { type: "spring", stiffness: 120, damping: 14 },
          opacity: { duration: 0.4 },
          filter: { duration: 0.6 },
        }}
      >
        <motion.div
          className="absolute inset-0 bubble-spin will-change-[transform,border-radius]"
          style={{ borderRadius: radius, rotate, scale: pulse }}
        >
          <div className="bubble-halo-glow pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-[800ms] group-data-[edge=dim]:opacity-55 group-data-[edge=off]:opacity-0" />
          <div className="absolute inset-0 isolate overflow-hidden rounded-[inherit]">
            <AnimatePresence>
              {size && (
                <motion.img
                  className="absolute inset-0 size-full object-cover select-none"
                  key={size.src}
                  src={size.src}
                  alt=""
                  draggable={false}
                  initial={{ opacity: 0, scale: 1.2, filter: "blur(16px) brightness(2)" }}
                  animate={{ opacity: 1, scale: flat ? 1 : 1.08, filter: "blur(0px) brightness(1)" }}
                  exit={{ opacity: 0, scale: 1.2, filter: "blur(14px)" }}
                  transition={{ duration: 0.8, ease: "easeOut", filter: { duration: 1.6 } }}
                />
              )}
            </AnimatePresence>
          </div>
          <div className="bubble-rim-glow pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-[800ms] group-data-[edge=off]:opacity-0">
            <div className="pointer-events-none absolute top-[9%] left-[16%] h-[20%] w-[34%] -rotate-[28deg] bubble-drift rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.85),transparent)] blur-[6px]" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}