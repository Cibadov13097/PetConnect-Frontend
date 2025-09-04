import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ManageServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, [token]);

  const fetchServices = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/Service", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setServices(await res.json());
    setLoading(false);
  };

  // Edit modal aç
  const startEdit = (service: any) => {
    setEditId(service.id);
    setEditForm({
      name: service.name || "",
    });
    setShowEditModal(true);
  };

  // Editi göndər
  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const body = {
      Name: editForm.name,
    };
    const res = await fetch(`/api/admin/Service/edit/${editId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowEditModal(false);
      setEditId(null);
      fetchServices();
    }
  };

  // Delete modal aç
  const handleDeleteService = (id: number) => {
    setDeleteServiceId(id);
    setDeleteDialogOpen(true);
  };

  // Delete göndər
  const confirmDeleteService = async () => {
    if (!deleteServiceId) return;
    const res = await fetch(`/api/admin/Service/admin/${deleteServiceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok || res.status === 204) {
      setServices(services => services.filter(s => s.id !== deleteServiceId));
    }
    setDeleteDialogOpen(false);
    setDeleteServiceId(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) {
      fetchServices();
      return;
    }
    setSearchLoading(true);
    const res = await fetch(`/api/admin/Service/search?text=${encodeURIComponent(searchText)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setServices(await res.json());
    } else {
      setServices([]);
    }
    setSearchLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage Services</h2>
      
      {/* Search Bar */}
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <Input
          placeholder="Search by service name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearchText("");
            fetchServices();
          }}
        >
          Clear
        </Button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {services.map(service => (
            <div key={service.id} className="flex items-center justify-between p-4 border rounded bg-white shadow">
              <div>
                <div className="font-bold text-[#fbbf24]">{service.name}</div>
                <div className="text-xs text-gray-400">ID: {service.id}</div>
                <div className="text-xs text-gray-400">Organization ID: {service.organizationId}</div>
                <div className="text-xs text-gray-400">Description: {service.description}</div>
                <div className="text-xs text-gray-400">Price: {service.price}</div>
                <div className="text-xs text-gray-400">Duration: {service.duration} minutes</div>
              </div>
              <div>
                <Button variant="default" className="mr-2" onClick={() => startEdit(service)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteService(service.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Edit Service</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditService}>
            <Input
              placeholder="Name"
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Delete Service</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-700">
            Bu servisi silmək istədiyinizə əminsiniz?<br />
            Silinən servis geri qaytarılmayacaq.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteService}>Bəli, sil</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İmtina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageServices;