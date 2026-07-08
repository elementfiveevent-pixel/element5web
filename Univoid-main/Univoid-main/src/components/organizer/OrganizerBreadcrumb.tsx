import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface OrganizerBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function OrganizerBreadcrumb({ items, className }: OrganizerBreadcrumbProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto", className)}
    >
      <Link 
        to="/organizer" 
        className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-[200px]">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
