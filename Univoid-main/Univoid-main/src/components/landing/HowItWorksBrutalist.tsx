import { motion } from "framer-motion";
import { LogIn, UserCheck, Compass, Rocket } from "lucide-react";

const steps = [
  { icon: LogIn, title: "Sign in with Google", text: "10 seconds. No forms. No spam." },
  { icon: UserCheck, title: "Tell us your college", text: "We tune every feed to your branch & semester." },
  { icon: Compass, title: "Explore your campus", text: "Materials, events, books, partners — all live." },
  { icon: Rocket, title: "Build your college life", text: "Save notes, join events, ship projects." },
];

export const HowItWorksBrutalist = () => {
  return (
    <section className="py-16 md:py-28 px-4">
      <div className="container-wide">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-secondary border-2 border-sketch-border shadow-sketch-sm mb-5"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-extrabold text-3xl md:text-5xl text-foreground mb-4 leading-tight"
          >
            From sign-in to building, in under a minute.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative p-6 rounded-2xl bg-card border-2 border-sketch-border shadow-sketch hover:-translate-x-1 hover:-translate-y-1 hover:shadow-sketch-lg transition-all group"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-primary border-2 border-sketch-border shadow-sketch-sm flex items-center justify-center font-display font-extrabold text-xl">
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary border-2 border-sketch-border flex items-center justify-center mb-4 mt-2 transition-transform group-hover:rotate-6">
                <s.icon className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mb-2 leading-tight">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksBrutalist;
