import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import SEOHead from "@/components/common/SEOHead";

import HeroBrutalist from "@/components/landing/HeroBrutalist";

// Below-fold: lazy-loaded for fast LCP on mobile
const Footer = lazy(() => import("@/components/layout/Footer"));
const BottomNav = lazy(() => import("@/components/layout/BottomNav").then(m => ({ default: m.BottomNav })));
const AuthModal = lazy(() => import("@/components/auth/AuthModal"));
const FeatureRow = lazy(() => import("@/components/landing/FeatureRow"));
const ProblemCollage = lazy(() => import("@/components/landing/ProblemCollage"));
const SolutionSection = lazy(() => import("@/components/landing/SolutionSection"));
const HowItWorksBrutalist = lazy(() => import("@/components/landing/HowItWorksBrutalist"));
const ComparisonTable = lazy(() => import("@/components/landing/ComparisonTable"));
const AnimatedStats = lazy(() => import("@/components/landing/AnimatedStats"));
const Roadmap = lazy(() => import("@/components/landing/Roadmap"));
const FinalCTABrutalist = lazy(() => import("@/components/landing/FinalCTABrutalist"));

// 3D asset paths for feature rows — referenced as strings so Vite
// only loads them when FeatureRow renders (below the fold)
const featureImages = {
  folder: () => import("@/assets/3d-folder.png").then(m => m.default),
  ticket: () => import("@/assets/3d-ticket.png").then(m => m.default),
  books: () => import("@/assets/3d-books.png").then(m => m.default),
  handshake: () => import("@/assets/3d-handshake.png").then(m => m.default),
  community: () => import("@/assets/3d-community.png").then(m => m.default),
};

const features = [
  {
    eyebrow: "Study Materials",
    title: "Notes that actually match your syllabus.",
    description:
      "Find verified PDFs, handwritten notes, and previous-year papers — filtered to your branch, semester, and college.",
    bullets: [
      "Branch-aware feed, no random spam",
      "Upload your own and help juniors",
      "One-tap preview & download",
    ],
    ctaLabel: "Browse materials",
    ctaHref: "/materials",
    imageLoader: featureImages.folder,
    imageAlt: "3D folder of study materials",
    accent: "bg-pastel-yellow",
  },
  {
    eyebrow: "Events",
    title: "Never miss a hackathon or fest again.",
    description:
      "Discover hackathons, workshops, cultural fests, and tech talks happening across Indian colleges — with one-click registration.",
    bullets: [
      "Verified college events only",
      "Buy tickets in seconds (UPI)",
      "Live notifications for events you care about",
    ],
    ctaLabel: "See events",
    ctaHref: "/events",
    imageLoader: featureImages.ticket,
    imageAlt: "3D event ticket",
    accent: "bg-pastel-blue",
  },
  {
    eyebrow: "Book Exchange",
    title: "Buy & sell textbooks with students nearby.",
    description:
      "Skip the overpriced shops. List the books you're done with, find what you need from seniors — directly, no middlemen.",
    bullets: [
      "Real photos, real prices, real students",
      "Filter by college and course",
      "Chat directly to seller",
    ],
    ctaLabel: "Explore books",
    ctaHref: "/books",
    imageLoader: featureImages.books,
    imageAlt: "3D stack of textbooks",
    accent: "bg-pastel-pink",
  },
  {
    eyebrow: "Project Partners",
    title: "Find teammates who actually ship.",
    description:
      "Post your project, pick the stack, and connect with students who want to build — for hackathons, side projects, or your final year.",
    bullets: [
      "Filter by skills and interests",
      "Send invites, manage your team",
      "Showcase what you've built",
    ],
    ctaLabel: "Find a partner",
    ctaHref: "/projects",
    imageLoader: featureImages.handshake,
    imageAlt: "3D puzzle pieces connecting",
    accent: "bg-pastel-green",
  },
  {
    eyebrow: "Community",
    title: "Your campus, online.",
    description:
      "Discover what students at your college and beyond are building, sharing, and attending — and grow your own network.",
    bullets: [
      "Verified college identity",
      "Real opportunities, real people",
      "No bots, no spam, no doom-scroll",
    ],
    ctaLabel: "Join the community",
    ctaHref: "/colleges",
    imageLoader: featureImages.community,
    imageAlt: "3D group of student avatars",
    accent: "bg-pastel-purple",
  },
];

const faqs = [
  { q: "Is UniVoid free?", a: "Yes. UniVoid is completely free for students — sign in with Google and start exploring." },
  { q: "Which colleges are supported?", a: "Every Indian college. Pick yours during onboarding and we'll personalise your feed instantly." },
  { q: "Can I upload my own study material?", a: "Absolutely. Upload notes to help juniors, earn recognition, and climb the leaderboard." },
  { q: "How does Book Exchange work?", a: "List a book in 30 seconds with photos. Buyers near your college contact you directly — UniVoid takes zero commission." },
  { q: "Are events on UniVoid verified?", a: "Yes. Every event listing is reviewed before going live, so you never end up at a fake hackathon." },
  { q: "How do I find project teammates?", a: "Post your idea with the stack and skills you need. Students who match can apply, and you choose who joins." },
  { q: "Will I get spammed with notifications?", a: "No. You control everything — only events, materials, and projects you've opted into will ping you." },
  { q: "Is my data safe?", a: "Yes. We use Google sign-in, strict access controls, and never sell student data. Read our Privacy Policy for the full picture." },
];

