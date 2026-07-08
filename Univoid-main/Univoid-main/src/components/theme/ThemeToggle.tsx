import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-5 h-5 transition-transform duration-200" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-200" />
      )}
    </Button>
  );
}
