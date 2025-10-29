import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import ExperienceCard from "@/components/ExperienceCard";
import ExperienceDetailModal from "@/components/ExperienceDetailModal";
import CreateExperienceModal from "@/components/CreateExperienceModal";
import MapView from "@/components/MapView";
import SearchBar from "@/components/SearchBar";
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

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [priceFilter, setPriceFilter] = useState("all");
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [mapApiKey, setMapApiKey] = useState(
    localStorage.getItem("mapbox_api_key") || ""
  );
  const [viewMode, setViewMode] = useState<"feed" | "map">("feed");
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
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
    // Get user's current location
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
  }, [experiences, searchQuery, category, priceFilter, userLocation]);

  useEffect(() => {
    if (mapApiKey) {
      localStorage.setItem("mapbox_api_key", mapApiKey);
    }
  }, [mapApiKey]);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
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

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const applyFilters = () => {
    let filtered = [...experiences];

    // Geographic filter (20km radius)
    if (userLocation) {
      filtered = filtered.filter((exp) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          exp.locationLat,
          exp.locationLng
        );
        return distance <= 20; // 20km radius
      });
    }

    // Search query
    if (searchQuery) {
      filtered = filtered.filter(
        (exp) =>
          exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exp.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Category
    if (category !== "All Categories") {
      filtered = filtered.filter((exp) => exp.category === category);
    }

    // Price
    if (priceFilter === "free") {
      filtered = filtered.filter((exp) => !exp.price || exp.price === 0);
    } else if (priceFilter === "paid") {
      filtered = filtered.filter((exp) => exp.price && exp.price > 0);
    }

    setFilteredExperiences(filtered);
  };

  const handleCardClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setSelectedExperienceId(experience.id);
    setModalOpen(true);
  };

  const handleMarkerClick = (experienceId: string) => {
    const experience = experiences.find((exp) => exp.id === experienceId);
    if (experience) {
      setSelectedExperienceId(experienceId);
      
      // Switch to feed view and scroll to card
      setViewMode("feed");
      setTimeout(() => {
        cardRefs.current[experienceId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
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
    <div className="min-h-screen bg-background">
      <Navigation onCreateClick={() => setCreateModalOpen(true)} />
      <div className="container py-6 space-y-4">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          category={category}
          onCategoryChange={setCategory}
          priceFilter={priceFilter}
          onPriceFilterChange={setPriceFilter}
        />

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "feed" | "map")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6">
            {filteredExperiences.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No experiences found.</p>
                <p className="text-sm mt-2">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperiences.map((experience) => (
                  <div
                    key={experience.id}
                    ref={(el) => (cardRefs.current[experience.id] = el)}
                  >
                    <ExperienceCard
                      {...experience}
                      onClick={() => handleCardClick(experience)}
                      isSelected={selectedExperienceId === experience.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <div className="h-[calc(100vh-280px)] min-h-[400px] w-full">
              <MapView
                experiences={filteredExperiences}
                selectedExperienceId={selectedExperienceId}
                onMarkerClick={handleMarkerClick}
                apiKey={mapApiKey}
                onApiKeyChange={setMapApiKey}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ExperienceDetailModal
        experience={selectedExperience}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedExperienceId(null);
          }
        }}
        isEnrolled={selectedExperience ? enrolledIds.has(selectedExperience.id) : false}
        onEnrollmentChange={handleEnrollmentChange}
      />

      <CreateExperienceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={fetchExperiences}
      />
    </div>
  );
};

export default Index;
