import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Floating3D } from "./Floating3D";
import trophy from "@/assets/3d-trophy.png";

interface Props {
  onAuthClick: () => void;
}

export const FinalCTABrutalist = ({ onAuthClick }: Props) => {
  return (
    <section className="py-16 md:py-28 px-4">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-5xl mx-auto rounded-3xl bg-primary border-2 border-sketch-border shadow-sketch-lg overflow-hidden p-8 md:p-16"
        >
          {/* Decorative dot grid — flat, not gradient */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(hsl(var(--sketch-border)) 1.5px, transparent 1.5px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="font-display font-extrabold text-3xl md:text-5xl lg:text-6xl text-primary-foreground leading-[1.05] mb-5">
                Stop scrolling Telegram.
                <br />
                Start building your college life.
              </h2>
              <p className="text-base md:text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0 font-medium">
                Join thousands of students who replaced 14 group chats with one app.
                Free, forever — sign in with Google in 10 seconds.
              </p>
              <Button
                size="lg"
                onClick={onAuthClick}
                className="btn-sketch bg-card text-foreground border-2 border-sketch-border hover:bg-card font-semibold text-base md:text-lg h-14 md:h-16 px-8 md:px-10"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Get started — it's free
              </Button>
            </div>

            <div className="hidden lg:block w-[260px]">
              <Floating3D
                src={trophy}
                alt="3D trophy"
                amplitude={14}
                duration={4.5}
                baseRotate={-8}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTABrutalist;
