import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

type Like = {
  actorPetId: number;
  targetPetId: number;
  petSwipeStatus: string;
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

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | "">("");
  const [selectedBreedId, setSelectedBreedId] = useState<number | "">("");
  const [pendingAnimalId, setPendingAnimalId] = useState<number | "">("");
  const [pendingBreedId, setPendingBreedId] = useState<number | "">("");
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [filterApplied, setFilterApplied] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);

  // Likes modal states
  const [likes, setLikes] = useState<Like[]>([]);
  const [showLikes, setShowLikes] = useState(false);

  // Fetch animals
  useEffect(() => {
    fetch(`${API_BASE}/api/Animal/getAll`)
      .then(res => res.json())
      .then(data => setAnimals(data))
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
      .then(data => setBreeds(data))
      .catch(() => setBreeds([]));
  }, [pendingAnimalId]);

  // Fetch user's pets
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

  // Fetch pets (filtered or all)
  useEffect(() => {
    const fetchPets = async () => {
      try {
        let url = `${API_BASE}/api/Tinder/getAllActivePets`;
        if (pendingBreedId) url = `${API_BASE}/api/Tinder/getAllActivePetsByBreed/${pendingBreedId}`;
        else if (pendingAnimalId) url = `${API_BASE}/api/Tinder/getAllActivePetsByAnimalType/${pendingAnimalId}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFilteredPets(data.filter((p: Pet) => p.isActive));
      } catch {
        setFilteredPets([]);
      }
    };
    fetchPets();
  }, [filterApplied, pendingAnimalId, pendingBreedId, token]);

  // Fetch active plan
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/MemberSubscription/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setActivePlan(data))
      .catch(() => setActivePlan(null));
  }, [token]);

  // Fetch likes
  const fetchLikes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/Tinder/getAllLikes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch likes");
      const data = await res.json();
      setLikes(data);
      setShowLikes(true);
    } catch (err) {
      console.error(err);
      setLikes([]);
      setShowLikes(true);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pair Pets (Tinder)</h1>
        <Button variant="outline" onClick={fetchLikes}>
          ❤️ View Likes
        </Button>
      </div>

      {/* Likes Modal */}
      <Dialog open={showLikes} onOpenChange={setShowLikes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pets Who Liked Yours</DialogTitle>
          </DialogHeader>
          {likes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No likes yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto">
              {likes.map((like, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <p className="font-semibold">Pet ID: {like.actorPetId}</p>
                    <p className="text-sm text-gray-500">Liked your pet (ID: {like.targetPetId})</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Your existing filters, pet selection, swipe cards remain the same */}
      {/* ... (rest of your PairPetPage JSX stays unchanged) ... */}

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
