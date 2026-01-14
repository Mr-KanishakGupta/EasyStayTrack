import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, IndianRupee, Users } from "lucide-react";

type Property = {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  location: string;
  area: string;
  price_per_month: number;
  property_type: string;
  gender_preference: string;
  amenities: string[];
  contact_phone: string;
  contact_email: string;
  image_url?: string;
  thumbnail_image?: string;
  images?: { url: string; public_id: string; is_thumbnail: boolean; _id: string }[];
  available_from: string;
};

type PropertyCardProps = {
  property: Property;
};

const PropertyCard = ({ property }: PropertyCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-48 overflow-hidden relative">
        <img
          src={property.thumbnail_image || property.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
          }}
        />
        <Badge
          className="absolute top-3 right-3"
          variant={property.gender_preference === "male" ? "default" : property.gender_preference === "female" ? "secondary" : "outline"}
        >
          {property.gender_preference.charAt(0).toUpperCase() + property.gender_preference.slice(1)}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-lg">{property.title}</CardTitle>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{property.area}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="line-clamp-2">{property.description}</CardDescription>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            <Users className="h-3 w-3 mr-1" />
            {property.property_type} Sharing
          </Badge>
        </div>

        <div className="flex items-center text-xl font-bold text-primary">
          <IndianRupee className="h-5 w-5" />
          <span>{property.price_per_month.toLocaleString()}</span>
          <span className="text-sm font-normal text-muted-foreground ml-1">per month</span>
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {property.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{property.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <Button className="w-full" onClick={() => navigate(`/property/${property._id || property.id}`)}>View Details</Button>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
