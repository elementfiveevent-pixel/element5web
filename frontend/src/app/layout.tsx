import type { Metadata } from "next";
import { Syne, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import CustomCursor from "@/components/ui/CustomCursor";
import SmoothScroll from "@/components/ui/SmoothScroll";
import LayoutWrapper from "@/components/ui/LayoutWrapper";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
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

              <LayoutWrapper>{children}</LayoutWrapper>
            </SmoothScroll>
          </AuthProvider>
        </AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
