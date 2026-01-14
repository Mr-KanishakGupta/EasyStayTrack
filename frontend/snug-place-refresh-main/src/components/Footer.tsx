import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EasyStayTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Find your perfect PG accommodation in Bengaluru. Safe, affordable, and comfortable living for students and working professionals.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/find-pgs" className="text-muted-foreground hover:text-primary transition-colors">
                  Find PGs
                </Link>
              </li>
              <li>
                <Link to="/list-property" className="text-muted-foreground hover:text-primary transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="text-muted-foreground hover:text-primary transition-colors">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Areas */}
          <div className="space-y-4">
            <h3 className="font-semibold">Popular Areas</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/find-pgs?area=Koramangala" className="text-muted-foreground hover:text-primary transition-colors">
                  Koramangala
                </Link>
              </li>
              <li>
                <Link to="/find-pgs?area=HSR Layout" className="text-muted-foreground hover:text-primary transition-colors">
                  HSR Layout
                </Link>
              </li>
              <li>
                <Link to="/find-pgs?area=Indiranagar" className="text-muted-foreground hover:text-primary transition-colors">
                  Indiranagar
                </Link>
              </li>
              <li>
                <Link to="/find-pgs?area=Whitefield" className="text-muted-foreground hover:text-primary transition-colors">
                  Whitefield
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Bengaluru, Karnataka, India</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@easystaytrack.com" className="hover:text-primary transition-colors">
                  support@easystaytrack.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href="tel:+919876543210" className="hover:text-primary transition-colors">
                  +91 98765 43210
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EasyStayTrack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;