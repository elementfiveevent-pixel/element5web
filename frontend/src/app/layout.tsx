import type { Metadata } from "next";
import { Syne, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import CustomCursor from "@/components/ui/CustomCursor";
import SmoothScroll from "@/components/ui/SmoothScroll";
import Header from "@/components/ui/Header";
import Link from "next/link";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ELEMENT 5 | Future Creator Ecosystem",
  description: "Gujarat's premier youth-first creative community platform. Discover artists, register for events, and experience StageVerse open mics.",
  keywords: ["Element 5", "StageVerse", "Open Mic", "Gujarat", "Creators", "Ahmedabad", "Poetry", "Rap", "Music Festival"],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} h-full antialiased lenis-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#121212] text-[#FAF8F5] relative selection:bg-[#FFDE4D] selection:text-[#121212]">
        {/* Paper Grain Overlay */}
        <div className="bg-grain" />

        <ToastProvider>
        <AppProvider>
          <AuthProvider>
            <SmoothScroll>
              {/* Custom Cursor Overlay */}
              <CustomCursor />

              <Header />

              {/* Main Application Content */}
              <main className="flex-grow z-10">{children}</main>

              {/* Footer */}
              <footer className="w-full border-t-3 border-[#121212] bg-[#0F0E0E] px-4 sm:px-6 py-12 sm:py-16 relative overflow-hidden">
                {/* Decorative design assets */}
                <div className="absolute right-[-5%] bottom-[-5%] text-[10vw] font-display font-black text-white/[0.02] tracking-tighter uppercase select-none pointer-events-none">
                  CULTURE
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 relative z-10">
                  <div className="sm:col-span-2 space-y-5">
                    <h3 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tighter">
                      ELEMENT 5
                    </h3>
                    <p className="font-space text-sm text-[#FAF8F5]/70 max-w-sm">
                      गुजरात का पहला क्रिएटिव मूवमेंट। We build stages for poetry, stand-up comedy, beatboxing, rap, and experimental musicians. Every creator deserves one opportunity.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="brutal-tape text-xs select-none">
                        #StageVerse
                      </span>
                      <span className="brutal-tape-red text-xs select-none">
                        #GujaratCreators
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display text-base sm:text-lg font-bold text-yellow-festival uppercase tracking-wider">
                      Ecosystem
                    </h4>
                    <ul className="space-y-2 text-sm font-bold text-[#FAF8F5]/80">
                      <li>
                        <Link href="/#stageverse" className="hover:text-red-stage transition-colors">
                          StageVerse Open Mic
                        </Link>
                      </li>
                      <li>
                        <Link href="/artists" className="hover:text-yellow-festival transition-colors">
                          Creator Directory
                        </Link>
                      </li>
                      <li>
                        <Link href="/network" className="hover:text-orange-burnt transition-colors">
                          Collaborator Search
                        </Link>
                      </li>
                      <li>
                        <Link href="/events" className="hover:text-yellow-festival transition-colors">
                          All Events
                        </Link>
                      </li>
                      <li>
                        <Link href="/register/organizer" className="hover:text-red-stage transition-colors">
                          Register as Organizer
                        </Link>
                      </li>
                      <li>
                        <Link href="/security" className="hover:text-orange-burnt transition-colors">
                          Security
                        </Link>
                      </li>
                      <li>
                        <Link href="/contact" className="hover:text-yellow-festival transition-colors">
                          Contact Us
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-display text-base sm:text-lg font-bold text-red-stage uppercase tracking-wider">
                      Contact &amp; Social
                    </h4>
                    <div className="space-y-2 text-sm font-bold text-[#FAF8F5]/80">
                      <p className="hover:text-yellow-festival transition-colors">
                        <a href="mailto:elementfive.event@gmail.com">elementfive.event@gmail.com</a>
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <a href="https://www.instagram.com/elementfive.event" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-festival transition-colors">INSTAGRAM</a>
                        <a href="https://www.youtube.com/@Element5_ah" target="_blank" rel="noopener noreferrer" className="hover:text-red-stage transition-colors">YOUTUBE</a>
                        <a href="https://spotify.com" className="hover:text-green-500 transition-colors">SPOTIFY</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-7xl mx-auto border-t border-[#FAF8F5]/10 mt-10 sm:mt-16 pt-6 sm:pt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-[#FAF8F5]/40 font-bold tracking-widest text-center sm:text-left">
                  <p>© {new Date().getFullYear()} ELEMENT 5 CREATIVE ECOSYSTEM.</p>
                  <p>HANDCRAFTED IN GUJARAT FOR THE CREATOR ECONOMY.</p>
                </div>
              </footer>
            </SmoothScroll>
          </AuthProvider>
        </AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
