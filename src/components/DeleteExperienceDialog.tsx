import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DeleteExperienceDialogProps {
  experienceId: string;
  experienceTitle: string;
  experienceDateTime: string;
  onDeleted: () => void;
}

const DeleteExperienceDialog = ({
  experienceId,
  experienceTitle,
  experienceDateTime,
  onDeleted,
}: DeleteExperienceDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if experience is within 15 minutes of starting
  const experienceStart = new Date(experienceDateTime);
  const now = new Date();
  const fifteenMinutesBefore = new Date(experienceStart.getTime() - 15 * 60 * 1000);
  const isLocked = now >= fifteenMinutesBefore;

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);

    try {
      // Get host profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      const hostName = profile?.display_name || "The host";

      // Send notifications to participants
      const { error: notifyError } = await supabase.functions.invoke(
        "notify-experience-cancelled",
        {
          body: {
            experienceId,
            experienceTitle,
            reason: reason.trim(),
            hostName,
          },
        }
      );

      if (notifyError) {
        console.error("Error sending notifications:", notifyError);
        // Continue with deletion even if notifications fail
      }

      // Delete the experience
      const { error: deleteError } = await supabase
        .from("experiences")
        .delete()
        .eq("id", experienceId);

      if (deleteError) throw deleteError;

      toast.success("Experience deleted and participants notified");
      setOpen(false);
      setReason("");
      onDeleted();
    } catch (error: any) {
      console.error("Error deleting experience:", error);
      toast.error(error.message || "Failed to delete experience");
    } finally {
      setLoading(false);
    }
  };

  if (isLocked) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cannot Delete Experience
            </AlertDialogTitle>
            <AlertDialogDescription>
              This experience cannot be deleted because it starts in less than 15 minutes.
              Experiences are locked 15 minutes before their start time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Experience</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{experienceTitle}"? This action cannot be undone.
            All participants who have joined will be notified via email with your reason.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="reason">
            Reason for cancellation <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Please explain why you're cancelling this experience..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            This message will be sent to all participants.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={loading || !reason.trim()}
            variant="destructive"
          >
            {loading ? "Deleting..." : "Delete & Notify"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteExperienceDialog;
