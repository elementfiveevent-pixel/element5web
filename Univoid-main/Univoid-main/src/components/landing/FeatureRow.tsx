import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Floating3D } from "./Floating3D";
import { cn } from "@/lib/utils";

interface FeatureRowProps {
  index: number;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  /** background accent for the 3D backdrop card */
  accent: string;
  /** reverse the zigzag */
  reverse?: boolean;
}

export const FeatureRow = ({
  index,
  eyebrow,
  title,
  description,
  bullets,
  ctaLabel,
  ctaHref,
  image,
  imageAlt,
  accent,
  reverse,
}: FeatureRowProps) => {
  return (
    <div
      className={cn(
        "grid lg:grid-cols-2 gap-10 lg:gap-16 items-center",
        reverse && "lg:[&>*:first-child]:order-2"
      )}
    >
      {/* Visual */}
      <div className="relative h-[280px] md:h-[400px] flex items-center justify-center">
        <div
          aria-hidden
          className={cn(
            "absolute inset-6 rounded-3xl border-2 border-sketch-border shadow-sketch-lg",
            accent,
            reverse ? "-rotate-2" : "rotate-2"
          )}
        />
        <Floating3D
          src={image}
          alt={imageAlt}
          amplitude={8}
          duration={5 + (index % 3) * 0.5}
          delay={index * 0.2}
          baseRotate={reverse ? 4 : -4}
          className="relative w-[70%] max-w-[360px] z-10"
        />
      </div>

      {/* Copy */}
      <div>
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-secondary border-2 border-sketch-border shadow-sketch-sm mb-4"
        >
          {String(index + 1).padStart(2, "0")} · {eyebrow}
        </motion.span>
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-extrabold text-2xl md:text-4xl text-foreground mb-4 leading-tight"
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-base md:text-lg text-muted-foreground mb-5"
        >
          {description}
        </motion.p>
        <ul className="space-y-2.5 mb-7">
          {bullets.map((b, i) => (
            <motion.li
              key={b}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
              className="flex items-start gap-3"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary border-2 border-sketch-border flex items-center justify-center mt-0.5">
                <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
              </span>
              <span className="text-sm md:text-base text-foreground font-medium">
                {b}
              </span>
            </motion.li>
          ))}
        </ul>
        <Link to={ctaHref}>
          <Button className="btn-sketch btn-sketch-secondary font-semibold h-12 px-6">
            {ctaLabel}
            <ArrowRight className="w-4 h-4 ml-2" strokeWidth={2.5} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FeatureRow;
