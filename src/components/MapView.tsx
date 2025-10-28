import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const MapView = ({
  experiences,
  selectedExperienceId,
  onMarkerClick,
  apiKey,
  onApiKeyChange,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);

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

      setShowKeyInput(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      setShowKeyInput(true);
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

  if (showKeyInput) {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Mapbox API Key Required</h3>
          <p className="text-sm text-muted-foreground">
            Get your free public token from{" "}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
        <Input
          type="text"
          placeholder="pk.eyJ1..."
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="max-w-md"
        />
      </Card>
    );
  }

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />;
};

export default MapView;
