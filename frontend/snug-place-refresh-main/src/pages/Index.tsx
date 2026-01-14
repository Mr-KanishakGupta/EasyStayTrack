import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Shield, Wifi, Utensils } from "lucide-react";
import { properties as propertiesAPI } from "@/lib/api";

type LocationStat = {
  area: string;
  count: number;
};

type PredefinedArea = {
  name: string;
  image: string;
};

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationStats, setLocationStats] = useState<LocationStat[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationStat[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Predefined areas to always display with their images
  const predefinedAreas: PredefinedArea[] = [
    { name: "Electronic City", image: "/src/assets/cities/electronic-city.jpg" },
    { name: "HSR Layout", image: "/src/assets/cities/hsr-layout.jpg" },
    { name: "Indiranagar", image: "/src/assets/cities/indiranagar.jpg" },
    { name: "Jayanagar", image: "/src/assets/cities/jayanagar.jpg" },
    { name: "Koramangala", image: "/src/assets/cities/koramangala.jpg" },
    { name: "Whitefield", image: "/src/assets/cities/whitefield.jpg" },
  ];

  const fetchLocationStats = async () => {
    try {
      const data = await propertiesAPI.getLocationStats();
      console.log("Location stats from API:", data);
      setLocationStats(data);
    } catch (error) {
      console.error("Error fetching location stats:", error);
      setLocationStats([]);
    }
  };

  // Get property count for a specific area (case-insensitive)
  const getPropertyCount = (areaName: string): number => {
    const stat = locationStats.find(loc =>
      loc.area.toLowerCase() === areaName.toLowerCase()
    );
    return stat ? stat.count : 0;
  };

  useEffect(() => {
    // Initial fetch
    fetchLocationStats();

    // Poll for updates every 30 seconds to keep counts fresh
    const pollInterval = setInterval(() => {
      fetchLocationStats();
    }, 30000); // 30 seconds

    // Refetch stats when user returns to the page
    const handleFocus = () => {
      fetchLocationStats();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Filter based on search query
      const filtered = locationStats.filter(
        (loc) =>
          loc.area.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowDropdown(true);
    } else if (isFocused) {
      // Show all areas when focused but no search query
      setFilteredLocations(locationStats);
      setShowDropdown(true);
    } else {
      setFilteredLocations([]);
      setShowDropdown(false);
    }
  }, [searchQuery, locationStats, isFocused]);

  const handleLocationSelect = (location: LocationStat) => {
    navigate(`/find-pgs?area=${encodeURIComponent(location.area)}`);
    setShowDropdown(false);
    setSearchQuery("");
    setIsFocused(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/find-pgs?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/find-pgs");
    }
  };

  const features = [
    { icon: Users, title: "Student Friendly", description: "Specially designed PGs for students with study rooms and quiet environments" },
    { icon: Shield, title: "Safe & Secure", description: "24/7 security with CCTV surveillance and verified property owners" },
    { icon: Wifi, title: "Modern Amenities", description: "High-speed WiFi, power backup, and all essential facilities included" },
    { icon: Utensils, title: "Homely Food", description: "Nutritious home-cooked meals with various dietary options available" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1920')" }}
        />
        <div className="relative z-10 container text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">Perfect PG for Students in Bengaluru</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto">
            Find affordable, safe, and comfortable paying guest accommodations near your college. Start your student life stress-free!
          </p>
          <div className="relative flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Input
                placeholder="Search for PG near your college or area..."
                className="h-12 bg-background text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              />
              {showDropdown && filteredLocations.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                  {filteredLocations.map((loc, idx) => (
                    <button
                      key={idx}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                      onClick={() => handleLocationSelect(loc)}
                    >
                      <span className="text-foreground">{loc.area}</span>
                      <span className="text-sm text-muted-foreground">{loc.count} properties</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button size="lg" className="h-12 bg-accent hover:bg-accent/90" onClick={handleSearch}>
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Areas */}
      <section className="py-16 container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Popular Student Areas in Bengaluru</h2>
          <p className="text-muted-foreground">
            Browse PGs in Bengaluru's top student-friendly neighborhoods near colleges and universities
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predefinedAreas.map((area) => {
            const propertyCount = getPropertyCount(area.name);
            return (
              <Link
                key={area.name}
                to={`/find-pgs?area=${encodeURIComponent(area.name)}`}
                className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer h-64 block"
              >
                <img
                  src={area.image}
                  alt={area.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{area.name}</h3>
                  <p className="text-white/90">{propertyCount} {propertyCount === 1 ? "Property" : "Properties"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Students Love EasyStayTrack</h2>
            <p className="text-muted-foreground">
              Your home away from home with everything you need to focus on your studies
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
