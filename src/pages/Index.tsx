import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import ExperienceCard from "@/components/ExperienceCard";
import ExperienceDetailModal from "@/components/ExperienceDetailModal";
import CreateExperienceModal from "@/components/CreateExperienceModal";
import MapView from "@/components/MapView";
import SearchBar from "@/components/SearchBar";

import { Loader2, Search, MapPin, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/lookfor-logo.jpg";

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

type ActiveTab = "what" | "where" | "when" | null;

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
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  
  // Search filters
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [priceFilter, setPriceFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
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
  }, [experiences, searchQuery, category, priceFilter, userLocation, selectedDate, selectedTime]);

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

    // Geographic filter
    if (userLocation && activeTab === "where") {
      const nearbyExperiences = filtered.filter((exp) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          exp.locationLat,
          exp.locationLng
        );
        return distance <= 20;
      });
      if (nearbyExperiences.length > 0) {
        filtered = nearbyExperiences;
      }
    }

    // Search query (for WHAT tab)
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

    // Date filter (for WHEN tab)
    if (selectedDate) {
      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.dateTimeStart);
        return (
          expDate.getFullYear() === selectedDate.getFullYear() &&
          expDate.getMonth() === selectedDate.getMonth() &&
          expDate.getDate() === selectedDate.getDate()
        );
      });
    }

    // Time filter
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.dateTimeStart);
        const expHours = expDate.getHours();
        // Filter experiences within 2 hours of selected time
        return Math.abs(expHours - hours) <= 2;
      });
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
      setTimeout(() => {
        cardRefs.current[experienceId]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  };

  const handleEnrollmentChange = () => {
    fetchEnrollments();
    setModalOpen(false);
  };

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("All Categories");
    setPriceFilter("all");
    setSelectedDate(undefined);
    setSelectedTime("");
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
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xl">
            <img 
              src={logoImage} 
              alt="Lookfor Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <span className="hidden sm:inline">Lookfor</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-6 flex-1">
        {/* Three Main Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            variant={activeTab === "what" ? "default" : "outline"}
            className={cn(
              "flex-1 h-14 text-lg font-semibold",
              activeTab === "what" && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleTabClick("what")}
          >
            <Search className="w-5 h-5 mr-2" />
            WHAT
          </Button>
          <Button
            variant={activeTab === "where" ? "default" : "outline"}
            className={cn(
              "flex-1 h-14 text-lg font-semibold",
              activeTab === "where" && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleTabClick("where")}
          >
            <MapPin className="w-5 h-5 mr-2" />
            WHERE
          </Button>
          <Button
            variant={activeTab === "when" ? "default" : "outline"}
            className={cn(
              "flex-1 h-14 text-lg font-semibold",
              activeTab === "when" && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleTabClick("when")}
          >
            <Calendar className="w-5 h-5 mr-2" />
            WHEN
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "what" && (
          <div className="space-y-4 mb-6 animate-fade-in">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              category={category}
              onCategoryChange={setCategory}
              priceFilter={priceFilter}
              onPriceFilterChange={setPriceFilter}
            />
          </div>
        )}

        {activeTab === "where" && (
          <div className="space-y-4 mb-6 animate-fade-in">
            <div style={{ height: "50vh", minHeight: "350px" }} className="w-full rounded-lg overflow-hidden">
              <MapView
                experiences={experiences.filter(exp => exp.locationLat && exp.locationLng)}
                selectedExperienceId={selectedExperienceId}
                onMarkerClick={handleMarkerClick}
                userLocation={userLocation}
              />
            </div>
          </div>
        )}

        {activeTab === "when" && (
          <div className="space-y-4 mb-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-card rounded-lg border p-4">
              <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md pointer-events-auto"
                />
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <label className="text-sm font-medium">Time (optional)</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {(selectedDate || selectedTime) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {activeTab && (
          <div className="mt-6">
            {/* Show results only when user has actively searched */}
            {((activeTab === "what" && searchQuery) ||
              (activeTab === "when" && (selectedDate || selectedTime))) ? (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {filteredExperiences.length} Experience{filteredExperiences.length !== 1 ? "s" : ""} Found
                </h2>
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
                          isJoined={enrolledIds.has(experience.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : activeTab !== "where" ? (
              // Show logo and tagline when no active search (except WHERE tab)
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <img 
                  src={logoImage} 
                  alt="Lookfor Logo" 
                  className="w-20 h-20 rounded-2xl object-cover mb-4"
                />
                <h2 className="text-xl font-bold mb-2">Lookfor</h2>
                <p className="text-muted-foreground max-w-md">
                  We are the experiences that we live.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Welcome Message when no tab selected */}
        {!activeTab && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <img 
              src={logoImage} 
              alt="Lookfor Logo" 
              className="w-24 h-24 rounded-2xl object-cover mb-6"
            />
            <h2 className="text-2xl font-bold mb-2">Lookfor</h2>
            <p className="text-muted-foreground max-w-md">
              We are the experiences that we live.
            </p>
          </div>
        )}
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

      <BottomNav />
    </div>
  );
};

export default Index;
