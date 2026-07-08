import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bell } from 'lucide-react';

interface PushPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => Promise<boolean>;
}

export const PushPermissionDialog = ({
  open,
  onOpenChange,
  onAllow,
}: PushPermissionDialogProps) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async () => {
    setIsRequesting(true);
    await onAllow();
    setIsRequesting(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Don't miss important updates
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            Allow notifications to get instant updates about scholarships, events, projects, tasks, and campus announcements.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={handleAllow}
            disabled={isRequesting}
            className="w-full"
          >
            {isRequesting ? 'Requesting...' : 'Allow Notifications'}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full mt-0">
            Not Now
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
