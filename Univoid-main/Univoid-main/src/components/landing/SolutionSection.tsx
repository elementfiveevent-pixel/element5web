import { motion } from "framer-motion";
import { Floating3D } from "./Floating3D";
import { BookOpen, Calendar, Users, Repeat } from "lucide-react";
import laptop from "@/assets/3d-laptop.png";

const pillars = [
  { icon: BookOpen, title: "Learn", text: "Study materials & notes" },
  { icon: Calendar, title: "Show up", text: "Events & hackathons" },
  { icon: Users, title: "Build", text: "Find project partners" },
  { icon: Repeat, title: "Exchange", text: "Buy & sell textbooks" },
];

export const SolutionSection = () => {
  return (
    <section className="py-16 md:py-28 px-4 bg-card border-y-2 border-sketch-border relative overflow-hidden">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: 3D laptop */}
          <div className="relative order-2 lg:order-1 h-[320px] md:h-[440px] flex items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-8 rounded-3xl bg-primary border-2 border-sketch-border shadow-sketch-lg rotate-3"
            />
            <Floating3D
              src={laptop}
              alt="UniVoid dashboard on a laptop"
              amplitude={10}
              duration={5}
              baseRotate={-3}
              className="relative w-[85%] max-w-[480px] z-10"
            />
          </div>

          {/* Right: copy + pillars */}
          <div className="order-1 lg:order-2">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-primary text-primary-foreground border-2 border-sketch-border shadow-sketch-sm mb-5"
            >
              The solution
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-extrabold text-3xl md:text-5xl text-foreground mb-5 leading-tight"
            >
              One login. Every resource. Every opportunity.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-muted-foreground mb-8"
            >
              UniVoid is the single home for the four things every Indian college
              student actually needs — designed for your phone, your branch, your
              campus.
            </motion.p>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {pillars.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                  className="p-4 md:p-5 rounded-2xl bg-background border-2 border-sketch-border shadow-sketch-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sketch transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary border-2 border-sketch-border flex items-center justify-center mb-3">
                    <p.icon className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-display font-bold text-foreground text-base md:text-lg leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    {p.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
