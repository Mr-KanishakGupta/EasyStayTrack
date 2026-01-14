import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Building2, TrendingUp, Phone, Calendar, CheckCircle, XCircle, Clock, MessageSquare, PlusCircle, Pencil, Trash2, MapPin, IndianRupee, Database } from "lucide-react";
import Header from "@/components/Header";
import { properties as propertiesAPI, bookings as bookingsAPI, auth } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import EditPropertyDialog from "@/components/EditPropertyDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
type BookingRequest = {
  id: string;
  message: string | null;
  status: string | null;
  created_at: string;
  booking_date: string | null;
  duration: number | null;
  phone: string | null;
  special_requests: string | null;
  property: {
    title: string;
    area: string;
  };
  user_profile: {
    full_name: string;
    phone: string | null;
  } | null;
};

type Property = {
  id: string;
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
  available_from: string | null;
  is_available: boolean | null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myProperties: 0,
    totalInquiries: 0,
    platformUsers: 0,
    pendingRequests: 0,
    confirmedBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasProperties, setHasProperties] = useState(false);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentUser = auth.getUser();
    if (!currentUser) {
      toast.error("Please login to access the dashboard");
      navigate("/auth");
    } else {
      setUserId(currentUser.id);
      fetchOwnerStats(currentUser.id);
      fetchBookingRequests(currentUser.id);
      fetchMyProperties(currentUser.id);
    }
  }, [navigate]);

  const fetchOwnerStats = async (ownerId: string) => {
    try {
      // Get owner's properties from MongoDB
      const myProperties = await propertiesAPI.getAll({ owner_id: ownerId });
      const propertiesCount = myProperties.length;

      setHasProperties(propertiesCount > 0);

      if (propertiesCount === 0) {
        setStats({
          myProperties: 0,
          totalInquiries: 0,
          platformUsers: 0,
          pendingRequests: 0,
          confirmedBookings: 0,
        });
        setLoading(false);
        return;
      }

      const propertyIds = myProperties.map(p => p._id || p.id);

      // Get bookings for owner's properties
      const allBookings = await bookingsAPI.getAll({ owner_id: ownerId });

      const totalInquiries = allBookings.length;
      const pendingRequests = allBookings.filter(b => b.status === "pending").length;
      const confirmedBookings = allBookings.filter(b => b.status === "confirmed").length;

      setStats({
        myProperties: propertiesCount,
        totalInquiries,
        platformUsers: 0, // Can't get this without a specific API
        pendingRequests,
        confirmedBookings,
      });
    } catch (error) {
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProperties = async (ownerId: string) => {
    try {
      const data = await propertiesAPI.getAll({ owner_id: ownerId });
      setMyProperties(data as any);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    setDeleting(true);
    try {
      await propertiesAPI.delete(propertyToDelete.id);

      toast.success("Property deleted successfully");
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
      if (userId) {
        fetchMyProperties(userId);
        fetchOwnerStats(userId);
      }
    } catch (error) {
      toast.error("Failed to delete property");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    if (userId) {
      fetchMyProperties(userId);
      fetchOwnerStats(userId);
    }
  };

  const fetchBookingRequests = async (currentUserId: string) => {
    try {
      const data = await bookingsAPI.getAll({ owner_id: currentUserId });
      setBookingRequests(data as any);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await bookingsAPI.updateStatus(bookingId, newStatus as "confirmed" | "rejected");

      toast.success(`Booking ${newStatus}`);
      if (userId) fetchBookingRequests(userId);
    } catch (error) {
      toast.error("Failed to update booking status");
    }
  };

  const statsData = [
    {
      title: "My PG Listings",
      value: stats.myProperties.toString(),
      description: "Your active properties",
      icon: Building2,
      color: "text-primary",
    },
    {
      title: "Total Inquiries",
      value: stats.totalInquiries.toString(),
      description: "Booking requests received",
      icon: MessageSquare,
      color: "text-accent",
    },
    {
      title: "Platform Users",
      value: stats.platformUsers.toString(),
      description: "Registered on platform",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Growth Rate",
      value: stats.confirmedBookings > 0 ? `+${Math.round((stats.confirmedBookings / Math.max(stats.totalInquiries, 1)) * 100)}%` : "0%",
      description: "Conversion rate",
      icon: TrendingUp,
      color: "text-accent",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your PG listings and view booking requests
          </p>
        </div>

        {!hasProperties && !loading && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start Listing Your PGs</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                You haven't listed any properties yet. Add your first PG to start receiving booking requests from tenants.
              </p>
              <Button onClick={() => navigate("/list-property")} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                List Your First Property
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {loading ? (
            <div className="col-span-4 text-center py-8">
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          ) : (
            statsData.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>Your property statistics at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Confirmed Bookings</p>
                      <p className="text-xs text-muted-foreground">Successful conversions</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{stats.confirmedBookings}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-accent/10">
                      <Clock className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Pending Requests</p>
                      <p className="text-xs text-muted-foreground">Awaiting your response</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-accent">{stats.pendingRequests}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your listings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate("/list-property")}
              >
                <PlusCircle className="h-4 w-4" />
                Add New Property
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate("/find-pgs")}
              >
                <Building2 className="h-4 w-4" />
                View All PGs
              </Button>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Platform Statistics</p>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{stats.platformUsers} registered users on platform</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Properties Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              My Properties
            </CardTitle>
            <CardDescription>
              Manage your listed PG accommodations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myProperties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>You haven't listed any properties yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/list-property")}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  List Your First Property
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myProperties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4 space-y-3">
                    {property.image_url && (
                      <img
                        src={property.image_url}
                        alt={property.title}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold line-clamp-1">{property.title}</h4>
                        <Badge variant={property.is_available ? "default" : "secondary"}>
                          {property.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{property.area}, {property.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-primary mt-1">
                        <IndianRupee className="h-3 w-3" />
                        <span>{property.price_per_month.toLocaleString()}/month</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEditingProperty(property);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => {
                          setPropertyToDelete(property);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Requests for Property Owners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Requests for Your Properties
            </CardTitle>
            <CardDescription>
              View and manage booking requests from interested tenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No booking requests yet.</p>
                <p className="text-sm">When someone books one of your listed PGs, you'll see their request here.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/list-property")}>
                  List Your Property
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingRequests.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{booking.property?.title || "Property Not Found"}</h4>
                        <p className="text-sm text-muted-foreground">{booking.property?.area || "Unknown Area"}</p>
                      </div>
                      <Badge variant={
                        booking.status === "confirmed" ? "default" :
                          booking.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {booking.status || "pending"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.user_profile?.full_name || "Unknown User"}</span>
                      </div>
                      {booking.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${booking.phone}`} className="hover:underline">{booking.phone}</a>
                        </div>
                      )}
                      {booking.booking_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Move-in: {booking.booking_date && !isNaN(new Date(booking.booking_date).getTime()) ? format(new Date(booking.booking_date), "PP") : "TBD"}</span>
                        </div>
                      )}
                      {booking.duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.duration} month{booking.duration > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>

                    {booking.message && (
                      <div className="bg-muted/50 rounded p-3 text-sm">
                        <p className="font-medium mb-1">Message:</p>
                        <p className="text-muted-foreground">{booking.message}</p>
                      </div>
                    )}

                    {booking.special_requests && (
                      <div className="bg-muted/50 rounded p-3 text-sm">
                        <p className="font-medium mb-1">Special Requests:</p>
                        <p className="text-muted-foreground">{booking.special_requests}</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Requested on {booking.created_at && !isNaN(new Date(booking.created_at).getTime()) ? format(new Date(booking.created_at), "PPp") : "Recently"}
                    </div>

                    {booking.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking.id, "rejected")}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Property Dialog */}
      <EditPropertyDialog
        property={editingProperty}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{propertyToDelete?.title}"? This action cannot be undone. All associated booking requests will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;