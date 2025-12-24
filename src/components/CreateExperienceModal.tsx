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
import { Calendar, DollarSign, Users, Image } from "lucide-react";
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Experience</DialogTitle>
          <DialogDescription>
            Share an amazing experience with the community
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Sunset Yoga on the Beach"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your experience in detail..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="e.g., yoga, outdoor, sunset"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTimeStart" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Date & Time *
            </Label>
            <Input
              id="dateTimeStart"
              type="datetime-local"
              value={formData.dateTimeStart}
              onChange={(e) => handleChange("dateTimeStart", e.target.value)}
              required
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" />
                Price (leave empty for free)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                How many people are you looking for?
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
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating..." : "Create Experience"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExperienceModal;
