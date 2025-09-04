import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ORGANIZATION_TYPES = [
  { value: "", label: "All" },
  { value: "0", label: "Shop" },
  { value: "1", label: "Clinic" },
  { value: "2", label: "Shelter" },
  // Əlavə tiplər varsa, əlavə et
];

const ManageOrganizations = () => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    organizationType: "",
    image: null as File | null,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    location: "",
    telephone: "",
    website: "",
    email: "",
    openTime: "",
    closeTime: "",
    organizationType: "",
    image: null as File | null,
  });
  const [filterType, setFilterType] = useState(""); // filter üçün
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrgId, setDeleteOrgId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      let url = "/api/admin/Organization/getAll";
      if (filterType) {
        url = `/api/admin/Organization/getAllByOrganizationType?organizationType=${filterType}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrganizations(await res.json());
      setLoading(false);
    };
    fetchOrganizations();
  }, [token, filterType]);

  // Add organization
  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("Name", addForm.name);
    formData.append("Description", addForm.description);
    formData.append("OrganizationType", addForm.organizationType);
    if (addForm.image) formData.append("ImgFile", addForm.image);

    const res = await fetch("/api/admin/Organization/add", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      setShowCreateModal(false);
      setAddForm({
        name: "",
        description: "",
        organizationType: "",
        image: null,
      });
      // Refresh organizations
      const orgRes = await fetch("/api/admin/Organization/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orgRes.ok) setOrganizations(await orgRes.json());
    }
  };

  // Edit organization
  const handleEditOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const formData = new FormData();
    formData.append("Name", editForm.name);
    formData.append("Description", editForm.description);
    formData.append("Location", editForm.location);
    formData.append("Telephone", editForm.telephone);
    formData.append("Website", editForm.website);
    formData.append("Email", editForm.email);
    if (editForm.openTime) formData.append("OpenTime", editForm.openTime.length === 5 ? editForm.openTime + ":00" : editForm.openTime);
    if (editForm.closeTime) formData.append("CloseTime", editForm.closeTime.length === 5 ? editForm.closeTime + ":00" : editForm.closeTime);
    if (editForm.organizationType) formData.append("OrganizationType", editForm.organizationType);
    if (editForm.image) formData.append("ImgFile", editForm.image);

    const res = await fetch(`/api/admin/Organization/edit/${editId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      setShowEditModal(false);
      setEditId(null);
      const orgRes = await fetch("/api/admin/Organization/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orgRes.ok) setOrganizations(await orgRes.json());
    } else {
      // Error mesajını göstər
      const errorText = await res.text();
      alert(errorText);
    }
  };

  const handleDeleteOrganization = (id: number) => {
    setDeleteOrgId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOrganization = async () => {
    if (!deleteOrgId) return;
    const res = await fetch(`/api/admin/Organization/delete/${deleteOrgId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setOrganizations(orgs => orgs.filter(o => o.id !== deleteOrgId));
    setDeleteDialogOpen(false);
    setDeleteOrgId(null);
  };

  // Fill edit form
  const startEdit = (org: any) => {
    setEditId(org.id);
    setEditForm({
      name: org.name || "",
      description: org.description || "",
      location: org.location || "",
      telephone: org.telephone || "",
      website: org.website || "",
      email: org.email || "",
      openTime: org.openTime || "",
      closeTime: org.closeTime || "",
      organizationType: org.organizationType || "",
      image: null,
    });
    setShowEditModal(true);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) {
      // Əgər boşdursa, bütün organization-ları göstər
      setSearchLoading(true);
      const res = await fetch("/api/admin/Organization/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrganizations(await res.json());
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const res = await fetch(`/api/admin/Organization/search?text=${encodeURIComponent(searchText)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setOrganizations(await res.json());
    } else {
      setOrganizations([]);
    }
    setSearchLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage Organizations</h2>
      
      {/* Organization Type Filter */}
      <div className="mb-6 flex items-center gap-3">
        <label className="font-medium text-[#fbbf24]">Filter by Organization Type:</label>
        <select
          className="border rounded px-3 py-2"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          {ORGANIZATION_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Search Bar */}
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <Input
          placeholder="Search by organization name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearchText("");
            handleSearch({ preventDefault: () => {} } as React.FormEvent);
          }}
        >
          Clear
        </Button>
      </form>

      {/* Create Modal
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Add Organization</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleAddOrganization}>
            <Input placeholder="Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Description" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} required />
            <Input placeholder="Organization Type" value={addForm.organizationType} onChange={e => setAddForm(f => ({ ...f, organizationType: e.target.value }))} required />
            <Input type="file" accept="image/*" onChange={e => setAddForm(f => ({ ...f, image: e.target.files && e.target.files[0] ? e.target.files[0] : null }))} />
            <DialogFooter>
              <Button type="submit">Add Organization</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog> */}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Edit Organization</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditOrganization}>
            <Input placeholder="Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required />
            <Input placeholder="Location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
            <Input placeholder="Telephone" value={editForm.telephone} onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))} />
            <Input placeholder="Website" value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} />
            <Input placeholder="Email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Open Time</label>
                <Input type="time" value={editForm.openTime} onChange={e => setEditForm(f => ({ ...f, openTime: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Close Time</label>
                <Input type="time" value={editForm.closeTime} onChange={e => setEditForm(f => ({ ...f, closeTime: e.target.value }))} />
              </div>
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
            <div>
              <label className="block mb-1 font-medium">Organization Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={editForm.organizationType}
                onChange={e => setEditForm(f => ({ ...f, organizationType: e.target.value }))}
              >
                <option value="">Select type</option>
                <option value="Shelter">Shelter</option>
                <option value="Shop">Shop</option>
                <option value="Clinic">Clinic</option>
                {/* Digər tipləri əlavə et */}
              </select>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Delete Organization</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-700">
            Bu organization-u silmək istədiyinizə əminsiniz?<br />
            Silinən organization geri qaytarılmayacaq.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteOrganization}>Bəli, sil</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İmtina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organizations List */}
      <h3 className="text-lg font-bold mt-8 mb-4 text-[#fbbf24]">All Organizations</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {organizations.map(org => (
            <Card key={org.id} className="flex flex-col md:flex-row items-center justify-between p-4">
              <div className="flex items-center gap-4">
                {/* Organization şəkli */}
                {org.imageUrl ? (
                  <img
                    src={org.imageUrl}
                    alt={org.name}
                    className="w-20 h-20 object-cover rounded-full border-2 border-[#fbbf24]"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full text-3xl text-gray-400">
                    🏢
                  </div>
                )}
                <div>
                  <div className="font-bold text-[#fbbf24]">{org.name}</div>
                  <div className="text-sm text-[#fbbf24]">{org.description}</div>
                  <div className="text-xs text-gray-400">{org.organizationType}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button size="sm" variant="outline" onClick={() => startEdit(org)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteOrganization(org.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};

export default ManageOrganizations;