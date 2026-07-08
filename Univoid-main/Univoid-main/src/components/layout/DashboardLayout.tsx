import { Outlet } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FloatingDoodles } from "@/components/common/FloatingDoodles";

/**
 * DashboardLayout - Persistent layout shell for dashboard/internal pages
 * Sidebar and mobile header stay mounted during navigation
 * Uses fixed height layout to prevent body scroll - only content area scrolls
 */
const DashboardLayout = () => {
  // Lock body scroll when dashboard is mounted
  useEffect(() => {
    document.documentElement.classList.add('dashboard-scroll-lock');
    return () => {
      document.documentElement.classList.remove('dashboard-scroll-lock');
    };
  }, []);

  return (
    <div className="h-dvh flex bg-background paper-texture overflow-hidden relative">
      {/* Global floating doodles background */}
      <FloatingDoodles density="global" className="fixed inset-0" />
      
      {/* Sidebar - Desktop (persistent, fixed height) */}
      <DashboardSidebar />

      {/* Main Content - Fixed height container */}
      <main className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden relative z-10">
        {/* Mobile Header (persistent, sticky) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <DashboardSidebar isMobile />
            </SheetContent>
          </Sheet>
          <Link to="/" className="font-bold text-lg">UniVoid</Link>
          <ThemeToggle className="rounded-xl shrink-0" />
        </header>

        {/* Page content - scrollable area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin overscroll-contain">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;