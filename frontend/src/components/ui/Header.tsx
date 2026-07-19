"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar, ChevronDown, Ticket, PlusCircle, LayoutDashboard,
  BarChart2, Mic2, Users, Trophy, Radio, Menu, X, LogOut, User, ShieldAlert, Download
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// ── Dropdown item shape ──────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  badge?: string;
}

// ── Reusable dropdown menu ───────────────────────────────────────────────────
function NavDropdown({
  label,
  items,
  badge,
}: {
  label: string;
  items: NavItem[];
  badge?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, 150); // 150ms delay to bridge any gap
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 font-bold text-sm tracking-widest hover:text-yellow-festival transition-colors py-1 cursor-pointer"
      >
        {label}
        {badge && (
          <span className="bg-red-stage text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
            {badge}
          </span>
        )}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 w-64 transition-all duration-200 animate-in fade-in slide-in-from-top-1"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-[#0F0E0E] border-3 border-[#FAF8F5]/20 rounded shadow-[8px_8px_0px_0px_rgba(255,222,77,0.3)] overflow-hidden relative">
            {/* Arrow */}
            <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F0E0E] border-l-2 border-t-2 border-[#FAF8F5]/20 rotate-45" />

            <div className="py-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[#FAF8F5]/5 transition-colors group"
                >
                  <span className="mt-0.5 text-yellow-festival flex-shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="font-display font-bold text-xs uppercase tracking-wider text-[#FAF8F5] block">
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="font-space text-[10px] text-[#FAF8F5]/40 leading-tight block mt-0.5">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {item.badge && (
                    <span className="ml-auto flex-shrink-0 text-[9px] font-black bg-red-stage text-white px-1.5 py-0.5 rounded uppercase">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Header ──────────────────────────────────────────────────────────────
export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    
    // If iOS and not running in standalone (PWA) mode, show install button
    if (ios && !(window.navigator as any).standalone) {
      setShowInstallBtn(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      showToast("To install on iOS: Tap the Share button in Safari, then select 'Add to Home Screen'. 📲", "info");
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const isOrganizerOrAdmin =
    user && ["SUPER_ADMIN", "ORG_ADMIN"].includes(user.role);
  const isAdmin = user && user.role === "SUPER_ADMIN";
  const isArtist = user && user.role === "ARTIST";
  const hasOnboarded = !isArtist || !!(user && (user as any).artistProfile && (user as any).artistProfile.genres && (user as any).artistProfile.genres.length > 0);

  const eventItems: NavItem[] = [
    {
      label: "Upcoming Events",
      href: "/events",
      icon: <Calendar size={15} />,
      description: "Browse all open registrations",
    },
    {
      label: "Past Events",
      href: "/events?tab=past",
      icon: <Trophy size={15} />,
      description: "Recaps and results",
    },
    {
      label: "StageVerse",
      href: "/stageverse",
      icon: <Radio size={15} />,
      description: "Live arena & audience voting",
      badge: "LIVE",
    },
    ...(user && hasOnboarded
      ? [
          {
            label: "My Tickets",
            href: "/events/my-tickets",
            icon: <Ticket size={15} />,
            description: "QR codes for your registrations",
          },
        ]
      : []),
  ];

  const organizerItems: NavItem[] = [
    {
      label: "Organizer Dashboard",
      href: "/events/organizer",
      icon: <LayoutDashboard size={15} />,
      description: "Manage your events end-to-end",
    },
    {
      label: "Create Event",
      href: "/events/create",
      icon: <PlusCircle size={15} />,
      description: "Multi-step event creation wizard",
    },
    {
      label: "Event Analytics",
      href: "/events/organizer?tab=analytics",
      icon: <BarChart2 size={15} />,
      description: "Registrations, check-ins, revenue",
    },
  ];

  const platformItems: NavItem[] = [
    {
      label: "Leaderboard",
      href: "/leaderboard",
      icon: <Trophy size={15} />,
      description: "Artist rankings & season scores",
    },
    {
      label: "Discover Artists",
      href: "/artists",
      icon: <Mic2 size={15} />,
      description: "Browse all verified creators",
    },
    {
      label: "Network",
      href: "/network",
      icon: <Users size={15} />,
      description: "Collab boards & DMs",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b-3 border-[#121212] bg-[#121212]/97 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link
          href="/"
          className="font-display font-extrabold text-xl tracking-tighter hover:text-yellow-festival transition-colors flex items-center gap-2 flex-shrink-0"
        >
          ELEMENT 5
          <span className="text-[9px] bg-red-stage text-white font-bold px-1.5 py-0.5 border border-white/20 rounded rotate-[4deg] select-none hidden sm:inline">
            STAGES
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7 font-bold text-xs uppercase tracking-widest text-[#FAF8F5]">
          {user?.role === "ORG_ADMIN" ? (
            <>
              <Link
                href="/events/organizer?tab=events"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname.startsWith("/events/organizer") && (!pathname.includes("tab") || pathname.includes("tab=events")) ? "text-yellow-festival" : ""
                }`}
              >
                My Events
              </Link>
              <Link
                href="/events/organizer?tab=registrations"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname.includes("tab=registrations") ? "text-yellow-festival" : ""
                }`}
              >
                Registrations
              </Link>
              <Link
                href="/events/organizer?tab=gate"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname.includes("tab=gate") ? "text-yellow-festival" : ""
                }`}
              >
                Ticket Gateway
              </Link>
              <Link
                href="/events/organizer?tab=analytics"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname.includes("tab=analytics") ? "text-yellow-festival" : ""
                }`}
              >
                Analytics
              </Link>
              <Link
                href="/events/organizer?tab=voting"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname.includes("tab=voting") ? "text-yellow-festival" : ""
                }`}
              >
                Manage Voting
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/events"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname === "/events" ? "text-yellow-festival" : ""
                }`}
              >
                All Events
              </Link>

              <Link
                href="/stageverse"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname === "/stageverse" ? "text-yellow-festival" : ""
                }`}
              >
                Stageverse
              </Link>

              <Link
                href="/leaderboard"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname === "/leaderboard" ? "text-yellow-festival" : ""
                }`}
              >
                Leaderboard
              </Link>

              <Link
                href="/community"
                className={`hover:text-yellow-festival transition-colors ${
                  pathname.startsWith("/community") ? "text-yellow-festival" : ""
                }`}
              >
                Community
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 hover:text-yellow-festival transition-colors ${
                    pathname.startsWith("/admin") ? "text-yellow-festival" : ""
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  ADMIN
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Auth area + mobile toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              {user?.role === "ORG_ADMIN" ? (
                <Link
                  href="/events/organizer"
                  className="flex items-center gap-1.5 border border-yellow-festival/50 text-yellow-festival hover:bg-yellow-festival hover:text-[#121212] font-bold px-3 py-1.5 text-[11px] tracking-widest rounded transition-all"
                >
                  <User size={12} /> ORGANIZER PROFILE
                </Link>
              ) : user?.role === "SUPER_ADMIN" ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 border border-red-stage/50 text-red-stage hover:bg-red-stage hover:text-white font-bold px-3 py-1.5 text-[11px] tracking-widest rounded transition-all"
                >
                  <User size={12} /> ADMIN PROFILE
                </Link>
              ) : hasOnboarded ? (
                <>
                  {showInstallBtn && (
                    <button
                      onClick={handleInstallClick}
                      className="flex items-center gap-1.5 border border-yellow-festival/50 text-yellow-festival hover:bg-yellow-festival hover:text-[#121212] font-bold px-3 py-1.5 text-[11px] tracking-widest rounded transition-all cursor-pointer"
                    >
                      <Download size={12} /> INSTALL APP
                    </button>
                  )}
                  <Link
                    href="/events/my-tickets"
                    className="flex items-center gap-1.5 border border-[#FAF8F5]/20 text-[#FAF8F5]/70 hover:text-yellow-festival hover:border-yellow-festival font-bold px-3 py-1.5 text-[11px] tracking-widest rounded transition-all"
                  >
                    <Ticket size={12} /> MY TICKETS
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 border border-[#FAF8F5]/20 text-[#FAF8F5]/70 hover:text-yellow-festival hover:border-yellow-festival font-bold px-3 py-1.5 text-[11px] tracking-widest rounded transition-all"
                  >
                    <User size={12} /> PROFILE
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 border border-red-stage text-red-stage hover:bg-red-stage hover:text-white font-bold px-3 py-1.5 text-[11px] tracking-widest rounded transition-all"
                >
                  <LogOut size={12} /> LOG OUT
                </button>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              {showInstallBtn && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 border border-yellow-festival/50 text-yellow-festival hover:bg-yellow-festival hover:text-[#121212] font-bold px-3 py-1.5 text-[11px] tracking-widest rounded transition-all cursor-pointer mr-1.5"
                >
                  <Download size={12} /> INSTALL APP
                </button>
              )}
              <Link
                href="/login"
                className="border-2 border-[#FAF8F5]/30 text-[#FAF8F5] font-bold px-4 py-1.5 text-xs tracking-wider hover:bg-[#FAF8F5]/10 transition-all rounded"
              >
                LOGIN
              </Link>
              <Link
                href="/register"
                className="bg-yellow-festival text-[#121212] font-black border-2 border-[#121212] px-4 py-1.5 text-xs tracking-wider shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded"
              >
                JOIN FREE
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden border-2 border-[#FAF8F5]/20 p-2 rounded text-[#FAF8F5] hover:border-yellow-festival transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0F0E0E] border-t-2 border-[#FAF8F5]/10 px-4 pb-6 pt-4 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-2 border-b border-[#FAF8F5]/10 pb-4">
            {user?.role === "ORG_ADMIN" ? (
              <>
                <Link
                  href="/events/organizer?tab=events"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname.startsWith("/events/organizer") && (!pathname.includes("tab") || pathname.includes("tab=events")) ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span>📅</span> My Events
                </Link>
                <Link
                  href="/events/organizer?tab=registrations"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname.includes("tab=registrations") ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span>👥</span> Registrations
                </Link>
                <Link
                  href="/events/organizer?tab=gate"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname.includes("tab=gate") ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span>🎫</span> Ticket Gateway
                </Link>
                <Link
                  href="/events/organizer?tab=analytics"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname.includes("tab=analytics") ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span>📊</span> Analytics
                </Link>
                <Link
                  href="/events/organizer?tab=voting"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname.includes("tab=voting") ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span>⚡</span> Manage Voting
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/events"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname === "/events" ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span className="text-yellow-festival">📅</span> All Events
                </Link>

                <Link
                  href="/stageverse"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname === "/stageverse" ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span className="text-yellow-festival">⚡</span> Stageverse
                </Link>

                <Link
                  href="/leaderboard"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname === "/leaderboard" ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span className="text-yellow-festival">🏆</span> Leaderboard
                </Link>

                <Link
                  href="/community"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors font-display font-bold text-xs uppercase tracking-wider ${
                    pathname.startsWith("/community") ? "text-yellow-festival" : "text-[#FAF8F5]"
                  }`}
                >
                  <span className="text-yellow-festival">👥</span> Community
                </Link>
              </>
            )}
          </div>

          {user?.role === "ORG_ADMIN" ? null : isAdmin && (
            <MobileSection title="Admin Operations">
              <MobileLink item={{ label: "Admin CMS Dashboard", href: "/admin", icon: <ShieldAlert size={15} /> }} onClose={() => setMobileOpen(false)} />
            </MobileSection>
          )}

          {isAdmin && (
            <MobileSection title="Admin">
              <MobileLink
                item={{ label: "Admin CMS", href: "/admin", icon: <LayoutDashboard size={15} /> }}
                onClose={() => setMobileOpen(false)}
              />
            </MobileSection>
          )}

          <div className="pt-4 border-t border-[#FAF8F5]/10">
            {user ? (
              <div className="flex flex-col gap-3">
                {showInstallBtn && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full text-center bg-yellow-festival text-[#121212] font-black border-2 border-[#121212] py-2 text-xs rounded cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> DOWNLOAD ELEMENT 5 APP
                  </button>
                )}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-xs font-black text-yellow-festival uppercase block truncate max-w-[180px]">
                      {user.fullName} ({user.reputationXp} XP)
                    </span>
                    <span className="text-[10px] font-bold text-[#FAF8F5]/40 uppercase">{user.role.replace("_", " ")}</span>
                  </div>
                  <div className="flex gap-2">
                    {user?.role === "ORG_ADMIN" ? (
                      <Link
                        href="/events/organizer"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-1.5 text-xs font-black text-yellow-festival uppercase border border-yellow-festival px-3 py-1.5 rounded"
                      >
                        <User size={12} /> ORGANIZER PROFILE
                      </Link>
                    ) : user?.role === "SUPER_ADMIN" ? (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-1.5 text-xs font-black text-red-stage uppercase border border-red-stage px-3 py-1.5 rounded"
                      >
                        <User size={12} /> ADMIN PROFILE
                      </Link>
                    ) : hasOnboarded && (
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-1.5 text-xs font-black text-yellow-festival uppercase border border-yellow-festival/30 px-3 py-1.5 rounded"
                      >
                        <User size={12} /> PROFILE
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="flex items-center gap-1.5 text-xs font-black text-red-stage uppercase border border-red-stage px-3 py-1.5 rounded"
                    >
                      <LogOut size={12} /> LOGOUT
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {showInstallBtn && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full text-center bg-yellow-festival text-[#121212] font-black border-2 border-[#121212] py-2.5 text-xs rounded cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> INSTALL APP
                  </button>
                )}
                <div className="flex gap-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center border-2 border-[#FAF8F5]/30 text-[#FAF8F5] font-bold py-2.5 text-xs rounded">LOGIN</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center bg-yellow-festival text-[#121212] font-black border-2 border-[#121212] py-2.5 text-xs rounded">JOIN FREE</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-[#FAF8F5]/30 px-2 pb-1">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MobileLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className="flex items-center gap-3 px-2 py-2.5 rounded hover:bg-[#FAF8F5]/5 transition-colors"
    >
      <span className="text-yellow-festival">{item.icon}</span>
      <span className="font-display font-bold text-xs uppercase tracking-wider text-[#FAF8F5]">
        {item.label}
      </span>
      {item.badge && (
        <span className="ml-auto text-[9px] font-black bg-red-stage text-white px-1.5 py-0.5 rounded uppercase">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default Header;
