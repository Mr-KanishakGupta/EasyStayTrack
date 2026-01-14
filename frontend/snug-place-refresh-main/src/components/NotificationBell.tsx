import { useState, useEffect } from "react";
import { Bell, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { notifications as notificationsAPI, bookings as bookingsAPI, properties as propertiesAPI, auth } from "@/lib/api";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  booking_id: string | null;
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!auth.isAuthenticated()) return;

    try {
      const data = await notificationsAPI.getAll();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  const downloadBookingPDF = async (bookingId: string) => {
    try {
      // Handle case where bookingId might be an object
      let actualBookingId: string;
      if (typeof bookingId === 'object' && bookingId !== null) {
        actualBookingId = (bookingId as any)._id || (bookingId as any).id;
      } else {
        actualBookingId = bookingId;
      }

      if (!actualBookingId || typeof actualBookingId !== 'string') {
        toast.error("Invalid booking ID");
        console.error("Invalid booking ID:", bookingId);
        return;
      }

      console.log("Fetching booking details for:", actualBookingId);
      const booking = await bookingsAPI.getById(actualBookingId);

      if (!booking) {
        toast.error("Could not fetch booking details");
        return;
      }

      console.log("Booking data:", booking);

      // Access property data - handle different response formats
      const property = booking.property_id || booking.property;

      if (!property) {
        toast.error("Property details not found in booking");
        console.error("Booking structure:", booking);
        return;
      }

      console.log("Property data:", property);

      const doc = new jsPDF();

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("EasyStayTrack", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Booking Confirmation", 105, 32, { align: "center" });

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Confirmation badge
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(70, 50, 70, 12, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text("BOOKING CONFIRMED", 105, 58, { align: "center" });

      // Reset text color
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);

      let yPos = 80;

      // Property Details Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Property Details", 20, yPos);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 3, 190, yPos + 3);
      yPos += 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Property Name: ${property.title || "N/A"}`, 20, yPos);
      yPos += 8;
      doc.text(`Area: ${property.area || "N/A"}`, 20, yPos);
      yPos += 8;
      doc.text(`Address: ${property.address || "N/A"}`, 20, yPos);
      yPos += 8;
      doc.text(`Monthly Rent: ₹${property.price_per_month ? property.price_per_month.toLocaleString() : "N/A"}`, 20, yPos);
      yPos += 15;

      // Booking Details Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Booking Details", 20, yPos);
      doc.line(20, yPos + 3, 190, yPos + 3);
      yPos += 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Booking ID: ${booking._id || booking.id || "N/A"}`, 20, yPos);
      yPos += 8;

      // Safe date handling
      let checkInDate = "N/A";
      if (booking.booking_date) {
        try {
          const dateObj = new Date(booking.booking_date);
          if (!isNaN(dateObj.getTime())) {
            checkInDate = format(dateObj, "PPP");
          }
        } catch (e) {
          console.error("Date formatting error:", e);
        }
      }
      doc.text(`Check-in Date: ${checkInDate}`, 20, yPos);
      yPos += 8;

      doc.text(`Duration: ${booking.duration || "N/A"} month(s)`, 20, yPos);
      yPos += 8;
      doc.text(`Contact Phone: ${booking.phone || "N/A"}`, 20, yPos);
      yPos += 8;

      if (booking.special_requests) {
        // Handle long text by splitting into multiple lines
        const maxWidth = 170;
        const lines = doc.splitTextToSize(`Special Requests: ${booking.special_requests}`, maxWidth);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 7;
      }
      yPos += 7;

      // Owner Contact Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Owner Contact Information", 20, yPos);
      doc.line(20, yPos + 3, 190, yPos + 3);
      yPos += 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Phone: ${property.contact_phone || "N/A"}`, 20, yPos);
      yPos += 8;
      if (property.contact_email) {
        doc.text(`Email: ${property.contact_email}`, 20, yPos);
        yPos += 8;
      }
      yPos += 15;

      // Footer
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 260, 210, 40, "F");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("This document serves as confirmation of your booking.", 105, 272, { align: "center" });
      doc.text(`Generated on: ${format(new Date(), "PPP 'at' p")}`, 105, 280, { align: "center" });
      doc.text("Thank you for choosing EasyStayTrack!", 105, 288, { align: "center" });

      const bookingIdShort = (booking._id || booking.id || "unknown").toString().slice(0, 8);
      doc.save(`EasyStayTrack_Booking_${bookingIdShort}.pdf`);
      toast.success("Booking confirmation downloaded!");
    } catch (err) {
      console.error("PDF generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to generate PDF: ${errorMessage}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 ${!notification.is_read ? "bg-muted/50" : ""}`}
                >
                  <p className={`font-medium text-sm ${getTypeColor(notification.type)}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {notification.created_at && !isNaN(new Date(notification.created_at).getTime())
                        ? format(new Date(notification.created_at), "PPp")
                        : "Recently"}
                    </p>
                    {notification.type === "success" && notification.booking_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadBookingPDF(notification.booking_id!);
                        }}
                      >
                        <Download className="h-3 w-3" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
