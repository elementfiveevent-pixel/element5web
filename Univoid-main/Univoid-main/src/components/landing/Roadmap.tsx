import { motion } from "framer-motion";
import { Bot, Briefcase, MessageSquare, Wallet, Building2, Sparkles } from "lucide-react";

const upcoming = [
  { icon: Bot, title: "AI Study Assistant", text: "Ask any question about your notes." },
  { icon: Briefcase, title: "Internships & Placements", text: "Verified opportunities for students." },
  { icon: MessageSquare, title: "Discussion Forums", text: "Branch-specific threads & doubts." },
  { icon: Building2, title: "College Clubs Hub", text: "Discover, join, and run clubs." },
  { icon: Wallet, title: "Student Wallet", text: "Tickets, books, and more in one place." },
  { icon: Sparkles, title: "Smart Recommendations", text: "Surface what matters to you." },
];

export const Roadmap = () => {
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
            What's next
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-extrabold text-3xl md:text-5xl text-foreground leading-tight"
          >
            The roadmap, in the open.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
          {upcoming.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="relative p-5 md:p-6 rounded-2xl bg-background border-2 border-sketch-border shadow-sketch hover:-translate-x-1 hover:-translate-y-1 hover:shadow-sketch-lg transition-all"
            >
              <span className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-primary border-2 border-sketch-border">
                Soon
              </span>
              <div className="w-11 h-11 rounded-xl bg-secondary border-2 border-sketch-border flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mb-1.5 leading-tight">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
