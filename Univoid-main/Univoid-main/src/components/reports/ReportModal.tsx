import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { createReport, REPORT_REASONS, ReportContentType } from '@/services/reportsService';
import { useAuth } from '@/contexts/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ReportContentType;
  contentId: string;
  contentOwnerId: string;
  contentTitle?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentOwnerId,
  contentTitle,
}: ReportModalProps) {
  const { user } = useAuth();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to report content');
      return;
    }

    if (selectedReasons.length === 0) {
      toast.error('Please select at least one reason');
      return;
    }

    // Include "Other" reason text if selected
    const reasons = selectedReasons.map((r) =>
      r === 'Other' && otherReason ? `Other: ${otherReason}` : r
    );

    setIsSubmitting(true);
    const { error } = await createReport(
      contentType,
      contentId,
      contentOwnerId,
      user.id,
      reasons,
      comment || undefined
    );
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('unique_user_report') || error.message.includes('duplicate')) {
        toast.error('You have already reported this content');
      } else {
        toast.error('Failed to submit report: ' + error.message);
      }
      return;
    }

    toast.success('Report submitted successfully');
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedReasons([]);
    setOtherReason('');
    setComment('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const contentTypeLabel = {
    materials: 'Material',
    blogs: 'Blog',
    news: 'News',
    books: 'Book',
    profiles: 'Profile',
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report {contentTypeLabel[contentType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {contentTitle && (
            <p className="text-sm text-muted-foreground">
              Reporting: <span className="font-medium text-foreground">{contentTitle}</span>
            </p>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">What is the problem? *</Label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <div key={reason} className="flex items-start gap-2">
                  <Checkbox
                    id={reason}
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={() => handleReasonToggle(reason)}
                  />
                  <label
                    htmlFor={reason}
                    className="text-sm text-foreground cursor-pointer leading-tight"
                  >
                    {reason}
                  </label>
                </div>
              ))}
            </div>

            {selectedReasons.includes('Other') && (
              <Textarea
                placeholder="Please specify..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                maxLength={100}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Explain briefly (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{comment.length}/200 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedReasons.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
