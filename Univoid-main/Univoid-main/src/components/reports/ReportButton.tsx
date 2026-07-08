import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportModal from './ReportModal';
import { ReportContentType } from '@/services/reportsService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ReportButtonProps {
  contentType: ReportContentType;
  contentId: string;
  contentOwnerId: string;
  contentTitle?: string;
  variant?: 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'icon';
  showLabel?: boolean;
}

export default function ReportButton({
  contentType,
  contentId,
  contentOwnerId,
  contentTitle,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: ReportButtonProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      toast.error('Please sign in to report content');
      return;
    }

    if (user.id === contentOwnerId) {
      toast.error('You cannot report your own content');
      return;
    }

    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className="text-muted-foreground hover:text-destructive"
        title="Report"
      >
        <Flag className="w-4 h-4" />
        {showLabel && <span className="ml-1">Report</span>}
      </Button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contentType={contentType}
        contentId={contentId}
        contentOwnerId={contentOwnerId}
        contentTitle={contentTitle}
      />
    </>
  );
}