/** Wrapper that dynamically loads the 3D image before rendering FeatureRow */
const LazyFeatureRow = ({
  imageLoader,
  ...rest
}: Omit<typeof features[0], 'imageLoader'> & {
  imageLoader: () => Promise<string>;
  index: number;
  reverse: boolean;
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    imageLoader().then(setImageSrc);
  }, [imageLoader]);

  if (!imageSrc) return <div className="h-[280px] md:h-[400px]" />;

  return (
    <Suspense fallback={<div className="h-[280px] md:h-[400px]" />}>
      <FeatureRow {...rest} image={imageSrc} />
    </Suspense>
  );
};

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { getRedirectPath } = useRoleRedirect();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(getRedirectPath(), { replace: true });
    }
  }, [user, isLoading, navigate, getRedirectPath]);

  if (!isLoading && user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24 md:pb-0 paper-texture relative overflow-x-hidden">
      <SEOHead
        title="UniVoid — The Operating System for College Life"
        description="Notes, events, books, projects, and your campus community — one app, zero chaos. Personalised for Indian college students."
        url="/"
        keywords={[
          "student platform",
          "study materials",
          "college events",
          "hackathons",
          "book exchange",
          "project partner",
          "UniVoid",
          "Indian college students",
        ]}
        structuredData={{
          "@type": "WebSite",
          "name": "UniVoid",
          "url": "https://univoid.tech",
          "description": "The operating system for college life — study materials, events, books, projects, community.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://univoid.tech/materials?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <Header onAuthClick={() => setAuthOpen(true)} />

      <main className="flex-1">
        <HeroBrutalist onAuthClick={() => setAuthOpen(true)} />

        {/* Suspense boundary 1: Problem + Solution (immediately after hero) */}
        <Suspense fallback={<div className="h-32" />}>
          <ProblemCollage />
          <SolutionSection />
        </Suspense>

        {/* Suspense boundary 2: Features + HowItWorks + Comparison (mid-page) */}
        <Suspense fallback={<div className="h-32" />}>
          {/* Features — zigzag */}
          <section className="py-16 md:py-28 px-4">
            <div className="container-wide">
              <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
                <span className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-secondary border-2 border-sketch-border shadow-sketch-sm mb-5">
                  Everything you need
                </span>
                <h2 className="font-display font-extrabold text-3xl md:text-5xl text-foreground leading-tight">
                  Five tools. One login. Zero chaos.
                </h2>
              </div>
              <div className="space-y-20 md:space-y-32 max-w-6xl mx-auto">
                {features.map((f, i) => (
                  <LazyFeatureRow
                    key={f.eyebrow}
                    index={i}
                    reverse={i % 2 === 1}
                    imageLoader={f.imageLoader}
                    eyebrow={f.eyebrow}
                    title={f.title}
                    description={f.description}
                    bullets={f.bullets}
                    ctaLabel={f.ctaLabel}
                    ctaHref={f.ctaHref}
                    imageAlt={f.imageAlt}
                    accent={f.accent}
                  />
                ))}
              </div>
            </div>
          </section>

          <HowItWorksBrutalist />
          <ComparisonTable />
        </Suspense>

        {/* Suspense boundary 3: Stats + Roadmap + FAQ + CTA (bottom of page) */}
        <Suspense fallback={<div className="h-32" />}>
          <AnimatedStats />
          <Roadmap />

          {/* FAQ */}
          <section className="py-16 md:py-28 px-4">
            <div className="container-wide">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10 md:mb-14">
                  <span className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-secondary border-2 border-sketch-border shadow-sketch-sm mb-5">
                    FAQ
                  </span>
                  <h2 className="font-display font-extrabold text-3xl md:text-5xl text-foreground leading-tight">
                    Everything you wanted to ask.
                  </h2>
                </div>
                <div className="space-y-3">
                  {faqs.map((f, i) => {
                    const open = openFaq === i;
                    return (
                      <button
                        key={f.q}
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="w-full text-left p-5 md:p-6 rounded-2xl bg-card border-2 border-sketch-border shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sketch-lg transition-all"
                        aria-expanded={open}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-display font-bold text-base md:text-lg text-foreground">
                            {f.q}
                          </h3>
                          <span
                            className={`flex-shrink-0 w-9 h-9 rounded-lg bg-secondary border-2 border-sketch-border flex items-center justify-center font-extrabold text-xl leading-none transition-transform ${
                              open ? "rotate-45" : ""
                            }`}
                          >
                            +
                          </span>
                        </div>
                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                            open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                              {f.a}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <FinalCTABrutalist onAuthClick={() => setAuthOpen(true)} />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
        <BottomNav />
      </Suspense>
      {authOpen && (
        <Suspense fallback={null}>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
