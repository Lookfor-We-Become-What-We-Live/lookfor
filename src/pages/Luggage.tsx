import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import ExperienceCard from "@/components/ExperienceCard";
import ExperienceDetailModal from "@/components/ExperienceDetailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

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

  const handleCardClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setModalOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Luggage</h1>
          <p className="text-muted-foreground">
            Manage your experiences and adventures
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastEnrollments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeEnrollments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No active experiences yet.</p>
                <p className="text-sm mt-2">
                  Explore the feed to find exciting experiences!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            {pastEnrollments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No past experiences yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEnrollments.map((enrollment) => (
                  <ExperienceCard
                    key={enrollment.id}
                    {...enrollment.experience}
                    onClick={() => handleCardClick(enrollment.experience)}
                  />
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
    </div>
  );
};

export default Luggage;
