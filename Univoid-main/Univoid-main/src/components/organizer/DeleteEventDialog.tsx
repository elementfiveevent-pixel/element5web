import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
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

interface DeleteEventDialogProps {
  eventId: string;
  eventTitle: string;
  registrationsCount: number;
}

export function DeleteEventDialog({ eventId, eventTitle, registrationsCount }: DeleteEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
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
    onSuccess: (data) => {
      toast({ 
        title: "Event Deleted", 
        description: `"${eventTitle}" has been permanently deleted.` 
      });
      queryClient.invalidateQueries({ queryKey: ["organizer-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/organizer/dashboard");
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
        <Button variant="destructive" size="sm" className="gap-1.5">
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Event Permanently
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="font-medium text-foreground">
                You are about to delete: <span className="text-destructive">"{eventTitle}"</span>
              </p>
              
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
                <p className="text-sm font-semibold text-destructive">⚠️ This action is permanent and cannot be undone.</p>
                <p className="text-sm text-muted-foreground">The following will be deleted:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Event details and flyer</li>
                  <li>{registrationsCount} registration(s) and tickets</li>
                  <li>All upsells and add-ons</li>
                  <li>Volunteer assignments</li>
                  <li>Check-in records</li>
                  <li>Google Sheets sync configuration</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="acknowledge" 
                    checked={acknowledged}
                    onCheckedChange={(c) => setAcknowledged(c === true)}
                  />
                  <Label htmlFor="acknowledge" className="text-sm leading-tight">
                    I understand this action is irreversible and all data will be lost
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm:
                  </Label>
                  <Input
                    id="confirm"
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

export default DeleteEventDialog;
