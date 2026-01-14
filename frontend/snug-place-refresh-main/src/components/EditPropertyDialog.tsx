import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { z } from "zod";
import { properties } from "@/lib/api";
import { Upload, Trash2, Star } from "lucide-react";

const propertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  location: z.string().min(3, "Location is required"),
  area: z.string().min(3, "Area is required"),
  price_per_month: z.number().positive("Price must be a positive number"),
  property_type: z.enum(["single", "double", "triple", "shared"]),
  gender_preference: z.enum(["male", "female", "any"]),
  address: z.string().min(10, "Full address is required"),
  contact_phone: z.string().min(10, "Valid phone number is required"),
});

type PropertyImage = {
  _id: string;
  url: string;
  public_id: string;
  is_thumbnail: boolean;
};

type Property = {
  id: string;
  _id?: string;
  title: string;
  description: string | null;
  location: string;
  area: string;
  price_per_month: number;
  property_type: string;
  gender_preference: string;
  address: string;
  contact_phone: string;
  contact_email: string | null;
  amenities: string[] | null;
  rules: string | null;
  image_url: string | null;
  images?: PropertyImage[];
  thumbnail_image?: string | null;
  available_from: string | null;
  is_available: boolean | null;
};

interface EditPropertyDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditPropertyDialog = ({ property, open, onOpenChange, onSuccess }: EditPropertyDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [isAvailable, setIsAvailable] = useState(true);
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);

  useEffect(() => {
    if (property) {
      setTitle(property.title || "");
      setDescription(property.description || "");
      setLocation(property.location || "");
      setArea(property.area || "");
      setPrice(property.price_per_month?.toString() || "");
      setPropertyType(property.property_type || "single");
      setGenderPreference(property.gender_preference || "any");
      setAddress(property.address || "");
      setContactPhone(property.contact_phone || "");
      setContactEmail(property.contact_email || "");
      setAmenities(property.amenities?.join(", ") || "");
      setRules(property.rules || "");
      setAvailableFrom(property.available_from || "");
      setIsAvailable(property.is_available ?? true);
      setPropertyImages(property.images || []);
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!property) return;

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
      };

      propertySchema.parse(propertyData);

      setLoading(true);

      const amenitiesArray = amenities
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      await properties.update(property.id || property._id!, {
        ...propertyData,
        contact_email: contactEmail || undefined,
        amenities: amenitiesArray,
        rules: rules || undefined,
        available_from: availableFrom || undefined,
        is_available: isAvailable,
      });

      toast.success("Property updated successfully!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Error updating property. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !property) return;

    if (propertyImages.length + files.length > 10) {
      toast.error("Maximum 10 images allowed per property");
      return;
    }

    setImageLoading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("images", file);
      });

      const response = await properties.addImages(property.id || property._id!, formData);
      setPropertyImages(response.property.images);
      toast.success("Images uploaded successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload images");
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!property) return;

    try {
      setImageLoading(true);
      const response = await properties.deleteImage(property.id || property._id!, imageId);
      setPropertyImages(response.property.images);
      toast.success("Image deleted successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSetThumbnail = async (imageId: string) => {
    if (!property) return;

    try {
      setImageLoading(true);
      const response = await properties.setThumbnail(property.id || property._id!, imageId);
      setPropertyImages(response.property.images);
      toast.success("Thumbnail updated successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to set thumbnail");
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Update your property details and manage images
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Images Section */}
          <div className="space-y-3 border-b pb-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Property Images</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="edit-image-upload"
                />
                <label htmlFor="edit-image-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={imageLoading}
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Add Images
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {propertyImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {propertyImages.map((image) => (
                  <div key={image._id} className="relative group">
                    <img
                      src={image.url}
                      alt="Property"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <div className="absolute top-1 right-1 flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={image.is_thumbnail ? "default" : "secondary"}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleSetThumbnail(image._id)}
                        disabled={imageLoading}
                        title="Set as thumbnail"
                      >
                        <Star className="h-3 w-3" fill={image.is_thumbnail ? "currentColor" : "none"} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(image._id)}
                        disabled={imageLoading}
                        title="Delete image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {image.is_thumbnail && (
                      <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                        Thumbnail
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm">
                <p>No images uploaded yet. Add images to showcase your property.</p>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Property Title *</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Comfortable PG near Metro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">City/Location *</Label>
              <Input
                id="edit-location"
                placeholder="e.g., Bengaluru"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-area">Area *</Label>
              <Input
                id="edit-area"
                placeholder="e.g., Koramangala"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price per Month (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                placeholder="e.g., 8000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-property-type">Room Type *</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="edit-property-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="triple">Triple</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-gender">Gender Preference *</Label>
              <Select value={genderPreference} onValueChange={setGenderPreference}>
                <SelectTrigger id="edit-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact-phone">Contact Phone *</Label>
              <Input
                id="edit-contact-phone"
                type="tel"
                placeholder="9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact-email">Contact Email</Label>
              <Input
                id="edit-contact-email"
                type="email"
                placeholder="owner@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-available-from">Available From</Label>
              <Input
                id="edit-available-from"
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-is-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="edit-is-available">Property is available for booking</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              placeholder="Describe your property..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Full Address *</Label>
            <Textarea
              id="edit-address"
              placeholder="Complete address with landmarks"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amenities">Amenities (comma-separated)</Label>
            <Input
              id="edit-amenities"
              placeholder="e.g., WiFi, AC, Food, Laundry"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-rules">House Rules</Label>
            <Textarea
              id="edit-rules"
              placeholder="Any specific rules for tenants..."
              rows={2}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPropertyDialog;
