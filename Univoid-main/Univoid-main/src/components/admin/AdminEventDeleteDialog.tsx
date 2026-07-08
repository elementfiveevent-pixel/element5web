import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface AdminEventDeleteDialogProps {
  eventId: string;
  eventTitle: string;
  registrationsCount: number;
  onDeleted?: () => void;
}

export function AdminEventDeleteDialog({ 
  eventId, 
  eventTitle, 
  registrationsCount,
  onDeleted 
}: AdminEventDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Use the same RPC that checks for admin/owner permissions
      const { data, error } = await supabase.rpc('permanently_delete_event', {
        p_event_id: eventId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.message || result.error || 'Delete failed');
      }
      
      return result;
    },
    onSuccess: () => {
      toast({ 
        title: "Event Permanently Deleted", 
        description: `"${eventTitle}" and all related data have been removed.` 
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      setOpen(false);
      setConfirmText("");
      setAcknowledged(false);
      onDeleted?.();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Delete Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const canDelete = confirmText === "DELETE" && acknowledged;

  const handleDelete = () => {
    if (canDelete) {
      deleteMutation.mutate();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" title="Permanently delete event">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Admin: Delete Event Permanently
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="font-medium text-foreground">
                Deleting: <span className="text-destructive">"{eventTitle}"</span>
              </p>
              
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
                <p className="text-sm font-semibold text-destructive">
                  ⚠️ ADMIN ACTION - This is permanent and cannot be undone.
                </p>
                <p className="text-sm text-muted-foreground">The following will be permanently deleted:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Event details, flyer, and UPI QR images</li>
                  <li>{registrationsCount} registration(s) and tickets</li>
                  <li>All upsells, add-ons, and form fields</li>
                  <li>Volunteer assignments and check-in records</li>
                  <li>Google Sheets sync configuration</li>
                  <li>All audit logs for this event</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="admin-acknowledge" 
                    checked={acknowledged}
                    onCheckedChange={(c) => setAcknowledged(c === true)}
                  />
                  <Label htmlFor="admin-acknowledge" className="text-sm leading-tight">
                    I confirm this is an admin action and all data will be permanently lost
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-confirm" className="text-sm">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm:
                  </Label>
                  <Input
                    id="admin-confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AdminEventDeleteDialog;
