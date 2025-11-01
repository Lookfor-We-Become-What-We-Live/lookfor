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
}: ExperienceCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-[var(--shadow-card-hover)] ${
        isSelected ? "ring-2 ring-primary shadow-[var(--shadow-card-hover)]" : "shadow-[var(--shadow-card)]"
      }`}
    >
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        <img
          src={imageUrl || getCategoryImage(category)}
          alt={title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/90 text-foreground hover:bg-white">
            {category}
          </Badge>
        </div>
        {price !== null && price !== undefined && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground">
              {price === 0 ? "Free" : `$${price}`}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="pt-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{format(new Date(dateTimeStart), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-secondary" />
            <span className="line-clamp-1">{formatAddress(locationAddress)}</span>
          </div>
          {capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span>Up to {capacity} people</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceCard;
