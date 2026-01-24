import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, DollarSign, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import GooglePlacesAutocomplete from "./GooglePlacesAutocomplete";

interface CreateExperienceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const categories = [
  "Wellness",
  "Art & Culture",
  "Food & Drink",
  "Outdoor & Adventure",
  "Music & Nightlife",
  "Community & Volunteering",
  "Creative Workshops",
  "Photography",
];

const CreateExperienceModal = ({
  open,
  onOpenChange,
  onCreated,
}: CreateExperienceModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: categories[0],
    tags: "",
    dateTimeStart: "",
    locationAddress: "",
    locationLat: "",
    locationLng: "",
    price: "",
    capacity: "",
    imageUrl: "",
  });

  const currencies = [
    { code: "USD", symbol: "$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "JPY", symbol: "¥" },
    { code: "CAD", symbol: "C$" },
    { code: "AUD", symbol: "A$" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in to create experiences");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("experiences").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        date_time_start: formData.dateTimeStart,
        location_address: formData.locationAddress,
        location_lat: parseFloat(formData.locationLat),
        location_lng: parseFloat(formData.locationLng),
        price: formData.price ? Math.max(0, parseFloat(formData.price)) : null,
        capacity: formData.capacity ? Math.max(0, parseInt(formData.capacity.split("-").pop()!.trim())) : null,
        image_url: formData.imageUrl || null,
        host_user_id: user.id,
      });

      if (error) throw error;

      toast.success("Experience created successfully!");
      onCreated();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: categories[0],
        tags: "",
        dateTimeStart: "",
        locationAddress: "",
        locationLat: "",
        locationLng: "",
        price: "",
        capacity: "",
        imageUrl: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create experience");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Create New Experience</DialogTitle>
          <DialogDescription className="text-sm">
            Share an amazing experience with the community
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 sm:pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Sunset Yoga on the Beach"
              maxLength={200}
              required
              className="h-11 sm:h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your experience in detail..."
              rows={3}
              maxLength={5000}
              required
              className="text-base sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger className="h-11 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="e.g., yoga, outdoor, sunset"
                maxLength={500}
                className="h-11 sm:h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTimeStart" className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              Date & Time *
            </Label>
            <Input
              id="dateTimeStart"
              type="datetime-local"
              value={formData.dateTimeStart}
              onChange={(e) => handleChange("dateTimeStart", e.target.value)}
              required
              className="h-11 sm:h-10"
            />
          </div>

          <GooglePlacesAutocomplete
            value={formData.locationAddress}
            onPlaceSelect={(place) => {
              setFormData((prev) => ({
                ...prev,
                locationAddress: place.address,
                locationLat: place.lat.toString(),
                locationLng: place.lng.toString(),
              }));
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-accent" />
                Price (leave empty for free)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="price"
                  type="text"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow numbers, spaces, and "-" for range format "10 - 15"
                    if (value === "" || /^[0-9]+(\.[0-9]{0,2})?(\s*-\s*[0-9]*(\.[0-9]{0,2})?)?$/.test(value)) {
                      handleChange("price", value);
                    }
                  }}
                  placeholder="e.g., 10 or 10 - 15"
                  className="flex-1 h-11 sm:h-10"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="shrink-0 h-11 w-11 sm:h-10 sm:w-10">
                      {currencies.find(c => c.code === currency)?.symbol || "$"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-1">
                    <div className="flex flex-col">
                      {currencies.map((c) => (
                        <Button
                          key={c.code}
                          type="button"
                          variant={currency === c.code ? "secondary" : "ghost"}
                          size="sm"
                          className="justify-start"
                          onClick={() => setCurrency(c.code)}
                        >
                          {c.symbol} {c.code}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity" className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-accent" />
                How many people?
              </Label>
              <Input
                id="capacity"
                type="text"
                value={formData.capacity}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow typing numbers, spaces, and "-" for range format "X - Y"
                  if (value === "" || /^[0-9]+[\s\-]*[0-9]*$/.test(value)) {
                    handleChange("capacity", value);
                  }
                }}
                placeholder="e.g., 5 or 3 - 5"
                className="h-11 sm:h-10"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 sm:h-10"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-11 sm:h-10" disabled={loading}>
              {loading ? "Creating..." : "Create Experience"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExperienceModal;
