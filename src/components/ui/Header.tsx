"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar, ChevronDown, Ticket, PlusCircle, LayoutDashboard,
  BarChart2, Mic2, Users, Trophy, Radio, Menu, X, LogOut
} from "lucide-react";

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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOrganizerOrAdmin =
    user && ["SUPER_ADMIN", "ORG_ADMIN", "EVENT_MANAGER"].includes(user.role);
  const isAdmin = user && ["SUPER_ADMIN", "ORG_ADMIN"].includes(user.role);

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
    ...(user
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
        <nav className="hidden lg:flex items-center gap-7 font-bold text-sm tracking-widest text-[#FAF8F5]">
          <NavDropdown label="EVENTS" items={eventItems} />

          <NavDropdown label="PLATFORM" items={platformItems} />

          {isOrganizerOrAdmin && (
            <NavDropdown label="ORGANIZER" items={organizerItems} badge="ORG" />
          )}

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
        </nav>

        {/* Auth area + mobile toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/events/my-tickets"
                className="flex items-center gap-1.5 border border-[#FAF8F5]/20 text-[#FAF8F5]/70 hover:text-yellow-festival hover:border-yellow-festival font-bold px-3 py-1.5 text-[11px] tracking-widest rounded transition-all"
              >
                <Ticket size={12} /> MY TICKETS
              </Link>
              <div className="flex items-center gap-2 border-l border-[#FAF8F5]/10 pl-3">
                <div className="text-right hidden md:block">
                  <span className="text-[10px] font-black text-yellow-festival block uppercase tracking-wider leading-tight">
                    {user.fullName.split(" ")[0]} ({user.reputationXp} XP)
                  </span>
                  <span className="text-[9px] text-[#FAF8F5]/40 font-bold uppercase">
                    {user.role.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="bg-[#D80032] text-white font-bold border-2 border-[#121212] p-1.5 text-xs shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded cursor-pointer"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
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
        <div className="lg:hidden bg-[#0F0E0E] border-t-2 border-[#FAF8F5]/10 px-4 pb-6 pt-4 space-y-1 max-h-[80vh] overflow-y-auto">
          <MobileSection title="Events">
            {eventItems.map((i) => <MobileLink key={i.href} item={i} onClose={() => setMobileOpen(false)} />)}
          </MobileSection>

          <MobileSection title="Platform">
            {platformItems.map((i) => <MobileLink key={i.href} item={i} onClose={() => setMobileOpen(false)} />)}
          </MobileSection>

          {isOrganizerOrAdmin && (
            <MobileSection title="Organizer">
              {organizerItems.map((i) => <MobileLink key={i.href} item={i} onClose={() => setMobileOpen(false)} />)}
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
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-xs font-black text-yellow-festival uppercase block truncate max-w-[180px]">
                    {user.fullName} ({user.reputationXp} XP)
                  </span>
                  <span className="text-[10px] font-bold text-[#FAF8F5]/40 uppercase">{user.role.replace("_", " ")}</span>
                </div>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-1.5 text-xs font-black text-red-stage uppercase border border-red-stage px-3 py-1.5 rounded"
                >
                  <LogOut size={12} /> LOGOUT
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center border-2 border-[#FAF8F5]/30 text-[#FAF8F5] font-bold py-2.5 text-xs rounded">LOGIN</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center bg-yellow-festival text-[#121212] font-black border-2 border-[#121212] py-2.5 text-xs rounded">JOIN FREE</Link>
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
