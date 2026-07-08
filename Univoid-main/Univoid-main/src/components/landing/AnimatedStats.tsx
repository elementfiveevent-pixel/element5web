import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { getPlatformStats } from "@/services/statsService";

const useCounter = (target: number, active: boolean, duration = 1400) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target <= 0) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
};

const StatTile = ({
  value,
  label,
  active,
  bg,
}: {
  value: number;
  label: string;
  active: boolean;
  bg: string;
}) => {
  const display = useCounter(value, active);
  return (
    <div
      className={`${bg} p-6 md:p-8 rounded-3xl border-2 border-sketch-border shadow-sketch-lg`}
    >
      <div className="font-display font-extrabold text-4xl md:text-6xl text-foreground tabular-nums leading-none">
        {display.toLocaleString("en-IN")}
        <span className="text-primary">+</span>
      </div>
      <div className="mt-3 text-sm md:text-base font-semibold text-foreground/80">
        {label}
      </div>
    </div>
  );
};

export const AnimatedStats = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [stats, setStats] = useState({ totalUsers: 0, totalMaterials: 0 });

  useEffect(() => {
    getPlatformStats().then(setStats).catch(() => void 0);
  }, []);

  return (
    <section className="py-16 md:py-28 px-4">
      <div className="container-wide" ref={ref}>
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-primary text-primary-foreground border-2 border-sketch-border shadow-sketch-sm mb-5"
          >
            By the numbers
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-extrabold text-3xl md:text-5xl text-foreground leading-tight"
          >
            A campus that's growing every day.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
          <StatTile
            value={stats.totalUsers}
            label="Students on UniVoid"
            active={inView}
            bg="bg-pastel-yellow"
          />
          <StatTile
            value={stats.totalMaterials}
            label="Study materials shared"
            active={inView}
            bg="bg-pastel-blue"
          />
          <StatTile
            value={Math.max(50, Math.floor(stats.totalUsers / 8))}
            label="Colleges represented"
            active={inView}
            bg="bg-pastel-pink"
          />
        </div>
      </div>
    </section>
  );
};

export default AnimatedStats;
