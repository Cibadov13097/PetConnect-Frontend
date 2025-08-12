import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const MyPets = () => {
  const { user, isAuthenticated, token } = useAuth();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    location: "",
    birthDate: "",
    image: null as File | null,
    breedId: "",
    gender: "Male", // default value
  });
  const [submitting, setSubmitting] = useState(false);
  const [animals, setAnimals] = useState<any[]>([]);
  const [breeds, setBreeds] = useState<any[]>([]);
  const [animalId, setAnimalId] = useState(""); // for selected animal
  const [editModal, setEditModal] = useState<{ open: boolean; pet: any | null }>({ open: false, pet: null });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    location: "",
    birthDate: "",
    image: null as File | null,
    breedId: "",
    gender: "Male",
  });

  useEffect(() => {
    const fetchPets = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/Pet/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPets(data.items || data || []);
        }
      } catch {
        setPets([]);
      }
      setLoading(false);
    };
    if (isAuthenticated) fetchPets();
  }, [isAuthenticated]);

  // Fetch all animals on mount
  useEffect(() => {
    fetch("/api/Animal/getAll")
      .then((res) => res.json())
      .then((data) => setAnimals(data || []));
  }, []);

  // Fetch breeds when animalId changes
  useEffect(() => {
    if (animalId) {
      fetch(`/api/Breed/getAllByAnimalType?animalId=${animalId}`)
        .then((res) => res.json())
        .then((data) => setBreeds(data || []));
    } else {
      setBreeds([]);
    }
  }, [animalId]);

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("Name", addForm.name);
      formData.append("Description", addForm.description);
      formData.append("Location", addForm.location);
      formData.append("BirthDate", addForm.birthDate);
      formData.append("BreedId", addForm.breedId);
      formData.append("Gender", addForm.gender);
      if (addForm.image) formData.append("ImageFile", addForm.image);

      const res = await fetch("/api/Pet/add", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({
          name: "",
          description: "",
          location: "",
          birthDate: "",
          image: null,
          breedId: "",
          gender: "Male",
        });
        setAnimalId("");
        // Refresh pets list
        const data = await res.json();
        setPets((prev) => [...prev, data]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to get animalId from breedId
  const getAnimalIdByBreedId = (breedId: string) => {
    const breed = breeds.find((b) => b.id === breedId);
    return breed ? breed.animalId : "";
  };

  const openEditModal = async (pet: any) => {
    if (!pet.id) {
      alert("Pet ID tapılmadı!");
      return;
    }
    // Find the breed to get animalId
    let breedAnimalId = "";
    // If breeds are not loaded yet, fetch all breeds first
    if (!breeds.length) {
      const allBreedsRes = await fetch("/api/Breed/getAll");
      const allBreeds = await allBreedsRes.json();
      setBreeds(allBreeds || []);
      const breed = allBreeds.find((b: any) => b.id === pet.breedId);
      breedAnimalId = breed ? breed.animalId : "";
    } else {
      const breed = breeds.find((b: any) => b.id === pet.breedId);
      breedAnimalId = breed ? breed.animalId : "";
    }

    // Fetch breeds for this animal type
    if (breedAnimalId) {
      const res = await fetch(`/api/Breed/getAllByAnimalType?animalId=${breedAnimalId}`);
      const data = await res.json();
      setBreeds(data || []);
    }

    setEditForm({
      name: pet.name || "",
      description: pet.description || "",
      location: pet.location || "",
      birthDate: pet.birthDate ? pet.birthDate.slice(0, 10) : "",
      image: null,
      breedId: pet.breedId || "",
      gender: pet.gender || "Male",
    });
    setEditModal({ open: true, pet });
  };

  const handleEditPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.pet) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("Name", editForm.name);
      formData.append("Description", editForm.description);
      formData.append("Location", editForm.location);
      formData.append("BirthDate", editForm.birthDate);
      formData.append("BreedId", editForm.breedId);
      formData.append("Gender", editForm.gender);
      if (editForm.image) formData.append("ImageFile", editForm.image);

      const res = await fetch(`/api/Pet/edit/${editModal.pet.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const updatedPet = await res.json();
        setPets((prev) =>
          prev.map((p) => (p.id === updatedPet.id ? updatedPet : p))
        );
        setEditModal({ open: false, pet: null });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to calculate age from birthDate
  const getAge = (birthDate: string) => {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    // Show "0" for less than 1 year
    if (age <= 0) {
      // Calculate months
      let months =
        (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth());
      if (now.getDate() < birth.getDate()) months--;
      if (months <= 0) months = 0;
      return months === 1 ? "1 month old" : `${months} months old`;
    }
    return age === 1 ? "1 year old" : `${age} years old`;
  };

  if (!isAuthenticated) {
    return <div className="text-center mt-10 text-lg">Please login to view your pets.</div>;
  }

  return (
    <>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Pets</h1>
          <Button onClick={() => setShowAddModal(true)}>Add Pet</Button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : pets.length === 0 ? (
          <div className="text-muted-foreground">You have no pets yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pets.map((pet: any, index) => (
              <Card
                key={pet.id ?? index}
                className="relative group shadow-xl border-0 bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.025] hover:shadow-2xl"
              >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-80" />
                <div className="relative z-10">
                  <div className="relative">
                    {(pet.image || pet.imageUrl) ? (
                      <img
                        src={pet.image || pet.imageUrl}
                        alt={pet.name}
                        className="w-full h-48 object-cover rounded-t-2xl border-b-4 border-primary/20 group-hover:brightness-95 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-slate-400 text-6xl rounded-t-2xl border-b-4 border-primary/20">
                        🐾
                      </div>
                    )}
                    <span className="absolute top-3 right-3 bg-white/80 rounded-full px-3 py-1 text-xs font-semibold text-primary shadow">
                      {pet.gender}
                    </span>
                  </div>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors truncate">
                      {pet.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3 min-h-[36px] italic">
                      {pet.description || "No description"}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 12.414a2 2 0 00-2.828 0l-4.243 4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {pet.location}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary px-2 py-1 rounded-full text-xs font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {pet.birthDate ? getAge(pet.birthDate) : ""}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                        {breeds.find((b) => b.id === pet.breedId)?.name || pet.breedId}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full font-semibold border-primary hover:bg-primary/10"
                        onClick={() => openEditModal(pet)}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Pet Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
              onSubmit={handleAddPet}
            >
              <h2 className="text-2xl font-bold mb-4">Add New Pet</h2>
              <Input
                placeholder="Name"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Description"
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
              <Input
                placeholder="Location"
                value={addForm.location}
                onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
                required
              />
              <Input
                type="date"
                placeholder="Birth Date"
                value={addForm.birthDate}
                onChange={(e) => setAddForm((f) => ({ ...f, birthDate: e.target.value }))}
                required
              />
              {/* Animal select */}
              <div>
                <label className="block mb-1 font-medium">Animal</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={animalId}
                  onChange={(e) => {
                    setAnimalId(e.target.value);
                    setAddForm((f) => ({ ...f, breedId: "" }));
                  }}
                  required
                >
                  <option value="">Select animal</option>
                  {animals.map((animal) => (
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
                  value={addForm.breedId}
                  onChange={(e) => setAddForm((f) => ({ ...f, breedId: e.target.value }))}
                  required
                  disabled={!animalId}
                >
                  <option value="">Select breed</option>
                  {breeds.map((breed) => (
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
                  required
                  onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))}
                  value={addForm.gender}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              {/* Image upload */}
              <div>
                <label className="block mb-1 font-medium">Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, image: e.target.files ? e.target.files[0] : null }))
                  }
                />
              </div>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Adding..." : "Add Pet"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Pet Modal */}
        {editModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
              onSubmit={handleEditPet}
            >
              <h2 className="text-2xl font-bold mb-4">Edit Pet</h2>
              <Input
                placeholder="Name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
              <Input
                placeholder="Location"
                value={editForm.location}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                required
              />
              <Input
                type="date"
                placeholder="Birth Date"
                value={editForm.birthDate}
                onChange={(e) => setEditForm((f) => ({ ...f, birthDate: e.target.value }))}
                required
              />
              {/* Breed select only */}
              <div>
                <label className="block mb-1 font-medium">Breed</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editForm.breedId}
                  onChange={(e) => setEditForm((f) => ({ ...f, breedId: e.target.value }))}
                  required
                >
                  <option value="">Select breed</option>
                  {breeds.map((breed) => (
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
                  onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    image: e.target.files ? e.target.files[0] : null,
                  }))
                }
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModal({ open: false, pet: null })}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default MyPets;