import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import ExperienceCard from "@/components/ExperienceCard";
import ExperienceDetailModal from "@/components/ExperienceDetailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Lock, Moon, Sun } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

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
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [activeEnrollments, setActiveEnrollments] = useState<Enrollment[]>([]);
  const [pastEnrollments, setPastEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string;
    avatar_url: string | null;
    interests: string[];
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, interests")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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
        {profile && (
          <Card className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold mb-2">
                  {profile.display_name || "Anonymous User"}
                </h2>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {profile.interests?.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Luggage</h1>
          <p className="text-muted-foreground">
            Manage your experiences and adventures
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="settings">
              Settings
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

          <TabsContent value="settings" className="mt-6">
            <div className="max-w-2xl space-y-6">
              {/* Change Password */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={updatingPassword}>
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Card>

              {/* Theme Toggle */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  Theme
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Current theme: {theme === "dark" ? "Dark" : "Light"}
                  </p>
                  <Button onClick={toggleTheme} variant="outline">
                    Switch to {theme === "dark" ? "Light" : "Dark"} Mode
                  </Button>
                </div>
              </Card>

              {/* Sign Out */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <LogOut className="w-5 h-5" />
                  Account
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Sign out of your account
                  </p>
                  <Button onClick={handleSignOut} variant="destructive">
                    Sign Out
                  </Button>
                </div>
              </Card>
            </div>
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
