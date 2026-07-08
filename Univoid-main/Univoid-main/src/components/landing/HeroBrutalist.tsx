import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, FileText, Calendar } from "lucide-react";
import { Floating3D } from "./Floating3D";
import { useEffect, useState } from "react";
import { getPlatformStats } from "@/services/statsService";

import cap from "@/assets/3d-cap.png";
import books from "@/assets/3d-books.png";
import ticket from "@/assets/3d-ticket.png";

interface HeroBrutalistProps {
  onAuthClick: () => void;
}

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: "easeOut" },
  }),
};

export const HeroBrutalist = ({ onAuthClick }: HeroBrutalistProps) => {
  const reduce = useReducedMotion();
  const [stats, setStats] = useState({ totalUsers: 0, totalMaterials: 0 });

  useEffect(() => {
    getPlatformStats().then(setStats).catch(() => void 0);
  }, []);

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 px-4">
      {/* Decorative grid background — flat, no gradient */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--sketch-border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--sketch-border)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      <div className="container-wide relative">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border-2 border-sketch-border shadow-sketch-sm mb-5"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="text-xs font-bold tracking-wide uppercase">
                Built for Indian college students
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="font-display font-extrabold text-foreground leading-[1.02] tracking-tight text-4xl md:text-6xl lg:text-7xl mb-5"
            >
              The operating{" "}
              <span className="relative inline-block">
                <span className="relative z-10">system</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-4 bg-primary -z-0 -rotate-1"
                />
              </span>{" "}
              for college life.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-base md:text-xl text-muted-foreground mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Notes, events, books, projects, and your campus community —{" "}
              <span className="text-foreground font-semibold">
                one app, zero chaos.
              </span>
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8"
            >
              <Button
                size="lg"
                onClick={onAuthClick}
                className="btn-sketch btn-sketch-primary font-semibold text-base h-14 px-7 w-full sm:w-auto"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Get started — it's free
              </Button>
              <Link to="/materials" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="btn-sketch btn-sketch-secondary font-semibold text-base h-14 px-7 w-full"
                >
                  Explore the platform
                  <ArrowRight className="w-5 h-5 ml-2" strokeWidth={2.5} />
                </Button>
              </Link>
            </motion.div>

            {/* Live stat chips */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="flex flex-wrap gap-3 justify-center lg:justify-start"
            >
              {[
                {
                  icon: Users,
                  label: `${stats.totalUsers.toLocaleString("en-IN")}+ students`,
                },
                {
                  icon: FileText,
                  label: `${stats.totalMaterials.toLocaleString("en-IN")}+ materials`,
                },
                { icon: Calendar, label: "Live events daily" },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border-2 border-sketch-border shadow-sketch-sm"
                >
                  <chip.icon className="w-4 h-4" strokeWidth={2.5} />
                  <span className="text-xs md:text-sm font-bold">{chip.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: 3D collage */}
          <div className="lg:col-span-5 relative h-[340px] sm:h-[440px] lg:h-[520px]">
            {/* Backdrop card */}
            <div
              aria-hidden
              className="absolute inset-x-4 inset-y-8 rounded-3xl bg-secondary border-2 border-sketch-border shadow-sketch-lg rotate-2"
            />
            <div
              aria-hidden
              className="absolute inset-x-4 inset-y-8 rounded-3xl bg-card border-2 border-sketch-border shadow-sketch -rotate-1"
            />

            {/* Cap — hero LCP */}
            <Floating3D
              src={cap}
              alt="3D graduation cap"
              eager
              amplitude={14}
              duration={4.5}
              baseRotate={-6}
              className="absolute top-2 left-1/2 -translate-x-1/2 w-[60%] max-w-[300px] z-20"
            />

            {/* Books */}
            <Floating3D
              src={books}
              alt="3D stack of books"
              amplitude={10}
              duration={5.5}
              delay={0.4}
              baseRotate={8}
              className="absolute bottom-2 left-0 sm:-left-2 w-[42%] max-w-[200px] z-10"
            />

            {/* Ticket */}
            <Floating3D
              src={ticket}
              alt="3D event ticket"
              amplitude={12}
              duration={4.8}
              delay={0.8}
              baseRotate={-12}
              className="absolute bottom-8 right-0 sm:-right-2 w-[44%] max-w-[210px] z-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBrutalist;
