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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavigationProps {
  onCreateClick?: () => void;
}

const Navigation = ({ onCreateClick }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl">
          <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
            <Compass className="w-5 h-5 text-white" />
          </div>
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
