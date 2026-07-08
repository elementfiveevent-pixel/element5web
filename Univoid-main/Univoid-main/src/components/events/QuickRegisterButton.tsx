import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface QuickRegisterButtonProps {
  eventId: string;
  isPast?: boolean;
  isFull?: boolean;
  className?: string;
  variant?: "primary" | "secondary";
}

const QuickRegisterButton = ({ 
  eventId, 
  isPast = false, 
  isFull = false,
  className = "",
  variant = "secondary"
}: QuickRegisterButtonProps) => {
  if (isPast || isFull) return null;

  if (variant === "primary") {
    return (
      <Link to={`/register/${eventId}`} className={className}>
        <Button 
          className="w-full h-14 text-base font-bold shadow-lg hover:shadow-xl transition-shadow"
          size="lg"
        >
          <Zap className="w-5 h-5 mr-2" />
          Quick Register
        </Button>
      </Link>
    );
  }

  return (
    <Link to={`/register/${eventId}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className={`gap-2 ${className}`}
      >
        <Zap className="w-4 h-4" />
        Quick Register
      </Button>
    </Link>
  );
};

export default QuickRegisterButton;
