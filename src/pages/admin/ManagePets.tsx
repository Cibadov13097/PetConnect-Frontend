import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ManagePets = () => {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    location: "",
    birthDate: "",
    breedId: "",
    gender: "Male",
    isActive: true,
    image: null as File | null,
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...addForm });
  const [breeds, setBreeds] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [animalId, setAnimalId] = useState(""); // seçilmiş heyvan tipi
  const [allBreeds, setAllBreeds] = useState<any[]>([]);
  const [filterAnimalId, setFilterAnimalId] = useState("");
  const [filterBreedId, setFilterBreedId] = useState("");
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [filterBreeds, setFilterBreeds] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePetId, setDeletePetId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const token = sessionStorage.getItem("adminToken") || "";

  // Fetch pets
  useEffect(() => {
    const fetchPets = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/Pet/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPets(await res.json());
      setLoading(false);
    };
    fetchPets();
  }, [token]);

  // Animal tiplərini fetch et
  useEffect(() => {
    fetch("/api/Animal/getAll")
      .then((res) => res.json())
      .then((data) => setAnimals(data || []));
  }, []);

  // AnimalId dəyişdikdə breed-ləri fetch et
  useEffect(() => {
    if (animalId) {
      fetch(`/api/Breed/getAllByAnimalType?animalId=${animalId}`)
        .then((res) => res.json())
        .then((data) => setBreeds(data || []));
    } else {
      setBreeds([]);
    }
  }, [animalId]);

  // Bütün breed-ləri fetch et
  useEffect(() => {
    fetch("/api/admin/Breed/getAll", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAllBreeds(data || []));
  }, [token]);

  // Add pet
  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("Name", addForm.name);
    formData.append("Description", addForm.description);
    formData.append("Location", addForm.location);
    formData.append("BirthDate", addForm.birthDate);
    formData.append("BreedId", addForm.breedId);
    formData.append("Gender", addForm.gender);
    formData.append("isActive", addForm.isActive ? "true" : "false");
    if (addForm.image) formData.append("ImageFile", addForm.image);

    const res = await fetch("/api/admin/Pet/add", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      const petsRes = await fetch("/api/admin/Pet/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (petsRes.ok) setPets(await petsRes.json());
      setAddForm({
        name: "",
        description: "",
        location: "",
        birthDate: "",
        breedId: "",
        gender: "Male",
        isActive: true,
        image: null,
      });
      setShowCreateModal(false);
    }
  };

  // Edit pet
  const handleEditPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const formData = new FormData();
    formData.append("Name", editForm.name);
    formData.append("Description", editForm.description);
    formData.append("Location", editForm.location);
    formData.append("BirthDate", editForm.birthDate);
    formData.append("BreedId", editForm.breedId);
    formData.append("Gender", editForm.gender);
    formData.append("isActive", editForm.isActive ? "true" : "false");
    if (editForm.image) formData.append("ImageFile", editForm.image);

    const res = await fetch(`/api/admin/Pet/edit/${editId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      const petsRes = await fetch("/api/admin/Pet/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (petsRes.ok) setPets(await petsRes.json());
      setEditId(null);
      setShowEditModal(false);
    }
  };

  const handleDeletePet = (id: number) => {
    setDeletePetId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePet = async () => {
    if (!deletePetId) return;
    const res = await fetch(`/api/admin/Pet/delete/${deletePetId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPets(pets => pets.filter(p => p.id !== deletePetId));
    setDeleteDialogOpen(false);
    setDeletePetId(null);
  };

  // Fill edit form
  const startEdit = async (pet: any) => {
    // 1. Breed-i tap
    let breed = breeds.find(b => b.id === pet.breedId);

    // 2. Əgər breed tapılmırsa və ya breeds boşdursa, bütün breed-ləri fetch et və tap
    if (!breed) {
      const allBreedsRes = await fetch("/api/admin/Breed/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allBreeds = await allBreedsRes.json();
      breed = allBreeds.find((b: any) => b.id === pet.breedId);
    }

    // 3. AnimalId-ni breed-dən tap və set et
    const foundAnimalId = breed ? breed.animalId : "";
    setAnimalId(foundAnimalId);

    // 4. Breed-ləri həmin animal tipinə görə fetch et və set et
    if (foundAnimalId) {
      const breedsRes = await fetch(`/api/Breed/getAllByAnimalType?animalId=${foundAnimalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const breedsData = await breedsRes.json();
      setBreeds(breedsData || []);
    }

    // 5. Edit formu doldur
    setEditId(pet.id);
    setEditForm({
      name: pet.name || "",
      description: pet.description || "",
      location: pet.location || "",
      birthDate: pet.birthDate ? pet.birthDate.slice(0, 10) : "",
      breedId: pet.breedId || "",
      gender: pet.gender || "Male",
      isActive: pet.isActive ?? true,
      image: null,
    });
    setShowEditModal(true);
  };

  // Animal filter dəyişdikdə breed-ləri fetch et
  useEffect(() => {
    if (filterAnimalId) {
      fetch(`/api/Breed/getAllByAnimalType?animalId=${filterAnimalId}`)
        .then((res) => res.json())
        .then((data) => setFilterBreeds(data || []));
    } else {
      setFilterBreeds([]);
    }
    setFilterBreedId(""); // animal dəyişəndə breed filteri sıfırlansın
  }, [filterAnimalId]);

  // Filterlənmiş pet-ləri hesabla
  useEffect(() => {
    let result = pets;
    if (filterAnimalId) {
      const breedIds = filterBreeds.map(b => b.id);
      result = result.filter(pet => breedIds.includes(pet.breedId));
    }
    if (filterBreedId) {
      result = result.filter(pet => String(pet.breedId) === String(filterBreedId));
    }
    setFilteredPets(result);
  }, [pets, filterAnimalId, filterBreedId, filterBreeds]);

  // Search pets
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) {
      // Əgər boşdursa, bütün pet-ləri göstər
      setFilteredPets(pets);
      return;
    }
    setSearchLoading(true);
    const res = await fetch(`/api/admin/Pet/search?text=${encodeURIComponent(searchText)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setFilteredPets(await res.json());
    } else {
      setFilteredPets([]);
    }
    setSearchLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-extrabold mb-4 text-[#fbbf24]">Manage Pets</h2>

      {/* Filterlər */}
      <div className="mb-6 flex gap-4 items-center">
        {/* Animal Type Filter */}
        <div>
          <label className="font-medium text-[#fbbf24]">Filter by Animal Type:</label>
          <select
            className="border rounded px-3 py-2 ml-2"
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
        {/* Breed Type Filter */}
        <div>
          <label className="font-medium text-[#fbbf24]">Filter by Breed:</label>
          <select
            className="border rounded px-3 py-2 ml-2"
            value={filterBreedId}
            onChange={e => setFilterBreedId(e.target.value)}
            disabled={!filterAnimalId}
          >
            <option value="">All</option>
            {filterBreeds.map(breed => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <Input
          placeholder="Search by pet name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearchText("");
            setFilteredPets(pets);
          }}
        >
          Clear
        </Button>
      </form>

      {/* Create Modal
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Add Pet</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleAddPet}>
            <Input placeholder="Name" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Description" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} required />
            <Input placeholder="Location" value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))} required />
            <Input type="date" placeholder="Birth Date" value={addForm.birthDate} onChange={e => setAddForm(f => ({ ...f, birthDate: e.target.value }))} required />
            {/* Animal select */}
            {/* <div>
              <label className="block mb-1 font-medium">Animal Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={animalId}
                onChange={e => {
                  setAnimalId(e.target.value);
                  setAddForm(f => ({ ...f, breedId: "" }));
                }}
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
            {/* Breed select */}
            {/* <div>
              <label className="block mb-1 font-medium">Breed</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={addForm.breedId}
                onChange={e => setAddForm(f => ({ ...f, breedId: e.target.value }))}
                required
                disabled={!animalId}
              >
                <option value="">Select breed</option>
                {breeds.map((breed: any) => (
                  <option key={breed.id} value={breed.id}>
                    {breed.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Gender select */}
            {/* <div>
              <label className="block mb-1 font-medium">Gender</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={addForm.gender}
                onChange={e => setAddForm(f => ({ ...f, gender: e.target.value }))}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            {/* Status radio */}
            {/* <div>
              <label className="block mb-1 font-medium">Status</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    checked={addForm.isActive === true}
                    onChange={() => setAddForm(f => ({ ...f, isActive: true }))}
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    checked={addForm.isActive === false}
                    onChange={() => setAddForm(f => ({ ...f, isActive: false }))}
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
            {/* Image upload */}
            {/* <Input type="file" accept="image/*" onChange={e => setAddForm(f => ({ ...f, image: e.target.files && e.target.files[0] ? e.target.files[0] : null }))} />
            <DialogFooter>
              <Button type="submit">Add Pet</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog> */}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#fbbf24]">Edit Pet</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleEditPet}>
            <Input placeholder="Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
            <Input placeholder="Description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required />
            <Input placeholder="Location" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} required />
            <Input type="date" placeholder="Birth Date" value={editForm.birthDate} onChange={e => setEditForm(f => ({ ...f, birthDate: e.target.value }))} required />
            {/* Animal select */}
            <div>
              <label className="block mb-1 font-medium">Animal Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={animalId}
                onChange={e => {
                  setAnimalId(e.target.value);
                  setEditForm(f => ({ ...f, breedId: "" }));
                }}
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
            {/* Breed select */}
            <div>
              <label className="block mb-1 font-medium">Breed</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={editForm.breedId}
                onChange={e => setEditForm(f => ({ ...f, breedId: e.target.value }))}
                required
                disabled={!animalId}
              >
                <option value="">Select breed</option>
                {breeds.map((breed: any) => (
                  <option key={breed.id} value={breed.id}>
                    {breed.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Gender select */}
            <div>
              <label className="block mb-1 font-medium">Gender</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={editForm.gender}
                onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            {/* Status radio */}
            <div>
              <label className="block mb-1 font-medium">Status</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    checked={editForm.isActive === true}
                    onChange={() => setEditForm(f => ({ ...f, isActive: true }))}
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    checked={editForm.isActive === false}
                    onChange={() => setEditForm(f => ({ ...f, isActive: false }))}
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
            {/* Image upload */}
            <Input type="file" accept="image/*" onChange={e => setEditForm(f => ({ ...f, image: e.target.files && e.target.files[0] ? e.target.files[0] : null }))} />
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
            <DialogTitle className="text-[#fbbf24]">Delete Pet</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-gray-700">
            Bu pet-i silmək istədiyinizə əminsiniz?<br />
            Silinən pet geri qaytarılmayacaq.
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeletePet}>Bəli, sil</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İmtina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pets List */}
      <h3 className="text-lg font-bold mt-8 mb-4 text-[#fbbf24]">All Pets</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filteredPets.map(pet => (
            <Card key={pet.id} className="flex flex-col md:flex-row items-center justify-between p-4">
              <div className="flex items-center gap-4">
                {/* Pet şəkli */}
                {(pet.imageUrl || pet.image) ? (
                  <img
                    src={pet.imageUrl || pet.image}
                    alt={pet.name}
                    className="w-20 h-20 object-cover rounded-full border-2 border-[#fbbf24]"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full text-3xl text-gray-400">
                    🐾
                  </div>
                )}
                <div>
                  <div className="font-bold text-[#fbbf24]">{pet.name}</div>
                  <div className="text-sm text-[#fbbf24]">{pet.description}</div>
                  <div className="text-xs text-gray-400">{pet.location}</div>
                  <div className="text-xs text-gray-400">{pet.birthDate?.slice(0, 10)}</div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${pet.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {pet.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 ml-2">
                    {allBreeds.find(b => b.id === pet.breedId)?.name || pet.breedId}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button size="sm" variant="outline" onClick={() => startEdit(pet)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeletePet(pet.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagePets;