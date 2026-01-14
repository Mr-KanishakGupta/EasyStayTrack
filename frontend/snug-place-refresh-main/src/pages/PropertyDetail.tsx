import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Header from "@/components/Header";
import { properties as propertiesAPI, bookings as bookingsAPI, auth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, IndianRupee, Users, Phone, Mail, CalendarIcon, Home, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";


type Property = {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  location: string;
  area: string;
  address: string;
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
  rules: string;
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date>();
  const [duration, setDuration] = useState("1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [contactInfo, setContactInfo] = useState<{ contact_phone: string; contact_email: string } | null>(null);

  useEffect(() => {
    const currentUser = auth.getUser();
    setUser(currentUser as any);
  }, []);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const data = await propertiesAPI.getById(id!);
      setProperty(data);

      // Contact info is included in property data from MongoDB
      if (data && user) {
        setContactInfo({
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
        });
      }
    } catch (error) {
      toast.error("Error loading property details");
    } finally {
      setLoading(false);
    }
  };

  // Refetch contact info when user logs in
  useEffect(() => {
    if (user && property) {
      setContactInfo({
        contact_phone: property.contact_phone,
        contact_email: property.contact_email,
      });
    }
  }, [user, property]);

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please login to book this PG");
      navigate("/auth");
      return;
    }

    if (!property) return;

    if (!bookingDate) {
      toast.error("Please select a booking date");
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setBookingLoading(true);
    try {
      const user = auth.getUser();
      await bookingsAPI.create({
        property_id: property._id || property.id!,
        message: bookingMessage || undefined,
        booking_date: format(bookingDate, "yyyy-MM-dd"),
        duration: parseInt(duration),
        phone: phoneNumber,
        special_requests: specialRequests || undefined,
      });

      toast.success("Booking request sent successfully!");
      setDialogOpen(false);
      setBookingMessage("");
      setBookingDate(undefined);
      setDuration("1");
      setPhoneNumber("");
      setSpecialRequests("");
    } catch (error: any) {
      toast.error(error.message || "Error sending booking request");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <p className="text-muted-foreground text-center">Loading property details...</p>
        </main>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Property not found</p>
            <Button onClick={() => navigate("/find-pgs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/find-pgs")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Carousel */}
            <div className="rounded-lg overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {property.images.map((image, index) => (
                      <CarouselItem key={image._id || index}>
                        <div className="relative h-[400px]">
                          <img
                            src={image.url}
                            alt={`${property.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
                            }}
                          />
                          {property.images.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                              {index + 1} / {property.images.length}
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {property.images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="h-[400px]">
                  <img
                    src={property.thumbnail_image || property.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{property.address}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant="secondary" className="text-sm py-1 px-3">
                <Users className="h-4 w-4 mr-1" />
                {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)} Sharing
              </Badge>
              <Badge
                variant={property.gender_preference === "male" ? "default" : property.gender_preference === "female" ? "secondary" : "outline"}
                className="text-sm py-1 px-3"
              >
                <Shield className="h-4 w-4 mr-1" />
                {property.gender_preference.charAt(0).toUpperCase() + property.gender_preference.slice(1)} Only
              </Badge>
              {property.available_from && !isNaN(new Date(property.available_from).getTime()) && (
                <Badge variant="outline" className="text-sm py-1 px-3">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Available from {new Date(property.available_from).toLocaleDateString()}
                </Badge>
              )}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this PG</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                      >
                        <Home className="h-4 w-4 text-primary" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rules */}
            {property.rules && (
              <Card>
                <CardHeader>
                  <CardTitle>House Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">{property.rules}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center text-3xl font-bold text-primary">
                  <IndianRupee className="h-7 w-7" />
                  <span>{property.price_per_month.toLocaleString()}</span>
                  <span className="text-base font-normal text-muted-foreground ml-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 border-b pb-4">
                  <h3 className="font-semibold">Contact Owner</h3>
                  <div className="flex items-center gap-2">
                    {contactInfo ? (
                      <>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${contactInfo.contact_phone}`} className="hover:underline">
                          {contactInfo.contact_phone}
                        </a>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Login to view contact</span>
                    )}
                  </div>
                  {contactInfo?.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${contactInfo.contact_email}`} className="hover:underline text-sm">
                        {contactInfo.contact_email}
                      </a>
                    </div>
                  )}
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      Book Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Send Booking Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">
                          You're requesting to book: <strong>{property.title}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rent: <strong>₹{property.price_per_month.toLocaleString()}/month</strong>
                        </p>
                      </div>

                      {/* Booking Date */}
                      <div className="space-y-2">
                        <Label>Booking Date *</Label>
                        <Input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingDate ? format(bookingDate, "yyyy-MM-dd") : ""}
                          onChange={(e) => setBookingDate(e.target.value ? new Date(e.target.value) : undefined)}
                          className="w-full"
                        />
                      </div>

                      {/* Duration */}
                      <div className="space-y-2">
                        <Label>Duration (months)</Label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 6, 12].map((m) => (
                              <SelectItem key={m} value={m.toString()}>
                                {m} {m === 1 ? "month" : "months"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-2">
                        <Label>Phone Number *</Label>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>

                      {/* Special Requests */}
                      <div className="space-y-2">
                        <Label>Special Requests (optional)</Label>
                        <Textarea
                          placeholder="Any special requirements or requests..."
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          rows={2}
                        />
                      </div>

                      {/* Message to Owner */}
                      <div className="space-y-2">
                        <Label>Message to owner (optional)</Label>
                        <Textarea
                          placeholder="Introduce yourself or ask any questions..."
                          value={bookingMessage}
                          onChange={(e) => setBookingMessage(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleBooking}
                        disabled={bookingLoading}
                      >
                        {bookingLoading ? "Sending..." : "Send Booking Request"}
                      </Button>
                      {!user && (
                        <p className="text-sm text-muted-foreground text-center">
                          You'll need to login to complete the booking
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {contactInfo ? (
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = `tel:${contactInfo.contact_phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                    <Phone className="mr-2 h-4 w-4" />
                    Login to Call
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;
