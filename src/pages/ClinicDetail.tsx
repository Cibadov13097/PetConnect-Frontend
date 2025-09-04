import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Stethoscope, MapPin, Phone, Mail, Globe, Edit, Plus, Calendar, Clock, Wrench, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Clinic {
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
  ownerId: string; // Added ownerId property
}

interface Service {
  id: string;
  name: string;
  description: string;
  price?: number;
}

const ClinicDetail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, token, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    location: "",
    telephone: "",
    email: "",
    website: "",
    openTime: "",
    closeTime: "",
    image: null as File | null,
  });
  const [services, setServices] = useState<Service[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [isAddingService, setIsAddingService] = useState(false);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);

  const isOwner = clinic && user && clinic.ownerId === user.id;

  // Klinik məlumatı gətir
  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        if (!isAuthenticated || !token) {
          toast({
            title: "Authentication Required",
            description: "Please login to access clinic details",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        let response;
        if (id) {
          response = await fetch(`/api/Organization/getBy${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          response = await fetch(`/api/Organization/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        if (response.ok) {
          const data = await response.json();
          if (data.organizationType === "Clinic") {
            setClinic(data);
          } else {
            toast({
              title: "Info",
              description: "No clinic found.",
            });
            setClinic(null);
          }
        } else if (response.status === 404) {
          setClinic(null);
        } else {
          toast({
            title: "Error",
            description: "Failed to load clinic data",
            variant: "destructive",
          });
          setClinic(null);
        }
      } catch (error) {
        console.error("Error fetching clinic data:", error);
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
        setClinic(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicData();
  }, [isAuthenticated, token, id, navigate, toast]);

  // Servisləri gətir
  useEffect(() => {
    const fetchServices = async () => {
      const orgId = id || clinic?.id;
      if (!orgId) return;
      try {
        const res = await fetch(`/api/Service/organization/${orgId}`);
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
  }, [id, clinic?.id]);

  useEffect(() => {
    if (clinic && showEditModal) {
      setEditForm({
        name: clinic.name || "",
        description: clinic.description || "",
        location: clinic.location || "",
        telephone: clinic.telephone || "",
        email: clinic.email || "",
        website: clinic.website || "",
        openTime: clinic.openTime || "",
        closeTime: clinic.closeTime || "",
        image: null,
      });
    }
  }, [clinic, showEditModal]);

  const handleEditClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;
    const formData = new FormData();
    formData.append("Name", editForm.name);
    formData.append("Description", editForm.description);
    formData.append("Location", editForm.location);
    formData.append("Telephone", editForm.telephone);
    formData.append("Email", editForm.email);
    formData.append("Website", editForm.website);
    formData.append("OpenTime", toTimeSpan(editForm.openTime));
    formData.append("CloseTime", toTimeSpan(editForm.closeTime));
    if (editForm.image) formData.append("ImgFile", editForm.image);

    try {
      const res = await fetch(`/api/Organization/edit?id=${clinic.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }, // Content-Type göndərmə!
        body: formData,
      });
      if (res.ok) {
        toast({ title: "Clinic updated!" });
        setShowEditModal(false);
        // Səhifəni tam refresh et
        window.location.reload();
      } else {
        const error = await res.text();
        toast({ title: "Update failed", description: error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  // Add Service funksiyası
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic?.id || !newServiceName.trim()) return;
    setIsAddingService(true);

    try {
      let res;
      if (editServiceId) {
        // Edit existing service
        res = await fetch(`/api/Service/${editServiceId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newServiceName }),
        });
      } else {
        // Add new service
        res = await fetch(`/api/Service?organizationId=${clinic.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newServiceName }),
        });
      }

      if (res.ok) {
        toast({ title: editServiceId ? "Service updated!" : "Service added!" });
        setShowAddServiceModal(false);
        setNewServiceName("");
        setEditServiceId(null);
        // Servisləri yenilə
        const updated = await res.json();
        if (editServiceId) {
          setServices(prev =>
            prev.map(s => (s.id === editServiceId ? updated : s))
          );
        } else {
          setServices(prev => [...prev, updated]);
        }
      } else {
        toast({ title: "Failed to save service", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save service", variant: "destructive" });
    } finally {
      setIsAddingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`/api/Service/${serviceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast({ title: "Service deleted!" });
        setServices(prev => prev.filter(s => s.id !== serviceId));
      } else {
        toast({ title: "Failed to delete service", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete service", variant: "destructive" });
    }
  };

  const toTimeSpan = (time: string) => {
    if (!time) return "";
    return time.length === 5 ? `${time}:00` : time;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading clinic details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Clinic Found</h1>
          <p className="text-muted-foreground mb-6">You don't have a clinic registered yet.</p>
          <Button onClick={() => navigate("/clinics")}>
            <Plus className="h-4 w-4 mr-2" />
            Register Your Clinic
          </Button>
        </div>
      </div>
    );
  }

  // When opening modal for edit:
  const openEditServiceModal = (service: Service) => {
    setEditServiceId(service.id);
    setNewServiceName(service.name);
    setShowAddServiceModal(true);
  };

  // When opening modal for add:
  const openAddServiceModal = () => {
    setEditServiceId(null);
    setNewServiceName("");
    setShowAddServiceModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-4">
              {clinic.imageUrl && (
                <img 
                  src={clinic.imageUrl} 
                  alt={clinic.name}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              )}
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{clinic.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={clinic.isActive ? "default" : "secondary"}>
                  {clinic.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">Veterinary Clinic</Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Clinic
          </Button>
        </div>

        {/* Clinic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>Basic details about your veterinary clinic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{clinic.description || "No description provided"}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Address</h4>
                  <p className="text-sm">{clinic.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Hours</h4>
                  <p className="text-sm">
                    {clinic.openTime && clinic.closeTime
                      ? `${toTimeSpan(clinic.openTime)} - ${toTimeSpan(clinic.closeTime)}`
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
              <CardDescription>How pet owners can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clinic.telephone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Phone</h4>
                    <p className="text-sm">{clinic.telephone}</p>
                  </div>
                </div>
              )}

              {clinic.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                    <p className="text-sm">{clinic.email}</p>
                  </div>
                </div>
              )}

              {clinic.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Website</h4>
                    <a 
                      href={clinic.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {clinic.website}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
  {/* Quick Actions */}
        {isOwner && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your clinic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" onClick={() => navigate("/appointments")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Appointments
                </Button>
                <Button variant="outline" onClick={() => openAddServiceModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
                <Button variant="outline" onClick={() => navigate("/patient-records")}>
                  Patient Records
                </Button>
                <Button variant="outline" onClick={() => navigate("/clinic-analytics")}>
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Panel */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <Wrench className="inline-block h-5 w-5 mr-2 text-primary" />
              Services
            </CardTitle>
            <CardDescription>
              Services provided by this clinic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-muted-foreground">No services found for this clinic.</p>
            ) : (
              <div className="space-y-4">
                {services.map(service => (
                  <div key={service.id} className="p-4 rounded-lg border bg-muted/50 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-base">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <div className="mt-2 md:mt-0 flex gap-2 items-center">
                      <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <Wrench className="h-4 w-4 mr-1" />
                        Service
                      </span>
                      {isOwner && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditServiceModal(service)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
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
            <CardDescription>Latest updates from your clinic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Next appointment in 2 hours</p>
                  <p className="text-xs text-muted-foreground">Check-up for Max the Golden Retriever</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">3 new appointment requests</p>
                  <p className="text-xs text-muted-foreground">Review and confirm new bookings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Clinic Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
              onSubmit={handleEditClinic}
            >
              <h2 className="text-2xl font-bold mb-4">Edit Clinic</h2>
              <Input
                placeholder="Name"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Description"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                required
              />
              <Input
                placeholder="Location"
                value={editForm.location}
                onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                required
              />
              <Input
                placeholder="Telephone"
                value={editForm.telephone}
                onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Website"
                value={editForm.website}
                onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
              />
              <div className="flex gap-2">
                <Input
                  type="time"
                  placeholder="Open Time"
                  value={editForm.openTime}
                  onChange={e => setEditForm(f => ({ ...f, openTime: e.target.value }))}
                />
                <Input
                  type="time"
                  placeholder="Close Time"
                  value={editForm.closeTime}
                  onChange={e => setEditForm(f => ({ ...f, closeTime: e.target.value }))}
                />
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={e =>
                  setEditForm(f => ({
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
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>       
        )}

        {/* Add Service Modal */}
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm space-y-4"
              onSubmit={handleAddService}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">
                  {editServiceId ? "Edit Service" : "Add Service"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddServiceModal(false);
                    setEditServiceId(null);
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Input
                placeholder="Service name"
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isAddingService}>
                  {isAddingService ? (editServiceId ? "Saving..." : "Adding...") : (editServiceId ? "Save" : "Add")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddServiceModal(false);
                    setEditServiceId(null);
                  }}
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
}

export default ClinicDetail;