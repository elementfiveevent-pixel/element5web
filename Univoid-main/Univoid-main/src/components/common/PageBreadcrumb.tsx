import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const PageBreadcrumb = ({ items, className }: PageBreadcrumbProps) => {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center gap-1 text-sm mb-6 overflow-x-auto pb-1", className)}
    >
      <Link 
        to="/" 
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            {isLast || !item.href ? (
              <span 
                className={cn(
                  "truncate max-w-[200px] sm:max-w-[300px]",
                  isLast ? "font-medium text-foreground" : "text-muted-foreground"
                )}
                title={item.label}
              >
                {item.label}
              </span>
            ) : (
              <Link 
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px] sm:max-w-[300px]"
                title={item.label}
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default PageBreadcrumb;
