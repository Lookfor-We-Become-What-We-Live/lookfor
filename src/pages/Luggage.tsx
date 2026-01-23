import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import ExperienceCard from "@/components/ExperienceCard";
import ExperienceDetailModal from "@/components/ExperienceDetailModal";
import ExperienceParticipants from "@/components/ExperienceParticipants";
import DeleteExperienceDialog from "@/components/DeleteExperienceDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Settings as SettingsIcon, Camera, Plus } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

interface Enrollment {
  id: string;
  experience: Experience;
  status: string;
}

const Luggage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeEnrollments, setActiveEnrollments] = useState<Enrollment[]>([]);
  const [pastEnrollments, setPastEnrollments] = useState<Enrollment[]>([]);
  const [hostedExperiences, setHostedExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string;
    avatar_url: string | null;
    interests: string[];
  } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
      fetchProfile();
      fetchHostedExperiences();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, interests")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          status,
          experiences (
            id,
            title,
            description,
            category,
            tags,
            date_time_start,
            location_address,
            location_lat,
            location_lng,
            price,
            capacity,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "joined");

      if (error) throw error;

      const now = new Date();
      const enrollments = data.map((enrollment: any) => ({
        id: enrollment.id,
        status: enrollment.status,
        experience: {
          id: enrollment.experiences.id,
          title: enrollment.experiences.title,
          description: enrollment.experiences.description,
          category: enrollment.experiences.category,
          tags: enrollment.experiences.tags,
          dateTimeStart: enrollment.experiences.date_time_start,
          locationAddress: enrollment.experiences.location_address,
          locationLat: enrollment.experiences.location_lat,
          locationLng: enrollment.experiences.location_lng,
          price: enrollment.experiences.price,
          capacity: enrollment.experiences.capacity,
          imageUrl: enrollment.experiences.image_url,
        },
      }));

      const active = enrollments.filter(
        (e) => new Date(e.experience.dateTimeStart) > now
      );
      const past = enrollments.filter(
        (e) => new Date(e.experience.dateTimeStart) <= now
      );

      setActiveEnrollments(active);
      setPastEnrollments(past);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHostedExperiences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("host_user_id", user.id)
        .order("date_time_start", { ascending: false });

      if (error) throw error;

      const mapped = data.map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        description: exp.description,
        category: exp.category,
        tags: exp.tags,
        dateTimeStart: exp.date_time_start,
        locationAddress: exp.location_address,
        locationLat: exp.location_lat,
        locationLng: exp.location_lng,
        price: exp.price,
        capacity: exp.capacity,
        imageUrl: exp.image_url,
      }));

      setHostedExperiences(mapped);
    } catch (error) {
      console.error("Error fetching hosted experiences:", error);
    }
  };

  const handleCardClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setModalOpen(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      await fetchProfile();
      // toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error("Error updating avatar:", error);
      // toast.error(error.message || "Failed to update profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-semibold">Luggage</h1>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/")}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </header>
      <div className="container py-8">
        {profile && (
          <Card className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    <User className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer"
                  onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <Camera className="w-4 h-4" />
                </div>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold mb-2">
                  {profile.display_name || "Anonymous User"}
                </h2>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {profile.interests?.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Luggage</h1>
            <p className="text-muted-foreground">
              Manage your experiences and adventures
            </p>
          </div>
          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            className="gap-2"
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeEnrollments.length + hostedExperiences.filter(exp => new Date(exp.dateTimeStart) > new Date()).length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastEnrollments.length + hostedExperiences.filter(exp => new Date(exp.dateTimeStart) <= new Date()).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeEnrollments.length === 0 && hostedExperiences.filter(exp => new Date(exp.dateTimeStart) > new Date()).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No active experiences yet.</p>
                <p className="text-sm mt-2">
                  Explore the feed to find exciting experiences!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Hosted experiences (upcoming) */}
                {hostedExperiences
                  .filter(exp => new Date(exp.dateTimeStart) > new Date())
                  .map((experience) => (
                    <div key={`hosted-${experience.id}`} className="relative">
                      <Badge className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground">Hosting</Badge>
                      <ExperienceCard
                        {...experience}
                        onClick={() => handleCardClick(experience)}
                        hideCategory
                      />
                    </div>
                  ))}
                {/* Joined experiences (upcoming) */}
                {activeEnrollments.map((enrollment) => (
                  <ExperienceCard
                    key={enrollment.id}
                    {...enrollment.experience}
                    onClick={() => handleCardClick(enrollment.experience)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastEnrollments.length === 0 && hostedExperiences.filter(exp => new Date(exp.dateTimeStart) <= new Date()).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No past experiences yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Hosted experiences (past) */}
                {hostedExperiences
                  .filter(exp => new Date(exp.dateTimeStart) <= new Date())
                  .map((experience) => (
                    <div key={`hosted-${experience.id}`} className="space-y-3">
                      <div className="relative">
                        <Badge className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground">Hosted</Badge>
                        <ExperienceCard
                          {...experience}
                          onClick={() => handleCardClick(experience)}
                          hideCategory
                        />
                      </div>
                      <ExperienceParticipants experienceId={experience.id} />
                    </div>
                  ))}
                {/* Joined experiences (past) */}
                {pastEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="space-y-3">
                    <ExperienceCard
                      {...enrollment.experience}
                      onClick={() => handleCardClick(enrollment.experience)}
                    />
                    <ExperienceParticipants experienceId={enrollment.experience.id} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ExperienceDetailModal
        experience={selectedExperience}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isEnrolled={true}
        onEnrollmentChange={fetchEnrollments}
      />

      <BottomNav />
    </div>
  );
};

export default Luggage;
