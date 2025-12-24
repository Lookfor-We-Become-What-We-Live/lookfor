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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import ExperienceComments from "./ExperienceComments";
import { getCategoryImage } from "@/lib/categoryImages";
import ReportUserDialog from "./ReportUserDialog";
import ExperienceParticipants from "./ExperienceParticipants";

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
  hostUserId?: string;
}

interface HostProfile {
  display_name: string | null;
  avatar_url: string | null;
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
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);

  useEffect(() => {
    if (experience && open) {
      fetchEnrollmentCount();
      fetchHostProfile();
    }
  }, [experience, open]);

  const fetchEnrollmentCount = async () => {
    if (!experience) return;
    const { count } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("experience_id", experience.id)
      .eq("status", "joined");
    setEnrollmentCount(count || 0);
  };

  const fetchHostProfile = async () => {
    if (!experience?.hostUserId) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", experience.hostUserId)
      .single();
    setHostProfile(data);
  };

  if (!experience) return null;

  const isPastExperience = new Date(experience.dateTimeStart) < new Date();
  const isHost = user?.id === experience.hostUserId;

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please sign in to join experiences");
      return;
    }

    setLoading(true);
    try {
      if (isEnrolled) {
        // Cancel enrollment and set left_at timestamp
        const { error } = await supabase
          .from("enrollments")
          .update({ status: "cancelled", left_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("experience_id", experience.id);

        if (error) throw error;
        toast.success("Left the experience");
      } else {
        // Check if there's an existing enrollment with cooldown
        const { data: existingEnrollment } = await supabase
          .from("enrollments")
          .select("left_at")
          .eq("user_id", user.id)
          .eq("experience_id", experience.id)
          .single();

        if (existingEnrollment?.left_at) {
          const leftAt = new Date(existingEnrollment.left_at);
          const cooldownEnd = new Date(leftAt.getTime() + 15 * 60 * 1000); // 15 minutes
          const now = new Date();
          
          if (now < cooldownEnd) {
            const remainingMinutes = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 60000);
            toast.error(`You can rejoin this experience in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
            setLoading(false);
            return;
          }
        }

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
              .update({ status: "joined", left_at: null })
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
      fetchEnrollmentCount();
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
              src={experience.imageUrl || getCategoryImage(experience.category)}
              alt={experience.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Host Profile */}
          {hostProfile && experience.hostUserId && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={hostProfile.avatar_url || undefined} />
                  <AvatarFallback>
                    {hostProfile.display_name?.charAt(0)?.toUpperCase() || "H"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Hosted by</p>
                  <p className="font-medium">{hostProfile.display_name || "Anonymous"}</p>
                </div>
              </div>
              <ReportUserDialog 
                reportedUserId={experience.hostUserId} 
                reportedUserName={hostProfile.display_name || "Anonymous"} 
              />
            </div>
          )}
          
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
                  <span>
                    <strong>{enrollmentCount}</strong> / {experience.capacity} people joined
                  </span>
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
        
        {/* Participants Section */}
        <div className="pt-4 border-t">
          <ExperienceParticipants experienceId={experience.id} />
        </div>
        
        {!isHost && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleEnroll}
              disabled={loading || (isEnrolled && isPastExperience)}
              className="flex-1"
              variant={isEnrolled ? "outline" : "default"}
            >
              {loading ? "Loading..." : isEnrolled ? (isPastExperience ? "Experience Completed" : "Leave Experience") : "Join Experience"}
            </Button>
          </div>
        )}
        
        {/* Comments Section */}
        <ExperienceComments experienceId={experience.id} />
      </DialogContent>
    </Dialog>
  );
};

export default ExperienceDetailModal;
