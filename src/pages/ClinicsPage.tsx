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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  // Appointment üçün state-lər
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    serviceid: "",
    name: "",
    description: "",
    appointmentTime: "",
  });
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);

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
        let errorText = "Unknown error";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorText = errorData?.message || errorData?.error || JSON.stringify(errorData);
          } else {
            errorText = await response.text();
          }
        } catch {
          errorText = "Unknown error";
        }
        toast({ 
          title: "Registration failed",
          description: errorText,
          variant: "destructive"
        });
      }
    } catch {
      toast({ title: "Registration failed", variant: "destructive" });
    } finally {
      setRegisterLoading(false);
    }
  };

  // Appointment modalını açan funksiya
  const openAppointmentModal = async (clinic: any) => {
    // Əvvəlcə ClinicId-ni backend-dən al
    let clinicId = null;
    try {
      const res = await fetch(`/api/Clinic/byOrganization/${clinic.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        clinicId = data.id; // Clinic entity-nin id-si
      }
    } catch {
      clinicId = null;
    }
    setSelectedClinic({ ...clinic, clinicId }); // clinicId əlavə et
    setShowAppointmentModal(true);
    setAppointmentForm({
      serviceid: "",
      name: "",
      description: "",
      appointmentTime: "",
    });
    // Servisləri backend-dən gətir
    try {
      const res = await fetch(`/api/Service/organization/${clinic.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      } else {
        setServices([]);
      }
    } catch {
      setServices([]);
    }
  };

  // Appointment göndərən funksiya
  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;
    setAppointmentLoading(true);
    try {
      const body = {
        clinicId: selectedClinic.id,
        Serviceid: parseInt(appointmentForm.serviceid, 10), // <-- Dəyişiklik
        name: appointmentForm.name,
        description: appointmentForm.description,
        appointmentTime: appointmentForm.appointmentTime,
        appointmentStatus: "Pending",
      };
      const res = await fetch("/api/Clinic/addAppointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({
          title: "Appointment booked!",
          description: "Your appointment request has been sent.",
          variant: "default",
        });
        setShowAppointmentModal(false);
      } else {
        let errorText = "Please check your info and try again.";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errorText = errorData?.message || errorData?.error || JSON.stringify(errorData);
          } else {
            errorText = await res.text();
          }
        } catch {
          errorText = "Unknown error";
        }
        toast({
          title: "Failed to book appointment",
          description: errorText,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Failed to book appointment",
        description: "Please check your info and try again.",
        variant: "destructive",
      });
    } finally {
      setAppointmentLoading(false);
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
          {true && (
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
            <Card
              key={clinic.id}
              className="group transition-all duration-300 bg-white border-0 shadow-lg rounded-2xl hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-80" />
              <div className="relative z-10">
                <CardHeader className="pb-3">
                  <div className="aspect-video bg-muted rounded-xl mb-3 overflow-hidden border-2 border-primary/20">
                    <img
                      src={clinic.imageUrl || clinicImage}
                      alt={clinic.name}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-95"
                      onError={e => {
                        (e.target as HTMLImageElement).src = clinicImage;
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors truncate">
                      {clinic.name}
                    </CardTitle>
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full shadow">
                      <Stethoscope className="h-4 w-4 mr-1" />
                      Clinic
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <p className="text-muted-foreground text-base mb-2 line-clamp-2">{clinic.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                      <MapPin className="w-4 h-4" />
                      {clinic.location}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary px-2 py-1 rounded-full text-xs font-medium">
                      <Clock className="w-4 h-4" />
                      {clinic.openTime === "00:00" && clinic.closeTime === "23:59"
                        ? "24/7"
                        : `${clinic.openTime} - ${clinic.closeTime}`}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                      <Phone className="w-4 h-4" />
                      {clinic.telephone}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">
                      <Mail className="w-4 h-4" />
                      {clinic.email}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 font-semibold bg-gradient-to-r from-primary to-secondary text-white shadow hover:scale-105 transition"
                      onClick={() => openAppointmentModal(clinic)}
                    >
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
              </div>
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

        {/* Appointment Modal */}
        <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
          <DialogContent className="rounded-2xl shadow-2xl bg-gradient-to-br from-white via-primary/5 to-secondary/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-primary">
                Book Appointment at {selectedClinic?.name}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Appointment Name"
                value={appointmentForm.name}
                onChange={e => setAppointmentForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full border rounded-lg px-4 py-2 text-base"
              />
              <select
                value={appointmentForm.serviceid}
                onChange={e => setAppointmentForm(f => ({ ...f, serviceid: e.target.value }))}
                required
                className="w-full border rounded-lg px-4 py-2 text-base"
              >
                <option value="">Select Service</option>
                {services.map((service: any) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description"
                value={appointmentForm.description}
                onChange={e => setAppointmentForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2 text-base"
              />
              <input
                type="datetime-local"
                value={appointmentForm.appointmentTime}
                onChange={e => setAppointmentForm(f => ({ ...f, appointmentTime: e.target.value }))}
                required
                className="w-full border rounded-lg px-4 py-2 text-base"
              />
              <div className="flex gap-2 mt-4">
                <Button type="submit" className="flex-1 font-semibold bg-gradient-to-r from-primary to-secondary text-white shadow hover:scale-105 transition" disabled={appointmentLoading}>
                  {appointmentLoading ? "Booking..." : "Book"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAppointmentModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClinicsPage;