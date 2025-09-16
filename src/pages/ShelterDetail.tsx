import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Building2, MapPin, Phone, Mail, Globe, Edit, Plus, Heart, Users, Clock, Wrench, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.VITE_API_URL;

interface Shelter {
  id: string;
  name: string;
  description: string;
  location: string;
  telephone: string;
  email: string;
  website?: string;
  imageUrl?: string;
  openTime: string;
  closeTime: string;
  organizationType: string;
  isActive: boolean;
}

// Service interfeysini əlavə edin
interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}

const ShelterDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, token, user } = useAuth();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editServiceId, setEditServiceId] = useState<number | null>(null);
  const [showEditShelterModal, setShowEditShelterModal] = useState(false);
  const [editShelterForm, setEditShelterForm] = useState({
    name: shelter?.name || "",
    description: shelter?.description || "",
    location: shelter?.location || "",
    telephone: shelter?.telephone || "",
    email: shelter?.email || "",
    website: shelter?.website || "",
    openTime: shelter?.openTime || "",
    closeTime: shelter?.closeTime || "",
    image: null as File | null,
  });

  useEffect(() => {
    console.log("Shelter id from params:", id);

    const fetchShelterData = async () => {
      setIsLoading(true);
      try {
        if (!id) {
          toast({
            title: "Error",
            description: "Shelter not found.",
            variant: "destructive",
          });
          navigate("/shelters");
          return;
        }

        const response = await fetch(`${API_BASE}/api/Organization/getBy${id}`);
        if (response.ok) {
          const data = await response.json();
          setShelter(data);
          // Sahibliyi yoxla
          if (data.ownerId && user?.id && data.ownerId === user.id) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }
        } else {
          toast({
            title: "Error",
            description: "Shelter not found.",
            variant: "destructive",
          });
          setShelter(null);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
        setShelter(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShelterData();
  }, [id, user, toast, navigate]);

  // Servisləri gətirən useEffect
  useEffect(() => {
    const fetchServices = async () => {
      if (!id) return;
      try {
        const res = await fetch(`${API_BASE}/api/Service/organization/${id}`);
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        } else {
          setServices([]);
        }
      } catch (err) {
        setServices([]);
      }
    };
    fetchServices();
  }, [id]);

  // Modalın dolu gəlməsi üçün useEffect əlavə et:
  useEffect(() => {
    if (showEditShelterModal && shelter) {
      setEditShelterForm({
        name: shelter.name || "",
        description: shelter.description || "",
        location: shelter.location || "",
        telephone: shelter.telephone || "",
        email: shelter.email || "",
        website: shelter.website || "",
        openTime: shelter.openTime || "",
        closeTime: shelter.closeTime || "",
        image: null,
      });
    }
  }, [showEditShelterModal, shelter]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading shelter details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Shelter Found</h1>
          <p className="text-muted-foreground mb-6">You don't have a shelter registered yet.</p>
          <Button onClick={() => navigate("/shelters")}>
            <Plus className="h-4 w-4 mr-2" />
            Register Your Shelter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-4">
              {shelter.imageUrl && (
                <img 
                  src={shelter.imageUrl} 
                  alt={shelter.name}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              )}
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{shelter.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={shelter.isActive ? "default" : "secondary"}>
                  {shelter.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">Animal Shelter</Badge>
              </div>
            </div>
          </div>
          {isOwner && (
            <Button onClick={() => setShowEditShelterModal(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Shelter
            </Button>
          )}
        </div>

        {/* Shelter Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Shelter Information</CardTitle>
              <CardDescription>Basic details about your animal shelter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Mission</h4>
                <p className="text-sm">{shelter.description || "No description provided"}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Address</h4>
                  <p className="text-sm">{shelter.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Hours</h4>
                  <p className="text-sm">
                    {shelter.openTime && shelter.closeTime
                      ? `${shelter.openTime} - ${shelter.closeTime}`
                      : "Hours not specified"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How people can reach your shelter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shelter.telephone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Phone</h4>
                    <p className="text-sm">{shelter.telephone}</p>
                  </div>
                </div>
              )}

              {shelter.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                    <p className="text-sm">{shelter.email}</p>
                  </div>
                </div>
              )}

              {shelter.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Website</h4>
                    <a 
                      href={shelter.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {shelter.website}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground">Animals Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">Successful Adoptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-muted-foreground">Volunteer Helpers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {isOwner && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your shelter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" onClick={() => navigate("/shelter-animals")}>
                  <Heart className="h-4 w-4 mr-2" />
                  Manage Animals
                </Button>
                {/* Add Service button opens modal */}
                <Button variant="outline" onClick={() => setShowServiceModal(true)}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
                <Button variant="outline" onClick={() => navigate("/adoption-requests")}>
                  Adoption Requests
                </Button>
                <Button variant="outline" onClick={() => navigate("/volunteers")}>
                  <Users className="h-4 w-4 mr-2" />
                  Volunteers
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Modal */}
        {showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Service</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  try {
                    const res = await fetch(`${API_BASE}/api/Service`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        name: serviceForm.name
                      }),
                    });
                    if (res.ok) {
                      toast({ title: "Service added", description: "Service created successfully!" });
                      setShowServiceModal(false);
                      setServiceForm({ name: "" });
                      // Refresh services
                      const data = await res.json();
                      setServices((prev) => [...prev, data]);
                    } else {
                      toast({ title: "Error", description: "Failed to add service", variant: "destructive" });
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={serviceForm.name}
                    onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowServiceModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Service"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Services Panel */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <Wrench className="inline-block h-5 w-5 mr-2 text-primary" />
              Services
            </CardTitle>
            <CardDescription>
              Services provided by this shelter
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-muted-foreground">No services found for this shelter.</p>
            ) : (
              <div className="space-y-4">
                {services.map(service => (
                  <div key={service.id} className="p-4 rounded-lg border bg-muted/50 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-base">{service.name}</p>
                    </div>
                    {/* Edit və Delete yalnız öz shelteri üçün görünür */}
                    {isOwner && (
                      <div className="flex gap-2 mt-2 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setServiceForm({ name: service.name });
                            setEditServiceId(service.id);
                            setShowEditServiceModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this service?")) {
                              const res = await fetch(`${API_BASE}/api/Service/${service.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                toast({ title: "Service deleted", description: "Service removed successfully!" });
                                setServices(prev => prev.filter(s => s.id !== service.id));
                              } else {
                                toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
                              }
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your shelter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Heart className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Successful adoption - Luna the Cat</p>
                  <p className="text-xs text-muted-foreground">Found a loving home with the Johnson family</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">5 new adoption applications</p>
                  <p className="text-xs text-muted-foreground">Review and process new adoption requests</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Plus className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">New animal intake - Charlie the Dog</p>
                  <p className="text-xs text-muted-foreground">Complete medical check and profile setup</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Service Modal */}
        {showEditServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Service</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  try {
                    const res = await fetch(`${API_BASE}/api/Service/${editServiceId}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        name: serviceForm.name
                      }),
                    });
                    if (res.ok) {
                      toast({ title: "Service updated", description: "Service updated successfully!" });
                      setShowEditServiceModal(false);
                      setServiceForm({ name: "" });
                      // Refresh services
                      const updated = await res.json();
                      setServices(prev =>
                        prev.map(s => s.id === editServiceId ? updated : s)
                      );
                    } else {
                      toast({ title: "Error", description: "Failed to update service", variant: "destructive" });
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={serviceForm.name}
                    onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditServiceModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Shelter Modal */}
        {showEditShelterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const formData = new FormData();
                  formData.append("Name", editShelterForm.name);
                  formData.append("Description", editShelterForm.description);
                  formData.append("Location", editShelterForm.location);
                  formData.append("Telephone", editShelterForm.telephone);
                  formData.append("Email", editShelterForm.email);
                  formData.append("Website", editShelterForm.website);
                  formData.append("OpenTime", editShelterForm.openTime);
                  formData.append("CloseTime", editShelterForm.closeTime);
                  if (editShelterForm.image) formData.append("ImgFile", editShelterForm.image);

                  const res = await fetch(`${API_BASE}/api/Organization/edit?id=${shelter.id}`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                  });
                  if (res.ok) {
                    toast({ title: "Shelter updated!" });
                    setShowEditShelterModal(false);
                    window.location.reload();
                  } else {
                    const error = await res.text();
                    toast({ title: "Update failed", description: error, variant: "destructive" });
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <h2 className="text-2xl font-bold mb-4">Edit Shelter</h2>
              <Input
                placeholder="Name"
                value={editShelterForm.name}
                onChange={e => setEditShelterForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Description"
                value={editShelterForm.description}
                onChange={e => setEditShelterForm(f => ({ ...f, description: e.target.value }))}
                required
              />
              <Input
                placeholder="Location"
                value={editShelterForm.location}
                onChange={e => setEditShelterForm(f => ({ ...f, location: e.target.value }))}
                required
              />
              <Input
                placeholder="Telephone"
                value={editShelterForm.telephone}
                onChange={e => setEditShelterForm(f => ({ ...f, telephone: e.target.value }))}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={editShelterForm.email}
                onChange={e => setEditShelterForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Website"
                value={editShelterForm.website}
                onChange={e => setEditShelterForm(f => ({ ...f, website: e.target.value }))}
              />
              <div className="flex gap-2">
                <Input
                  type="time"
                  placeholder="Open Time"
                  value={editShelterForm.openTime}
                  onChange={e => setEditShelterForm(f => ({ ...f, openTime: e.target.value }))}
                />
                <Input
                  type="time"
                  placeholder="Close Time"
                  value={editShelterForm.closeTime}
                  onChange={e => setEditShelterForm(f => ({ ...f, closeTime: e.target.value }))}
                />
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={e =>
                  setEditShelterForm(f => ({
                    ...f,
                    image: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                  }))
                }
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditShelterModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelterDetail;
