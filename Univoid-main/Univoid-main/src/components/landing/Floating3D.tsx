import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Floating3DProps {
  src: string;
  alt: string;
  className?: string;
  /** Float amplitude in px */
  amplitude?: number;
  /** Float duration in seconds */
  duration?: number;
  /** Delay before float starts */
  delay?: number;
  /** Enable mouse-tilt on desktop */
  tilt?: boolean;
  /** Set true ONLY for the LCP hero image */
  eager?: boolean;
  /** Rotation in degrees applied as base transform */
  baseRotate?: number;
}

export const Floating3D = ({
  src,
  alt,
  className,
  amplitude = 12,
  duration = 4,
  delay = 0,
  tilt = true,
  eager = false,
  baseRotate = 0,
}: Floating3DProps) => {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [tx, setTx] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  const handleMove = (e: React.MouseEvent) => {
    if (!tilt || reduceMotion || !isDesktop || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / rect.width;
    const ny = (e.clientY - cy) / rect.height;
    setTx({ x: nx * 14, y: -ny * 14 });
  };

  const reset = () => setTx({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={cn("relative inline-block will-change-transform", className)}
      style={{ perspective: 800 }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding={eager ? "sync" : "async"}
        width={1024}
        height={1024}
        draggable={false}
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -amplitude, 0] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration, delay, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          transform: `rotateY(${tx.x}deg) rotateX(${tx.y}deg) rotate(${baseRotate}deg)`,
          transition: "transform 0.25s ease-out",
          width: "100%",
          height: "auto",
          display: "block",
        }}
        className="select-none pointer-events-none"
      />
    </div>
  );
};
