import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import PropertyFilters from "@/components/PropertyFilters";
import PropertyCard from "@/components/PropertyCard";
import { properties as propertiesAPI } from "@/lib/api";
import { toast } from "sonner";

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

const FindPGs = () => {
  const [searchParams] = useSearchParams();
  const areaFromUrl = searchParams.get("area") || "";

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(areaFromUrl);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [propertyType, setPropertyType] = useState("all");
  const [genderPreference, setGenderPreference] = useState("all");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    setSearchTerm(areaFromUrl);
  }, [areaFromUrl]);

  const fetchProperties = async () => {
    try {
      const data = await propertiesAPI.getAll();
      setProperties(data || []);
    } catch (error) {
      toast.error("Error loading properties");
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.area.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrice =
      property.price_per_month >= priceRange[0] &&
      property.price_per_month <= priceRange[1];

    const matchesType =
      propertyType === "all" || property.property_type === propertyType;

    const matchesGender =
      genderPreference === "all" || property.gender_preference === genderPreference;

    const matchesFacilities =
      selectedFacilities.length === 0 ||
      selectedFacilities.every((facility) =>
        property.amenities?.includes(facility)
      );

    return matchesSearch && matchesPrice && matchesType && matchesGender && matchesFacilities;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Your Perfect PG</h1>
          <p className="text-muted-foreground">
            Browse through our extensive collection of paying guest accommodations in Bengaluru
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <PropertyFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              propertyType={propertyType}
              setPropertyType={setPropertyType}
              genderPreference={genderPreference}
              setGenderPreference={setGenderPreference}
              selectedFacilities={selectedFacilities}
              setSelectedFacilities={setSelectedFacilities}
            />
          </div>

          {/* Properties Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProperties.length} of {properties.length} properties
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading properties...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No properties found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FindPGs;
