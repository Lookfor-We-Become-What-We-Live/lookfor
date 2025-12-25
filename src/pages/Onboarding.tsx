import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Tag, Upload } from "lucide-react";

const INTEREST_OPTIONS = [
  "Wellness",
  "Art & Culture",
  "Food & Drink",
  "Outdoor & Adventure",
  "Music & Nightlife",
  "Community & Volunteering",
  "Creative Workshops",
  "Photography",
  "Sports",
  "Technology",
  "Travel",
  "Reading",
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else if (selectedInterests.length < 3) {
      setSelectedInterests([...selectedInterests, interest]);
    } else {
      toast.error("You can select up to 3 interests");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authLoading) {
      toast.error("Please wait a moment—finishing sign-in.");
      return;
    }

    if (!user) {
      toast.error(
        "Please confirm your email (if required) and sign in to finish setup."
      );
      navigate("/auth");
      return;
    }

    if (!displayName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    setSubmitting(true);
    try {
      let avatarUrl = null;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            display_name: displayName,
            interests: selectedInterests,
            avatar_url: avatarUrl,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      toast.success("Profile setup complete!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Lookfor! 🎉</h1>
          <p className="text-muted-foreground">
            Let's set up your profile to personalize your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar 
                className="w-24 h-24 cursor-pointer" 
                onClick={() => document.getElementById('avatar')?.click()}
              >
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Profile preview" />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <User className="w-12 h-12 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              <Label
                htmlFor="avatar"
                className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Upload className="w-4 h-4" />
                Upload Profile Picture
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Full Name *
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Your Interests (select up to 3) *
            </Label>
            <p className="text-sm text-muted-foreground">
              {selectedInterests.length}/3 selected
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Badge
                  key={interest}
                  variant={
                    selectedInterests.includes(interest)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || authLoading || !user}
          >
            {submitting ? "Setting up..." : authLoading ? "Loading..." : "Complete Setup"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Onboarding;
