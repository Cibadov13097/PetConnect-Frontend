import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Phone, Mail, Stethoscope } from "lucide-react";
import clinicImage from "@/assets/clinic-image.jpg";
import { apiClient, Organization } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ClinicsPage = () => {
  const [clinics, setClinics] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auth və organization üçün state-lər
  const { user, isAuthenticated, token } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
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

  // Mövcud klinikaları gətir
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await apiClient.getOrganizationsByType('Clinic');
        setClinics(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load clinics. Please try again.",
          variant: "destructive",
        });
        console.error("Failed to fetch clinics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, [toast]);

  // İstifadəçinin organization-u var?
  useEffect(() => {
    const fetchOrganization = async () => {
      if (isAuthenticated && user?.role?.toLowerCase() === "clinicowner") {
        try {
          const res = await fetch("/api/Organization/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setOrganization(data);
          } else {
            setOrganization(null);
          }
        } catch {
          setOrganization(null);
        }
      }
    };
    fetchOrganization();
  }, [isAuthenticated, user, token]);

  // Klinik qeydiyyatını göndər
  const handleRegisterClinic = async (e: React.FormEvent) => {
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
      formData.append("OpenTime", registerForm.openTime);
      formData.append("CloseTime", registerForm.closeTime);
      if (registerForm.imgFile) formData.append("ImgFile", registerForm.imgFile);
      formData.append("OrganizationType", "Clinic");

      const response = await fetch("/api/Organization/Add", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        toast({ title: "Clinic registered successfully!" });
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
        // Klinikaları yenilə
        const data = await apiClient.getOrganizationsByType('Clinic');
        setClinics(data);
      } else {
        toast({ title: "Registration failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Registration failed", variant: "destructive" });
    } finally {
      setRegisterLoading(false);
    }
  };

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Veterinary Clinics
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional veterinary care for your beloved pets
          </p>
          {/* Register Clinic düyməsi */}
          {isAuthenticated &&
            (user?.role?.toLowerCase() === "clinicowner") &&
            (!organization || organization.organizationType !== "Clinic") && (
              <Button
                className="mt-6"
                onClick={() => setShowRegisterModal(true)}
              >
                Register Clinic
              </Button>
            )}
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clinics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clinics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClinics.map((clinic) => (
            <Card key={clinic.id} className="group hover:shadow-warm transition-all duration-300 bg-gradient-card border-0">
              <CardHeader className="pb-3">
                <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={clinic.imageUrl || clinicImage}
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).src = clinicImage;
                    }}
                  />
                </div>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{clinic.name}</CardTitle>
                  <Badge className="bg-primary text-primary-foreground">
                    <Stethoscope className="h-3 w-3 mr-1" />
                    Clinic
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <p className="text-muted-foreground text-sm">
                  {clinic.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{clinic.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">
                      {clinic.openTime === "00:00" && clinic.closeTime === "23:59" 
                        ? "24/7" 
                        : `${clinic.openTime} - ${clinic.closeTime}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">{clinic.telephone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">{clinic.email}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1">
                    Book Appointment
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Call Now
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => navigate(`/clinicdetail/${clinic.id}`)}
                  >
                    View Clinic
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClinics.length === 0 && (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No clinics found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        )}

        {/* Register Clinic Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <h2 className="text-2xl font-bold mb-4">Register Clinic</h2>
              <form onSubmit={handleRegisterClinic} className="space-y-3">
                <Input
                  name="name"
                  placeholder="Clinic Name"
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
                />
                <div className="flex gap-2">
                  <Input
                    type="time"
                    placeholder="Open Time"
                    value={registerForm.openTime}
                    onChange={e => setRegisterForm(f => ({ ...f, openTime: e.target.value }))}
                  />
                  <Input
                    type="time"
                    placeholder="Close Time"
                    value={registerForm.closeTime}
                    onChange={e => setRegisterForm(f => ({ ...f, closeTime: e.target.value }))}
                  />
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e =>
                    setRegisterForm(f => ({
                      ...f,
                      imgFile: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                    }))
                  }
                />
                <div className="flex gap-2 mt-4">
                  <Button type="submit" className="flex-1" disabled={registerLoading}>
                    {registerLoading ? "Registering..." : "Register"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRegisterModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicsPage;