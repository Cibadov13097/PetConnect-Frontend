import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://localhost:7213";

type Pet = {
  id: number;
  name: string;
  imageUrl?: string;
  age?: number;
  breed?: string;
  breedId?: number;
  animalId?: number;
  description?: string;
  userId: string;
  isActive?: boolean;
};

type Animal = {
  id: number;
  name: string;
};

type Breed = {
  id: number;
  name: string;
  animalId: number;
};

const PairPetPage = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activePets, setActivePets] = useState<Pet[]>([]);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSelectWarning, setShowSelectWarning] = useState(false);

  // Filter states
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | "">("");
  const [selectedBreedId, setSelectedBreedId] = useState<number | "">("");
  const [pendingAnimalId, setPendingAnimalId] = useState<number | "">("");
  const [pendingBreedId, setPendingBreedId] = useState<number | "">("");
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [filterApplied, setFilterApplied] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);

  // Fetch animals
  useEffect(() => {
    fetch(`${API_BASE}/api/Animal/getAll`)
      .then(res => res.json())
      .then(data => {
        console.log("Animals from API:", data);
        setAnimals(data);
      })
      .catch(() => setAnimals([]));
  }, []);

  // Fetch breeds by animal
  useEffect(() => {
    if (!pendingAnimalId) {
      setBreeds([]);
      return;
    }
    fetch(`${API_BASE}/api/Breed/getAllByAnimalType?animalId=${pendingAnimalId}`)
      .then(res => res.json())
      .then(data => {
        console.log("Breeds for animalId", pendingAnimalId, ":", data);
        setBreeds(data);
      })
      .catch(() => setBreeds([]));
  }, [pendingAnimalId]);

  // Fetch user's pets for dropdown
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/Pet/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUserPets(data);
        if (data.length > 0) setSelectedPetId(data[0].id);
      })
      .catch(() => setUserPets([]));
  }, [token]);

  // Fetch pets according to filter
  useEffect(() => {
    if (!filterApplied) {
      // Default: bütün aktiv petlər
      fetch(`${API_BASE}/api/Tinder/getAllActivePets`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setFilteredPets(data.filter((p: Pet) => p.isActive)))
        .catch(() => setFilteredPets([]));
    } else if (pendingBreedId) {
      // Breed filter
      fetch(`${API_BASE}/api/Tinder/getAllActivePetsByBreed/${pendingBreedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setFilteredPets(data.filter((p: Pet) => p.isActive)))
        .catch(() => setFilteredPets([]));
    } else if (pendingAnimalId) {
      // Animal filter
      fetch(`${API_BASE}/api/Tinder/getAllActivePetsByAnimalType/${pendingAnimalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setFilteredPets(data.filter((p: Pet) => p.isActive)))
        .catch(() => setFilteredPets([]));
    }
  }, [filterApplied, pendingAnimalId, pendingBreedId, token]);

  // Like a pet
  const handleLike = async (targetPetId: number) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedPetId) {
      setShowSelectWarning(true);
      return;
    }
    setShowSelectWarning(false);
    await fetch(`${API_BASE}/api/Tinder/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ActorPetId: selectedPetId, TargetPetId: targetPetId }),
    });
    setCurrentIndex(i => i + 1);
  };

  // Skip a pet
  const handleSkip = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedPetId || !filteredPets[currentIndex]) {
      setCurrentIndex(i => i + 1);
      return;
    }
    // Skip endpointə request at
    await fetch(`${API_BASE}/api/Tinder/skip`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ActorPetId: selectedPetId,
        TargetPetId: filteredPets[currentIndex].id
      }),
    });
    setCurrentIndex(i => i + 1);
  };

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/MemberSubscription/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => setActivePlan(data))
      .catch(() => setActivePlan(null));
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pair Pets (Tinder)</h1>
      {/* Filter section */}
      <div className="mb-6 max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-semibold text-primary">Animal type</label>
          <div className="relative">
            <select
              className="w-full px-4 py-3 rounded-lg border-2 border-primary focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm bg-white font-medium"
              value={pendingAnimalId}
              onChange={e => {
                if (!activePlan) {
                  window.location.href = "/member-subscription";
                  return;
                }
                const val = e.target.value;
                setPendingAnimalId(val ? Number(val) : "");
                setPendingBreedId("");
              }}
              disabled={animals.length === 0}
              style={!activePlan ? { cursor: "pointer", backgroundColor: "#fffbe6" } : {}}
            >
              <option value="">All animals</option>
              {animals.map(animal => (
                <option key={animal.id} value={animal.id}>
                  {animal.name}
                </option>
              ))}
            </select>
            {!activePlan && (
              <span
                className="absolute right-3 top-3 text-yellow-500 cursor-pointer flex items-center"
                title="Bu filtr üçün üzvlük planı tələb olunur"
                onClick={() => window.location.href = "/member-subscription"}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.75a.75.75 0 0 1-.75-.75V12a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-.75.75zm0-11.5a1 1 0 0 1 1 1v.25a1 1 0 0 1-2 0V7.25a1 1 0 0 1 1-1zm0-2.25A9.25 9.25 0 1 0 21.25 12 9.26 9.26 0 0 0 12 4zm0 16.5A7.25 7.25 0 1 1 19.25 12 7.26 7.26 0 0 1 12 20.5z"></path></svg>
                <span className="ml-1 text-xs font-semibold">Premium</span>
              </span>
            )}
          </div>
        </div>
        <div>
          <label className="block mb-2 font-semibold text-primary">Breed</label>
          <div className="relative">
            <select
              className="w-full px-4 py-3 rounded-lg border-2 border-primary focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm bg-white font-medium"
              value={pendingBreedId}
              onChange={e => {
                // PawStart üçün breed seçmək mümkün deyil
                if (activePlan?.planType === "PawStart") return;
                // Əgər plan yoxdursa və ya premium tələb olunursa
                if (!activePlan || (activePlan.planType !== "PawPlus" && activePlan.planType !== "PawElite")) {
                  window.location.href = "/member-subscription";
                  return;
                }
                setPendingBreedId(e.target.value ? Number(e.target.value) : "");
              }}
              disabled={
                !pendingAnimalId ||
                activePlan?.planType === "PawStart" // PawStart üçün deaktiv
              }
              style={
                !activePlan || (activePlan.planType !== "PawPlus" && activePlan.planType !== "PawElite")
                  ? { cursor: "pointer", backgroundColor: "#fffbe6" }
                  : {}
              }
            >
              <option value="">All breeds</option>
              {breeds.map(breed => (
                <option key={breed.id} value={breed.id}>
                  {breed.name}
                </option>
              ))}
            </select>
            {/* Premium ikon yalnız PawPlus və PawElite olmayan planlarda */}
            {(!activePlan || (activePlan.planType !== "PawPlus" && activePlan.planType !== "PawElite")) && (
              <span
                className="absolute right-3 top-3 text-yellow-500 cursor-pointer flex items-center"
                title="Bu filtr üçün üzvlük planı tələb olunur"
                onClick={() => window.location.href = "/member-subscription"}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.75a.75.75 0 0 1-.75-.75V12a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-.75.75zm0-11.5a1 1 0 0 1 1 1v.25a1 1 0 0 1-2 0V7.25a1 1 0 0 1 1-1zm0-2.25A9.25 9.25 0 1 0 21.25 12 9.26 9.26 0 0 0 12 4zm0 16.5A7.25 7.25 0 1 1 19.25 12 7.26 7.26 0 0 1 12 20.5z"></path></svg>
                <span className="ml-1 text-xs font-semibold">Premium</span>
              </span>
            )}
            {/* PawStart üçün info mesajı */}
            {/* {activePlan?.planType === "PawStart" && (
              <span className="absolute right-3 top-3 text-gray-400 flex items-center" title="Bu plan üçün breed seçmək mümkün deyil">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="gray" strokeWidth="2" fill="none"/><line x1="8" y1="12" x2="16" y2="12" stroke="gray" strokeWidth="2"/></svg>
                <span className="ml-1 text-xs font-semibold">Breed seçmək mümkün deyil</span>
              </span>
            )} */}
          </div>
        </div>
      </div>
      <div className="mb-6 max-w-md mx-auto flex justify-end">
        {/* Filter düyməsi */}
        <Button
          variant="default"
          className="flex items-center gap-2"
          onClick={() => setFilterApplied(true)}
          disabled={animals.length === 0} // Əgər animal endpointdən cavab gəlməyibsə, disable
        >
          <Filter className="w-4 h-4" />
          Apply Filter
        </Button>
        {filterApplied && (
          <Button
            variant="outline"
            className="ml-2"
            onClick={() => {
              setPendingAnimalId("");
              setPendingBreedId("");
              setFilterApplied(false);
            }}
          >
            Reset
          </Button>
        )}
      </div>
      {/* User pet select */}
      <div className="mb-6 max-w-md mx-auto">
        <label className="block mb-2 font-semibold text-lg text-primary">Choose your pet</label>
        <div className="relative">
          <select
            className="w-full px-4 py-3 rounded-lg border-2 border-primary focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm bg-white text-lg font-medium"
            value={selectedPetId ?? ""}
            onChange={e => {
              setSelectedPetId(Number(e.target.value));
              setShowSelectWarning(false);
            }}
          >
            <option value="">Select your pet...</option>
            {userPets.map(pet => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-3 text-primary">
            🐾
          </span>
        </div>
        {showSelectWarning && (
          <div className="mt-2 flex items-center text-red-600 text-sm font-medium">
            <AlertCircle className="w-4 h-4 mr-1" />
            Please select your pet before liking!
          </div>
        )}
      </div>
      {filteredPets.length > 0 && currentIndex < filteredPets.length ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{filteredPets[currentIndex].name}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPets[currentIndex].imageUrl && (
              <img
                src={filteredPets[currentIndex].imageUrl}
                alt={filteredPets[currentIndex].name}
                className="w-full h-64 object-cover rounded mb-4"
              />
            )}
            <div className="mb-2">{filteredPets[currentIndex].breed}</div>
            <div className="mb-2">{filteredPets[currentIndex].description}</div>
            <div className="flex gap-4 mt-4">
              <Button
                variant="default"
                onClick={() => handleLike(filteredPets[currentIndex].id)}
                disabled={!selectedPetId}
                className="px-6 py-2 text-lg font-semibold"
              >
                ❤️ Like
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="px-6 py-2 text-lg font-semibold"
              >
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">No more pets to show.</div>
      )}
    </div>
  );
};

export default PairPetPage;