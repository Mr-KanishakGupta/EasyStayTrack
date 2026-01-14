import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { bookings as bookingsAPI, auth } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, IndianRupee, Clock, CheckCircle, XCircle, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Booking = {
  id: string;
  booking_date: string | null;
  duration: number | null;
  status: string | null;
  message: string | null;
  special_requests: string | null;
  phone: string | null;
  created_at: string;
  property_id?: {
    _id: string;
    title: string;
    area: string;
    location: string;
    price_per_month: number;
    thumbnail_image?: string;
    contact_phone: string;
  };
  property?: {
    id?: string;
    _id?: string;
    title: string;
    area: string;
    location: string;
    price_per_month: number;
    image_url: string | null;
    thumbnail_image?: string;
    contact_phone: string;
  } | null;
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.getUser();
    if (!currentUser) {
      toast.error("Please login to view your bookings");
      navigate("/auth");
    } else {
      setUserId(currentUser.id);
      fetchBookings(currentUser.id);
    }
  }, [navigate]);

  const fetchBookings = async (currentUserId: string) => {
    try {
      const data = await bookingsAPI.getAll({ user_id: currentUserId });
      setBookings(data as any);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <p className="text-center text-muted-foreground">Loading your bookings...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">
            Track the status of your PG booking requests
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't made any booking requests yet. Start exploring PGs!
              </p>
              <Button onClick={() => navigate("/find-pgs")}>
                Find PGs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              // Get property from either property_id or property field
              const property = booking.property_id || booking.property;
              const propertyId = property ? ('_id' in property ? property._id : property.id) : undefined;

              return (
                <Card key={booking.id} className="overflow-hidden">
                  {property?.thumbnail_image && (
                    <img
                      src={property.thumbnail_image}
                      alt={property.title}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400";
                      }}
                    />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">
                        {property?.title || "Property"}
                      </CardTitle>
                      {getStatusBadge(booking.status)}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property?.area}, {property?.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ₹{property?.price_per_month?.toLocaleString()}/mo
                        </span>
                      </div>
                      {booking.duration && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{booking.duration} month{booking.duration > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>

                    {booking.booking_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Move-in: {booking.booking_date && !isNaN(new Date(booking.booking_date).getTime()) ? format(new Date(booking.booking_date), "MMM dd, yyyy") : "TBD"}</span>
                      </div>
                    )}

                    {booking.message && (
                      <div className="text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        "{booking.message}"
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Requested on {booking.created_at && !isNaN(new Date(booking.created_at).getTime()) ? format(new Date(booking.created_at), "MMM dd, yyyy") : "Recently"}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => propertyId && navigate(`/property/${propertyId}`)}
                        disabled={!propertyId}
                      >
                        View Property
                      </Button>
                      {booking.status === "confirmed" && property?.contact_phone && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => window.location.href = `tel:${property?.contact_phone}`}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call Owner
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookings;