import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import ExperienceCard from "@/components/ExperienceCard";
import ExperienceDetailModal from "@/components/ExperienceDetailModal";
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
  hostUserId?: string;
}

const Explore = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchExperiences();
    if (user) {
      fetchEnrollments();
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [experiences, userLocation]);

  const fetchExperiences = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .gte("date_time_start", now)
        .order("date_time_start", { ascending: true });

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
        hostUserId: exp.host_user_id,
      }));

      setExperiences(mapped);
    } catch (error) {
      console.error("Error fetching experiences:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select("experience_id")
        .eq("user_id", user.id)
        .eq("status", "joined");

      if (error) throw error;

      setEnrolledIds(new Set(data.map((e: any) => e.experience_id)));
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const applyFilters = () => {
    let filtered = [...experiences];

    // Sort by proximity if user location is available
    if (userLocation) {
      filtered = filtered
        .map((exp) => ({
          ...exp,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            exp.locationLat,
            exp.locationLng
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .map(({ distance, ...exp }) => exp);
    }

    setFilteredExperiences(filtered);
  };

  const handleCardClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setModalOpen(true);
  };

  const handleEnrollmentChange = () => {
    fetchEnrollments();
    setModalOpen(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <div className="container py-4">
        <h1 className="text-2xl font-bold">Explore</h1>
      </div>

      <div className="container py-4 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              {...experience}
              onClick={() => handleCardClick(experience)}
              isJoined={enrolledIds.has(experience.id)}
            />
          ))}
        </div>
      </div>

      <ExperienceDetailModal
        experience={selectedExperience}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isEnrolled={selectedExperience ? enrolledIds.has(selectedExperience.id) : false}
        onEnrollmentChange={handleEnrollmentChange}
      />

      <BottomNav />
    </div>
  );
};

export default Explore;
