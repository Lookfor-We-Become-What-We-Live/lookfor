import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Users, ChevronDown, ChevronUp } from "lucide-react";
import UserProfileModal from "./UserProfileModal";

interface Participant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ExperienceParticipantsProps {
  experienceId: string;
}

const ExperienceParticipants = ({ experienceId }: ExperienceParticipantsProps) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, [experienceId]);

  const fetchParticipants = async () => {
    try {
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("user_id")
        .eq("experience_id", experienceId)
        .eq("status", "joined");

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      const userIds = enrollments.map((e) => e.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Filter out the current user from the participants list
      const filteredProfiles = (profiles || []).filter(
        (p) => p.user_id !== user?.id
      );
      setParticipants(filteredProfiles);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantClick = (userId: string) => {
    setSelectedUserId(userId);
    setProfileModalOpen(true);
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Users className="w-4 h-4" />
        Loading...
      </Button>
    );
  }

  if (participants.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Users className="w-4 h-4" />
        No participants
      </Button>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-2"
        >
          <Users className="w-4 h-4" />
          Participants ({participants.length})
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        
        {expanded && (
          <div className="flex flex-wrap gap-2 pt-2">
            {participants.map((participant) => (
              <button
                key={participant.user_id}
                onClick={() => handleParticipantClick(participant.user_id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={participant.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <User className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {participant.display_name || "Anonymous"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <UserProfileModal
        userId={selectedUserId}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
};

export default ExperienceParticipants;
