import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Calendar, Building2, Edit, Home, DollarSign, Plus } from "lucide-react";

const Profile = () => {
  const { token, isAuthenticated } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    userName: "",
    fullname: "",
    email: "",
    telephoneNumber: ""
  });
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [isAddingBalance, setIsAddingBalance] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/User/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUser(await res.json());
      }
    };
    if (isAuthenticated) fetchUser();
  }, [token, isAuthenticated]);

  useEffect(() => {
    const fetchMyOrg = async () => {
      try {
        const res = await fetch("/api/Organization/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrganization(data);
        }
      } catch {}
    };
    if (isAuthenticated) fetchMyOrg();
  }, [token, isAuthenticated]);

  const orgTypeName =
    organization?.organizationType === "Shop"
      ? "Shop"
      : organization?.organizationType === "Clinic"
      ? "Clinic"
      : organization?.organizationType === "Shelter"
      ? "Shelter"
      : "Organization";

  useEffect(() => {
    if (user) {
      setEditForm({
        userName: user.userName || "",
        fullname: user.fullname || "",
        email: user.email || "",
        telephoneNumber: user.telephoneNumber || ""
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef]">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-10">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <User className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            {user?.userName || user?.fullname || user?.name || user?.email}
          </h1>
          <Badge variant="outline" className="text-base px-3 py-1 rounded-full">
            {user?.userType || user?.role}
          </Badge>
          <p className="text-muted-foreground mt-2">
            Welcome to your profile page!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* User Info Card */}
          <Card className="shadow-md border-0 bg-white/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account Details
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="ml-2"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-[15px]">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="font-medium">User Name:</span> {user?.userName || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="font-medium">Full Name:</span> {user?.fullname || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="font-medium">Telephone Number:</span> {user?.telephoneNumber || "-"}
                  </span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined:{" "}
                    {user?.createdDate
                      ? new Date(user.createdDate).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Budget: {user?.budget !== undefined ? user.budget : "-"}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-2"
                      onClick={() => setShowAddBalance(true)}
                      title="Add Balance"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Badge>
                </div>
                {user?.id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      User ID: {user.id}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organization Info Card */}
          {organization && (
            <Card className="shadow-md border-0 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  My {orgTypeName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-[15px]">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{organization.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-1">
                      {orgTypeName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{organization.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{organization.email}</span>
                  </div>
                  {organization.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{organization.phone}</span>
                    </div>
                  )}
                  {organization.createdDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Created:{" "}
                        {new Date(organization.createdDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      if (organization?.organizationType === "Shop" || user?.userType === "ShopOwner") {
                        navigate("/shop-detail", { state: { shopId: organization?.id } });
                      } else if (organization?.organizationType === "Shelter" || user?.userType === "ShelterOwner") {
                        navigate("/shelter-detail", { state: { shelterId: organization?.id } });
                      } else if (organization?.organizationType === "Clinic" || user?.userType === "ClinicOwner") {
                        navigate("/clinic-detail", { state: { clinicId: organization?.id } });
                      }
                    }}
                    className="w-full"
                  >
                    {organization?.organizationType === "Shop" || user?.userType === "ShopOwner"
                      ? "Go to Shop"
                      : organization?.organizationType === "Shelter" || user?.userType === "ShelterOwner"
                      ? "Go to Shelter"
                      : organization?.organizationType === "Clinic" || user?.userType === "ClinicOwner"
                      ? "Go to Clinic"
                      : "Go to Organization"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit User Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch("/api/User/me", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      userName: editForm.userName,
                      fullname: editForm.fullname,
                      email: editForm.email,
                      telephoneNumber: editForm.telephoneNumber
                    }),
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setUser(updated);
                    setEditOpen(false);
                    toast({ title: "Profile updated!" });
                  } else {
                    toast({ title: "Update failed", variant: "destructive" });
                  }
                } catch {
                  toast({ title: "Update failed", variant: "destructive" });
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">User Name</label>
                  <Input
                    value={editForm.userName}
                    onChange={e => setEditForm(f => ({ ...f, userName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Full Name</label>
                  <Input
                    value={editForm.fullname}
                    onChange={e => setEditForm(f => ({ ...f, fullname: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Email</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Telephone Number</label>
                  <Input
                    value={editForm.telephoneNumber}
                    onChange={e => setEditForm(f => ({ ...f, telephoneNumber: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Balance Modal */}
        <Dialog open={showAddBalance} onOpenChange={setShowAddBalance}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Balance</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!balanceInput || isNaN(Number(balanceInput))) {
                  toast({ title: "Please enter a valid amount", variant: "destructive" });
                  return;
                }
                setIsAddingBalance(true);
                try {
                  const res = await fetch(`/api/Balance/Add?budget=${balanceInput}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) {
                    const newBudget = await res.json();
                    setUser((prev: any) => ({ ...prev, budget: newBudget }));
                    setShowAddBalance(false);
                    setBalanceInput("");
                    toast({ title: "Balance added!" });
                  } else {
                    toast({ title: "Failed to add balance", variant: "destructive" });
                  }
                } catch {
                  toast({ title: "Failed to add balance", variant: "destructive" });
                } finally {
                  setIsAddingBalance(false);
                }
              }}
            >
              <div className="space-y-4">
                <Input
                  type="number"
                  min={1}
                  placeholder="Amount"
                  value={balanceInput}
                  onChange={e => setBalanceInput(e.target.value)}
                  required
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddBalance(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingBalance}>
                  {isAddingBalance ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;