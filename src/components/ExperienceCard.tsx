import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getCategoryImage } from "@/lib/categoryImages";
import { formatAddress } from "@/lib/formatAddress";

interface ExperienceCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  dateTimeStart: string;
  locationAddress: string;
  price?: number;
  capacity?: number;
  onClick: () => void;
  isSelected?: boolean;
  isJoined?: boolean;
  hideCategory?: boolean;
}

const ExperienceCard = ({
  title,
  description,
  category,
  imageUrl,
  dateTimeStart,
  locationAddress,
  price,
  capacity,
  onClick,
  isSelected,
  isJoined,
  hideCategory,
}: ExperienceCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-[var(--shadow-card-hover)] active:scale-[0.98] ${
        isSelected ? "ring-2 ring-primary shadow-[var(--shadow-card-hover)]" : "shadow-[var(--shadow-card)]"
      }`}
    >
      <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-t-lg">
        <img
          src={imageUrl || getCategoryImage(category)}
          alt={title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1.5 sm:gap-2 flex-wrap">
          {!hideCategory && (
            <Badge className="bg-white/90 dark:bg-slate-700 text-foreground dark:text-white hover:bg-white dark:hover:bg-slate-600 text-xs">
              {category}
            </Badge>
          )}
          {isJoined && (
            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
              Joined
            </Badge>
          )}
        </div>
        {price !== null && price !== undefined && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <Badge className="bg-primary text-primary-foreground text-xs">
              {price === 0 ? "Free" : `$${price}`}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
        <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{description}</p>
        <div className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="truncate">{format(new Date(dateTimeStart), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
            <span className="line-clamp-1">{formatAddress(locationAddress)}</span>
          </div>
          {capacity && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
              <span>Up to {capacity} people</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceCard;
