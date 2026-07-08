import { motion } from "framer-motion";
import { MessageCircle, Send, HardDrive, Link2, X } from "lucide-react";

const scattered = [
  { icon: MessageCircle, label: "WhatsApp groups", rotate: -6, bg: "bg-pastel-green" },
  { icon: Send, label: "Telegram links", rotate: 4, bg: "bg-pastel-blue" },
  { icon: HardDrive, label: "Google Drive folders", rotate: -3, bg: "bg-pastel-yellow" },
  { icon: Link2, label: "Random websites", rotate: 7, bg: "bg-pastel-pink" },
  { icon: MessageCircle, label: "Senior's DMs", rotate: -8, bg: "bg-pastel-purple" },
  { icon: Send, label: "Shared notes", rotate: 5, bg: "bg-pastel-peach" },
];

export const ProblemCollage = () => {
  return (
    <section className="py-16 md:py-28 px-4 relative">
      <div className="container-wide">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-destructive/10 text-destructive border-2 border-destructive/30 mb-5"
          >
            The problem
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-extrabold text-3xl md:text-5xl text-foreground mb-5 leading-tight"
          >
            Your college life shouldn't live in{" "}
            <span className="relative inline-block">
              14 WhatsApp groups
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 5 Q 50 1, 100 4 T 198 3"
                  stroke="hsl(var(--destructive))"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-muted-foreground"
          >
            Notes get lost. Events get missed. Books pile up. Projects die in chats.
            Every student knows the chaos — UniVoid fixes it.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {scattered.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: item.rotate }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ rotate: 0, scale: 1.03 }}
              className={`${item.bg} relative p-5 md:p-6 rounded-2xl border-2 border-sketch-border shadow-sketch cursor-default`}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-card border-2 border-sketch-border flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-foreground text-sm md:text-base">
                  {item.label}
                </span>
              </div>
              <X
                className="absolute -top-3 -right-3 w-8 h-8 text-destructive bg-card rounded-full border-2 border-sketch-border p-1"
                strokeWidth={3}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemCollage;
