import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { properties as propertiesAPI } from "@/lib/api";
import { Upload, X, Image as ImageIcon } from "lucide-react";

/* ---------------- Validation Schema ---------------- */
const propertySchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  location: z.string().min(3),
  area: z.string().min(3),
  price_per_month: z.number().positive(),
  property_type: z.enum(["single", "double", "triple", "shared"]),
  gender_preference: z.enum(["male", "female", "any"]),
  address: z.string().min(10),
  contact_phone: z.string().min(10),
  contact_email: z.string().email().optional(),
});

const ListProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ---------------- Form State ---------------- */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [propertyType, setPropertyType] = useState("single");
  const [genderPreference, setGenderPreference] = useState("any");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [amenities, setAmenities] = useState("");
  const [rules, setRules] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  /* ---------------- Image Handling ---------------- */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + selectedImages.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    // Add new files to existing ones
    setSelectedImages(prev => [...prev, ...files]);

    // Create previews for new files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const propertyData = {
        title,
        description,
        location,
        area,
        price_per_month: parseFloat(price),
        property_type: propertyType,
        gender_preference: genderPreference,
        address,
        contact_phone: contactPhone,
        contact_email: contactEmail || undefined,
      };

      /* Validate basic fields */
      propertySchema.parse(propertyData);

      setLoading(true);

      /* Create FormData for image upload */
      const formData = new FormData();

      // Add all property fields to FormData
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("area", area);
      formData.append("price_per_month", price);
      formData.append("property_type", propertyType);
      formData.append("gender_preference", genderPreference);
      formData.append("address", address);
      formData.append("contact_phone", contactPhone);
      if (contactEmail) formData.append("contact_email", contactEmail);
      if (availableFrom) formData.append("available_from", availableFrom);
      if (rules) formData.append("rules", rules);

      // Add amenities as JSON array
      const amenitiesArray = amenities
        .split(",")
        .map(a => a.trim())
        .filter(Boolean);
      formData.append("amenities", JSON.stringify(amenitiesArray));

      // Add images
      selectedImages.forEach((image) => {
        formData.append("images", image);
      });

      /* 🔥 SEND TO BACKEND 🔥 */
      await propertiesAPI.create(formData);

      toast.success("Property listed successfully ✅");

      /* Reset form */
      setTitle("");
      setDescription("");
      setLocation("");
      setArea("");
      setPrice("");
      setPropertyType("single");
      setGenderPreference("any");
      setAddress("");
      setContactPhone("");
      setContactEmail("");
      setAmenities("");
      setRules("");
      setAvailableFrom("");
      setSelectedImages([]);
      setImagePreviews([]);

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error listing property:", error);
        toast.error(error.message || "Error listing property ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>List Your Property</CardTitle>
            <CardDescription>
              Fill in the details to list your PG accommodation
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Comfortable PG near Metro"
                    required
                  />
                </div>

                <div>
                  <Label>Location (City) *</Label>
                  <Input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g., Bengaluru"
                    required
                  />
                </div>

                <div>
                  <Label>Area *</Label>
                  <Input
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g., Koramangala"
                    required
                  />
                </div>

                <div>
                  <Label>Price / Month (₹) *</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="e.g., 8000"
                    required
                  />
                </div>

                <div>
                  <Label>Room Type *</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Gender Preference *</Label>
                  <Select value={genderPreference} onValueChange={setGenderPreference}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Contact Phone *</Label>
                  <Input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                  />
                </div>

                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="owner@example.com"
                  />
                </div>

                <div>
                  <Label>Available From</Label>
                  <Input
                    type="date"
                    value={availableFrom}
                    onChange={e => setAvailableFrom(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your property..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label>Full Address *</Label>
                <Textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Complete address with landmarks"
                  rows={2}
                  required
                />
              </div>

              <div>
                <Label>Amenities (comma-separated)</Label>
                <Input
                  value={amenities}
                  onChange={e => setAmenities(e.target.value)}
                  placeholder="e.g., WiFi, AC, Food, Laundry"
                />
              </div>

              <div>
                <Label>House Rules</Label>
                <Textarea
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  placeholder="Any specific rules for tenants..."
                  rows={2}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label>Property Images (Max 10)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" className="cursor-pointer" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
                      </span>
                    </Button>
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {selectedImages.length} image(s) selected
                  </span>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Thumbnail
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {imagePreviews.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No images uploaded yet</p>
                    <p className="text-xs">Upload property images to attract more tenants</p>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Submitting..." : "List Property"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ListProperty;
