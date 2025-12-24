import { Compass, Luggage, LogOut, User, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoImage from "@/assets/lookfor-logo.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NavigationProps {
  onCreateClick?: () => void;
}

const Navigation = ({ onCreateClick }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl">
          <img 
            src={logoImage} 
            alt="Lookfor Logo" 
            className="w-10 h-10 rounded-lg object-cover"
          />
          <span className="hidden sm:inline">Lookfor</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Explore</span>
            </Button>
          </Link>
          
          {onCreateClick && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onCreateClick}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          )}
          
          <Link to="/luggage">
            <Button
              variant={location.pathname === "/luggage" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Luggage className="w-4 h-4" />
              <span className="hidden sm:inline">Luggage</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
