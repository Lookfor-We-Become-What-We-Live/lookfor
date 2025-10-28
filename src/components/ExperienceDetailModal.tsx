import { Calendar, MapPin, Users, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

interface Experience {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  dateTimeStart: string;
  locationAddress: string;
  locationLat: number;
  locationLng: number;
  price?: number;
  capacity?: number;
  imageUrl?: string;
}

interface ExperienceDetailModalProps {
  experience: Experience | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnrolled: boolean;
  onEnrollmentChange: () => void;
}

const ExperienceDetailModal = ({
  experience,
  open,
  onOpenChange,
  isEnrolled,
  onEnrollmentChange,
}: ExperienceDetailModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!experience) return null;

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please sign in to join experiences");
      return;
    }

    setLoading(true);
    try {
      if (isEnrolled) {
        // Cancel enrollment
        const { error } = await supabase
          .from("enrollments")
          .update({ status: "cancelled" })
          .eq("user_id", user.id)
          .eq("experience_id", experience.id);

        if (error) throw error;
        toast.success("Left the experience");
      } else {
        // Join experience
        const { error } = await supabase.from("enrollments").insert({
          user_id: user.id,
          experience_id: experience.id,
          status: "joined",
        });

        if (error) {
          // If already enrolled but cancelled, update status
          if (error.code === "23505") {
            const { error: updateError } = await supabase
              .from("enrollments")
              .update({ status: "joined" })
              .eq("user_id", user.id)
              .eq("experience_id", experience.id);

            if (updateError) throw updateError;
            toast.success("Joined the experience!");
          } else {
            throw error;
          }
        } else {
          toast.success("Joined the experience!");
        }
      }
      onEnrollmentChange();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="relative h-64 w-full -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
            <img
              src={experience.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c"}
              alt={experience.title}
              className="w-full h-full object-cover"
            />
          </div>
          <DialogTitle className="text-2xl">{experience.title}</DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{experience.category}</Badge>
              {experience.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-base text-foreground">{experience.description}</p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{format(new Date(experience.dateTimeStart), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-secondary" />
                <span>{experience.locationAddress}</span>
              </div>
              {experience.capacity && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="w-5 h-5 text-accent" />
                  <span>Up to {experience.capacity} people</span>
                </div>
              )}
              {experience.price !== null && experience.price !== undefined && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <span className="font-semibold">
                    {experience.price === 0 ? "Free" : `$${experience.price}`}
                  </span>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleEnroll}
            disabled={loading}
            className="flex-1"
            variant={isEnrolled ? "outline" : "default"}
          >
            {loading ? "Loading..." : isEnrolled ? "Leave Experience" : "Join Experience"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExperienceDetailModal;
