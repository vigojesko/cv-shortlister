"use client";
import {
  animate,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
export function PageMotion({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    reduce = useReducedMotion(),
    controls = useAnimationControls();
  useEffect(() => {
    if (reduce) {
      controls.set({ opacity: 1, y: 0 });
      return;
    }
    controls.set({ opacity: 0.8, y: 4 });
    controls.start({ opacity: 1, y: 0, transition: { duration: 0.18 } });
  }, [path, reduce, controls]);
  return (
    <motion.div initial={false} animate={controls}>
      {children}
    </motion.div>
  );
}
export function Count({ value }: { value: number }) {
  const [n, setN] = useState(value),
    reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      setN(value);
      return;
    }
    const a = animate(0, value, {
      duration: 0.22,
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => a.stop();
  }, [value, reduce]);
  return <span>{n}</span>;
}
