import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  value: string;
}

const GooglePlacesAutocomplete = ({
  onPlaceSelect,
  value,
}: GooglePlacesAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Using OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching places:", error);
      toast.error("Failed to search locations");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    searchPlaces(newValue);
  };

  const handlePlaceSelect = (place: any) => {
    const address = place.display_name;
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    setInputValue(address);
    onPlaceSelect({ address, lat, lng });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="location" className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-secondary" />
        Location *
      </Label>
      <Input
        id="location"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Start typing a location..."
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
              onClick={() => handlePlaceSelect(place)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
                <span className="text-sm">{place.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
