import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Search } from "lucide-react";

type PropertyFiltersProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  propertyType: string;
  setPropertyType: (value: string) => void;
  genderPreference: string;
  setGenderPreference: (value: string) => void;
  selectedFacilities: string[];
  setSelectedFacilities: (value: string[]) => void;
};

const facilities = [
  "WiFi",
  "AC",
  "Laundry",
  "TV",
  "Parking",
  "Security",
  "Meals",
  "Power Backup",
  "Gym",
  "Housekeeping",
];

const PropertyFilters = ({
  searchTerm,
  setSearchTerm,
  priceRange,
  setPriceRange,
  propertyType,
  setPropertyType,
  genderPreference,
  setGenderPreference,
  selectedFacilities,
  setSelectedFacilities,
}: PropertyFiltersProps) => {
  const handleFacilityChange = (facility: string, checked: boolean) => {
    if (checked) {
      setSelectedFacilities([...selectedFacilities, facility]);
    } else {
      setSelectedFacilities(selectedFacilities.filter((f) => f !== facility));
    }
  };

  return (
    <div className="bg-card rounded-lg border p-6 space-y-6 sticky top-4">
      <h2 className="text-xl font-semibold">Filters</h2>

      {/* Rent Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Rent Range (₹/month)</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={50000}
          min={0}
          step={1000}
          className="mt-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0].toLocaleString()}</span>
          <span>₹{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Locality Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Locality</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Property Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Property Type</Label>
        <RadioGroup value={propertyType} onValueChange={setPropertyType}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="type-all" />
            <Label htmlFor="type-all" className="font-normal cursor-pointer">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single" id="type-single" />
            <Label htmlFor="type-single" className="font-normal cursor-pointer">Single</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="double" id="type-double" />
            <Label htmlFor="type-double" className="font-normal cursor-pointer">Double</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="triple" id="type-triple" />
            <Label htmlFor="type-triple" className="font-normal cursor-pointer">Triple</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="shared" id="type-shared" />
            <Label htmlFor="type-shared" className="font-normal cursor-pointer">Dormitory</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Gender Preference */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Gender Preference</Label>
        <RadioGroup value={genderPreference} onValueChange={setGenderPreference}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="gender-all" />
            <Label htmlFor="gender-all" className="font-normal cursor-pointer">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="gender-male" />
            <Label htmlFor="gender-male" className="font-normal cursor-pointer">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="gender-female" />
            <Label htmlFor="gender-female" className="font-normal cursor-pointer">Female</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any" id="gender-any" />
            <Label htmlFor="gender-any" className="font-normal cursor-pointer">Any</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Facilities */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Facilities</Label>
        <div className="space-y-2">
          {facilities.map((facility) => (
            <div key={facility} className="flex items-center space-x-2">
              <Checkbox
                id={`facility-${facility}`}
                checked={selectedFacilities.includes(facility)}
                onCheckedChange={(checked) =>
                  handleFacilityChange(facility, checked as boolean)
                }
              />
              <Label
                htmlFor={`facility-${facility}`}
                className="font-normal cursor-pointer"
              >
                {facility}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyFilters;
