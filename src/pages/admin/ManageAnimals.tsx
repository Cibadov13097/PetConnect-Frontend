import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ManageAnimals = () => {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "" });
  const [createForm, setCreateForm] = useState({ name: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAnimalId, setDeleteAnimalId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    fetchAnimals();
    // eslint-disable-next-line
  }, [token]);

  const fetchAnimals = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/Animal/getAll", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setAnimals(await res.json());
    setLoading(false);
  };

  // Search animals by name
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) {
      fetchAnimals();
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/Animal/search?text=${encodeURIComponent(searchText)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setAnimals(await res.json());
    } else {
      setAnimals([]);
    }
    setLoading(false);
  };

  // Create animal
  const handleCreateAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { Name: createForm.name };
    const res = await fetch(`/api/admin/Animal/add?id=0`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowCreateModal(false);
      setCreateForm({ name: "" });
      fetchAnimals();
    }
  };

  // Edit animal
  const handleEditAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const body = { Name: editForm.name };
    const res = await fetch(`/api/admin/Animal/edit/${editId}`, {
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
      fetchAnimals();
    }
  };

  // Delete animal
  const handleDeleteAnimal = (id: number) => {
    setDeleteAnimalId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAnimal = async () => {
    if (!deleteAnimalId) return;
    const res = await fetch(`/api/admin/Animal/delete/${deleteAnimalId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchAnimals();
    setDeleteDialogOpen(false);
    setDeleteAnimalId(null);
  };

  // Fill edit form
  const startEdit = (animal: any) => {
    setEditId(animal.id);
    setEditForm({ name: animal.name || "" });
    setShowEditModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage Animals</h2>
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <Input
          placeholder="Search by name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" onClick={() => { setSearchText(""); fetchAnimals(); }}>
          Clear
        </Button>
      </form>
      <Button className="mb-6" onClick={() => setShowCreateModal(true)}>
        <span className="font-semibold text-[#18181b]">Create Animal</span>
      </Button>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {animals.map(animal => (
            <div key={animal.id} className="flex items-center justify-between p-4 border rounded bg-white shadow">
              <div>
                <div className="font-bold text-[#fbbf24]">{animal.name}</div>
                <div className="text-xs text-gray-400">ID: {animal.id}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(animal)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteAnimal(animal.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Create Animal</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleCreateAnimal}>
            <Input
              placeholder="Name"
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <DialogFooter>
              <Button type="submit">Add Animal</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Edit Animal</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditAnimal}>
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
            <DialogTitle className="text-[#fbbf24]">Delete Animal</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-700">
            Bu heyvanı silmək istədiyinizə əminsiniz?<br />
            Silinən heyvan geri qaytarılmayacaq.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteAnimal}>Bəli, sil</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İmtina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageAnimals;