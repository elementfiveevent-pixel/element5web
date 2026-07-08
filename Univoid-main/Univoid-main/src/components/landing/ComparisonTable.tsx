import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "Organised study materials", uni: true, others: false },
  { feature: "Personalised to your branch", uni: true, others: false },
  { feature: "Verified college events", uni: true, others: false },
  { feature: "Book buy & sell marketplace", uni: true, others: false },
  { feature: "Find project teammates", uni: true, others: false },
  { feature: "Built for mobile first", uni: true, others: "partial" as const },
  { feature: "No spam, no random forwards", uni: true, others: false },
  { feature: "Free forever", uni: true, others: "partial" as const },
];

const Cell = ({ value }: { value: boolean | "partial" }) => {
  if (value === true)
    return (
      <span className="inline-flex w-8 h-8 rounded-lg bg-primary border-2 border-sketch-border items-center justify-center">
        <Check className="w-4 h-4" strokeWidth={3} />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex w-8 h-8 rounded-lg bg-muted border-2 border-sketch-border items-center justify-center text-xs font-bold">
        —
      </span>
    );
  return (
    <span className="inline-flex w-8 h-8 rounded-lg bg-destructive/15 border-2 border-destructive/40 items-center justify-center">
      <X className="w-4 h-4 text-destructive" strokeWidth={3} />
    </span>
  );
};

export const ComparisonTable = () => {
  return (
    <section className="py-16 md:py-28 px-4 bg-card border-y-2 border-sketch-border">
      <div className="container-wide">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-secondary border-2 border-sketch-border shadow-sketch-sm mb-5"
          >
            Why UniVoid
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-extrabold text-3xl md:text-5xl text-foreground leading-tight"
          >
            One app instead of fifteen.
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto rounded-3xl bg-background border-2 border-sketch-border shadow-sketch-lg overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-[1fr_90px_120px] md:grid-cols-[1fr_140px_180px] items-center px-4 md:px-8 py-4 md:py-5 bg-secondary border-b-2 border-sketch-border">
            <div className="font-display font-bold text-sm md:text-base">Feature</div>
            <div className="text-center">
              <div className="inline-block px-2 md:px-3 py-1 rounded-md bg-primary border-2 border-sketch-border font-display font-extrabold text-xs md:text-sm">
                UniVoid
              </div>
            </div>
            <div className="text-center font-display font-bold text-xs md:text-sm text-muted-foreground">
              WhatsApp / Drive / etc.
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1fr_90px_120px] md:grid-cols-[1fr_140px_180px] items-center px-4 md:px-8 py-3.5 md:py-4 ${
                i !== rows.length - 1 ? "border-b-2 border-sketch-border/40" : ""
              }`}
            >
              <div className="font-medium text-sm md:text-base text-foreground pr-2">
                {row.feature}
              </div>
              <div className="flex justify-center">
                <Cell value={row.uni} />
              </div>
              <div className="flex justify-center">
                <Cell value={row.others} />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonTable;
