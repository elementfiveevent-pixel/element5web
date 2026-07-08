import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteButtonProps {
  onDelete: () => Promise<boolean>;
  itemName?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "destructive" | "ghost" | "outline";
}

const DeleteButton = ({ 
  onDelete, 
  itemName = "item",
  size = "icon",
  variant = "ghost"
}: DeleteButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      // Auto-hide confirm after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
      return;
    }

    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    setShowConfirm(false);
  };

  if (isDeleting) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (showConfirm) {
    return (
      <Button
        variant="destructive"
        size={size === "icon" ? "sm" : size}
        onClick={handleClick}
        className="text-xs"
      >
        Confirm Delete
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
};

export default DeleteButton;
