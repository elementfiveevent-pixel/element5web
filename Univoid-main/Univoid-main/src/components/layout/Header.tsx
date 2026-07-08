import { Link, useLocation } from "react-router-dom";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import { Button } from "@/components/ui/button";
import { User, LogOut, Shield, BookOpen, Repeat2, Trophy, Calendar, LayoutDashboard, Folder } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileNavDrawer } from "./MobileNavDrawer";

interface HeaderProps {
  onAuthClick: () => void;
}

const Header = ({ onAuthClick }: HeaderProps) => {
  const { user, profile, isAdmin, isOrganizer, signOut } = useAuth();
  const location = useLocation();

  const navLinks = [
    { href: "/materials", label: "Materials", icon: BookOpen },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/projects", label: "Projects", icon: Folder },
    { href: "/books", label: "Books", icon: Repeat2 },
    { href: "/leaderboard", label: "Ranks", icon: Trophy },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActiveLink = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <PrefetchLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-primary border border-border rounded-xl flex items-center justify-center shadow-sketch-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-sketch transition-all duration-200">
              <span className="text-primary-foreground font-extrabold text-lg font-display">U</span>
            </div>
            <span className="font-extrabold text-xl text-foreground font-display">UniVoid</span>
          </PrefetchLink>

          {/* Desktop Navigation - Sketch Style */}
          <nav className="hidden md:flex items-center gap-0.5 bg-card rounded-xl px-1.5 py-1.5 border border-border shadow-sketch-sm">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const navId = `nav-${link.href.replace('/', '')}`;
              return (
                <PrefetchLink
                  key={link.href}
                  id={navId}
                  to={link.href}
                  className={`px-3.5 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 ${
                    isActiveLink(link.href)
                      ? 'bg-secondary font-bold text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.5} />
                  <span className="hidden lg:inline">{link.label}</span>
                </PrefetchLink>
              );
            })}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-1">
            <ThemeToggle className="rounded-full" />
            {user && <NotificationCenter />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:scale-105 transition-transform">
                    <Avatar className="h-10 w-10 border-2 border-border-strong/20 shadow-soft">
                      <AvatarImage src={profile?.profile_photo_url || undefined} alt={profile?.full_name} />
                      <AvatarFallback className="bg-pastel-purple text-foreground text-sm font-bold">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-2xl border border-border-strong/10 shadow-soft-lg" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-3">
                    <p className="text-sm font-bold leading-none font-display">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer font-semibold rounded-xl">
                      <User className="mr-2 h-4 w-4" strokeWidth={2.5} />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isOrganizer && (
                    <DropdownMenuItem asChild>
                      <Link to="/organizer/dashboard" className="cursor-pointer font-semibold rounded-xl">
                        <LayoutDashboard className="mr-2 h-4 w-4" strokeWidth={2.5} />
                        Organizer Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer font-semibold rounded-xl">
                        <Shield className="mr-2 h-4 w-4" strokeWidth={2.5} />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive font-semibold rounded-xl">
                    <LogOut className="mr-2 h-4 w-4" strokeWidth={2.5} />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onAuthClick} className="font-semibold">
                  Sign in
                </Button>
                <Button size="sm" onClick={onAuthClick} className="shadow-soft">
                  Join UniVoid
                </Button>
              </>
            )}
          </div>

          {/* Mobile Navigation Drawer */}
          <div className="flex items-center gap-2 md:hidden">
            {user && <NotificationCenter />}
            <MobileNavDrawer onAuthClick={onAuthClick} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
