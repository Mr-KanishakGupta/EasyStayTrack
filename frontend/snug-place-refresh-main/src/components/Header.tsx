import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, LogOut, Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import NotificationBell from "@/components/NotificationBell";
import { auth } from "@/lib/api";

interface UserType {
  id: string;
  email: string;
  full_name: string;
}

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const currentUser = auth.getUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="EasyStayTrack" className="h-9 w-9 rounded-lg" />
          <span className="text-xl font-bold text-primary hidden sm:inline">EasyStayTrack</span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {user && (
            <>
              <NavLink
                to="/dashboard"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap"
                activeClassName="text-foreground"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/my-bookings"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap"
                activeClassName="text-foreground"
              >
                My Bookings
              </NavLink>
            </>
          )}
          <NavLink
            to="/find-pgs"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap"
            activeClassName="text-foreground"
          >
            Find PGs
          </NavLink>
          <NavLink
            to="/list-property"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap"
            activeClassName="text-foreground"
          >
            List PG
          </NavLink>
        </nav>

        {/* Contact Info - Hidden on smaller screens */}
        <div className="hidden xl:flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-foreground/70">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">+91 801 234 5678</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-foreground/70">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">info@easystaytrack.com</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:inline-flex gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                <NavLink to="/auth">Login</NavLink>
              </Button>
              <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
                <NavLink to="/auth">Sign Up</NavLink>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <nav className="container flex flex-col py-4 px-4 gap-3">
            {user && (
              <>
                <NavLink
                  to="/dashboard"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                  activeClassName="text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/my-bookings"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                  activeClassName="text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </NavLink>
              </>
            )}
            <NavLink
              to="/find-pgs"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find PGs
            </NavLink>
            <NavLink
              to="/list-property"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              List PG
            </NavLink>
            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex items-center gap-1.5 text-sm text-foreground/70 py-1">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+91 801 234 5678</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-foreground/70 py-1">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@easystaytrack.com</span>
              </div>
            </div>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mt-2 gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
