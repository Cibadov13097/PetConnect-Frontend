import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Phone, Mail } from "lucide-react";
import shelterImage from "@/assets/shelter-image.jpg";
import { apiClient, Organization } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

const SheltersPage = () => {
  const [shelters, setShelters] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    description: "",
    location: "",
    telephone: "",
    email: "",
    website: "", 
    openTime: "",
    closeTime: "",
    imgFile: null as File | null,
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    const fetchShelters = async () => {
      try {
        const data = await apiClient.getOrganizationsByType('Shelter');
        setShelters(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load shelters. Please try again.",
          variant: "destructive",
        });
        console.error("Failed to fetch shelters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShelters();
  }, [toast]);

  const filteredShelters = shelters.filter(shelter =>
    shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shelter.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shelter.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shelters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Pet Shelters
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find loving pets looking for their forever homes
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shelters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Register Shelter Button */}
        <div className="mb-8 flex justify-center">
          <Button onClick={() => setShowRegisterModal(true)}>
            Register Shelter
          </Button>
        </div>

        {/* Shelters Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShelters.map((shelter) => (
            <Card key={shelter.id} className="group hover:shadow-warm transition-all duration-300 bg-gradient-card border-0">
              <CardHeader className="pb-3">
                <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={shelter.imageUrl || shelterImage} // Use shelter.imgUrl from DB, fallback to static image
                    alt={shelter.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      // fallback to static image if URL fails
                      (e.target as HTMLImageElement).src = shelterImage;
                    }}
                  />
                </div>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{shelter.name}</CardTitle>
                  <Badge className="bg-accent text-accent-foreground">Shelter</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <p className="text-muted-foreground text-sm">
                  {shelter.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{shelter.location}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">
                      {shelter.openTime} - {shelter.closeTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">{shelter.telephone}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">{shelter.email}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => navigate(`/shelter-detail/${shelter.id}`)}
                  >
                    Visit Shelter
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredShelters.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No shelters found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        )}

        {/* Register Shelter Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowRegisterModal(false)}
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Register Shelter</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setRegisterLoading(true);
                  try {
                    const formData = new FormData();
                    formData.append("Name", registerForm.name);
                    formData.append("Description", registerForm.description);
                    formData.append("Location", registerForm.location);
                    formData.append("Telephone", registerForm.telephone);
                    formData.append("Email", registerForm.email);
                    formData.append("Website", registerForm.website);
                    formData.append("OpenTime", registerForm.openTime ? `${registerForm.openTime}:00` : "");
                    formData.append("CloseTime", registerForm.closeTime ? `${registerForm.closeTime}:00` : "");
                    formData.append("OrganizationType", "Shelter");
                    if (registerForm.imgFile) formData.append("ImgFile", registerForm.imgFile);

                    const response = await fetch(`${API_BASE}/api/Organization/Add`, {
                      method: "POST",
                      body: formData,
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });

                    if (!response.ok) {
                      const errorText = await response.text();
                      throw new Error(errorText);
                    }

                    toast({ title: "Shelter registered successfully!" });
                    setShowRegisterModal(false);
                    setRegisterForm({
                      name: "",
                      description: "",
                      location: "",
                      telephone: "",
                      email: "",
                      website: "",
                      openTime: "",
                      closeTime: "",
                      imgFile: null,
                    });
                    setLoading(true);
                    const data = await apiClient.getOrganizationsByType('Shelter');
                    setShelters(data);
                  } catch (err: any) {
                    toast({ title: "Registration failed", description: err.message, variant: "destructive" });
                  } finally {
                    setRegisterLoading(false);
                  }
                }}
                className="space-y-3"
              >
                <Input
                  name="name"
                  placeholder="Shelter Name"
                  value={registerForm.name}
                  onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  name="description"
                  placeholder="Description"
                  value={registerForm.description}
                  onChange={e => setRegisterForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
                <Input
                  name="location"
                  placeholder="Location"
                  value={registerForm.location}
                  onChange={e => setRegisterForm(f => ({ ...f, location: e.target.value }))}
                  required
                />
                <Input
                  name="telephone"
                  placeholder="Telephone"
                  value={registerForm.telephone}
                  onChange={e => setRegisterForm(f => ({ ...f, telephone: e.target.value }))}
                  required
                />
                <Input
                  name="email"
                  placeholder="Email"
                  type="email"
                  value={registerForm.email}
                  onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
                <Input
                  name="website"
                  placeholder="Website"
                  value={registerForm.website}
                  onChange={e => setRegisterForm(f => ({ ...f, website: e.target.value }))}
                  required // <-- this line ensures the user cannot submit an empty website
                />
                <div className="flex gap-2">
                  <Input
                    name="openTime"
                    placeholder="Open Time (e.g. 09:00)"
                    value={registerForm.openTime}
                    onChange={e => setRegisterForm(f => ({ ...f, openTime: e.target.value }))}
                    required
                  />
                  <Input
                    name="closeTime"
                    placeholder="Close Time (e.g. 18:00)"
                    value={registerForm.closeTime}
                    onChange={e => setRegisterForm(f => ({ ...f, closeTime: e.target.value }))}
                    required
                  />
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => setRegisterForm(f => ({
                    ...f,
                    imgFile: e.target.files && e.target.files[0] ? e.target.files[0] : null
                  }))}
                />
                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? "Registering..." : "Register Shelter"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheltersPage;