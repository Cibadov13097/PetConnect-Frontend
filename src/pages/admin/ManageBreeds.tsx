import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ManageBreeds = () => {
  const [breeds, setBreeds] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    animalId: "",
  });
  const [editForm, setEditForm] = useState({ ...addForm });
  const [filterAnimalId, setFilterAnimalId] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBreedId, setDeleteBreedId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const token = sessionStorage.getItem("adminToken") || "";

  useEffect(() => {
    const fetchBreeds = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/Breed/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBreeds(await res.json());
      setLoading(false);
    };
    fetchBreeds();
  }, [token]);

  useEffect(() => {
    fetch("/api/Animal/getAll")
      .then((res) => res.json())
      .then((data) => setAnimals(data || []));
  }, []);

  // Filter dəyişdikdə breed-ləri fetch et
  useEffect(() => {
    if (filterAnimalId) {
      setLoading(true);
      fetch(`/api/admin/Breed/getAllByAnimalType?animalId=${filterAnimalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setBreeds(data || []);
          setLoading(false);
        });
    } else {
      setLoading(true);
      fetch("/api/admin/Breed/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setBreeds(data || []);
          setLoading(false);
        });
    }
  }, [filterAnimalId, token]);

  // Add breed
  const handleAddBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      Name: addForm.name,
      AnimalId: addForm.animalId,
    };
    const res = await fetch("/api/admin/Breed/add", {
      method: "PUT", // <-- PUT olmalıdır!
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowCreateModal(false);
      setAddForm({ name: "", animalId: "" });
      // Refresh breeds
      const breedsRes = await fetch("/api/admin/Breed/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (breedsRes.ok) setBreeds(await breedsRes.json());
    }
  };

  // Edit breed
  const handleEditBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const body = {
      Name: editForm.name,
      AnimalId: editForm.animalId,
    };
    const res = await fetch(`/api/admin/Breed/edit/${editId}`, {
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
      // Refresh breeds
      const breedsRes = await fetch("/api/admin/Breed/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (breedsRes.ok) setBreeds(await breedsRes.json());
    }
  };

  // Fill edit form
  const startEdit = (breed: any) => {
    setEditId(breed.id);
    setEditForm({
      name: breed.name || "",
      animalId: breed.animalId || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteBreed = (id: number) => {
    setDeleteBreedId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBreed = async () => {
    if (!deleteBreedId) return;
    const res = await fetch(`/api/admin/Breed/delete/${deleteBreedId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setBreeds(breeds => breeds.filter(b => b.id !== deleteBreedId));
    setDeleteDialogOpen(false);
    setDeleteBreedId(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) {
      // Əgər boşdursa, bütün breed-ləri göstər
      const res = await fetch("/api/admin/Breed/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBreeds(await res.json());
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/Breed/search?text=${encodeURIComponent(searchText)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setBreeds(await res.json());
    } else {
      setBreeds([]);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage Breeds</h2>
      
      {/* Animal Type Filter */}
      <div className="mb-6 flex items-center gap-3">
        <label className="font-medium text-[#fbbf24]">Filter by Animal Type:</label>
        <select
          className="border rounded px-3 py-2"
          value={filterAnimalId}
          onChange={e => setFilterAnimalId(e.target.value)}
        >
          <option value="">All</option>
          {animals.map(animal => (
            <option key={animal.id} value={animal.id}>
              {animal.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search Bar */}
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <Input
          placeholder="Search by breed name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" onClick={() => { setSearchText(""); handleSearch({ preventDefault: () => {} } as React.FormEvent); }}>
          Clear
        </Button>
      </form>

      <Button className="mb-6" onClick={() => setShowCreateModal(true)}>
        <span className="font-semibold text-[#18181b]">Create Breed</span>
      </Button>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Add Breed</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleAddBreed}>
            <Input placeholder="Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required />
            <div>
              <label className="block mb-1 font-medium">Animal Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={addForm.animalId}
                onChange={e => setAddForm(f => ({ ...f, animalId: e.target.value }))}
                required
              >
                <option value="">Select animal type</option>
                {animals.map(animal => (
                  <option key={animal.id} value={animal.id}>
                    {animal.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="submit">Add Breed</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Edit Breed</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditBreed}>
            <Input placeholder="Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
            <div>
              <label className="block mb-1 font-medium">Animal Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={editForm.animalId}
                onChange={e => setEditForm(f => ({ ...f, animalId: e.target.value }))}
                required
              >
                <option value="">Select animal type</option>
                {animals.map(animal => (
                  <option key={animal.id} value={animal.id}>
                    {animal.name}
                  </option>
                ))}
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
            <DialogTitle className="text-[#fbbf24]">Delete Breed</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-700">
            Bu breed-i silmək istədiyinizə əminsiniz?<br />
            Silinən breed geri qaytarılmayacaq.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteBreed}>Bəli, sil</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İmtina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Breeds List */}
      <h3 className="text-lg font-bold mt-8 mb-4 text-[#fbbf24]">All Breeds</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {breeds.map(breed => (
            <Card key={breed.id} className="flex flex-col md:flex-row items-center justify-between p-4">
              <div>
                <div className="font-bold text-[#fbbf24]">{breed.name}</div>
                <div className="text-xs text-gray-400">
                  {animals.find(a => a.id === breed.animalId)?.name || breed.animalId}
                </div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button size="sm" variant="outline" onClick={() => startEdit(breed)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteBreed(breed.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageBreeds;