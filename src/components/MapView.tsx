import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Experience {
  id: string;
  title: string;
  locationLat: number;
  locationLng: number;
  category: string;
}

interface MapViewProps {
  experiences: Experience[];
  selectedExperienceId: string | null;
  onMarkerClick: (experienceId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const MapView = ({
  experiences,
  selectedExperienceId,
  onMarkerClick,
  userLocation,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Mapbox token from backend
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        
        if (error) {
          console.error("Error fetching Mapbox token:", error);
          setError("Failed to load map configuration");
          return;
        }

        if (data?.token) {
          setApiKey(data.token);
        } else {
          setError("Map token not configured");
        }
      } catch (err) {
        console.error("Error fetching Mapbox token:", err);
        setError("Failed to load map configuration");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !apiKey) return;

    mapboxgl.accessToken = apiKey;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-118.2437, 34.0522], // Los Angeles
        zoom: 11,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize map");
    }

    return () => {
      map.current?.remove();
    };
  }, [apiKey]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add markers for all experiences
    experiences.forEach((experience) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.cursor = "pointer";
      el.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23${
        selectedExperienceId === experience.id ? "f97316" : "0891b2"
      }' stroke='white' stroke-width='2'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3' fill='white'%3E%3C/circle%3E%3C/svg%3E")`;
      el.style.backgroundSize = "contain";

      el.addEventListener("click", () => {
        onMarkerClick(experience.id);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([experience.locationLng, experience.locationLat])
        .addTo(map.current!);

      markersRef.current[experience.id] = marker;
    });

    // Fit bounds to show all markers
    if (experiences.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      experiences.forEach((exp) => {
        bounds.extend([exp.locationLng, exp.locationLat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 13 });
    }
  }, [experiences, selectedExperienceId, onMarkerClick]);

  // Fly to selected experience
  useEffect(() => {
    if (!map.current || !selectedExperienceId) return;

    const experience = experiences.find((exp) => exp.id === selectedExperienceId);
    if (experience) {
      map.current.flyTo({
        center: [experience.locationLng, experience.locationLat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedExperienceId, experiences]);

  // Add user location marker (red pin)
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Create red pin for user location
    const el = document.createElement("div");
    el.className = "user-location-marker";
    el.style.width = "36px";
    el.style.height = "36px";
    el.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='%23ef4444' stroke='white' stroke-width='2'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3' fill='white'%3E%3C/circle%3E%3C/svg%3E")`;
    el.style.backgroundSize = "contain";
    el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);

    // Center map on user location initially if no experiences
    if (experiences.length === 0) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
        duration: 1000,
      });
    }

    return () => {
      userMarkerRef.current?.remove();
    };
  }, [userLocation, experiences.length]);

  if (loading) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1000,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to get your location");
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-4 right-4 shadow-lg"
        onClick={handleMyLocation}
        title="My Location"
      >
        <LocateFixed className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MapView;
