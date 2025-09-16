import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Phone, Mail, ShoppingBag, Plus } from "lucide-react";
import shopImage from "@/assets/shop-image.jpg";
import { apiClient, Organization } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth"; // <-- import auth
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

const PetShopsPage = () => {
  const [petShops, setPetShops] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, token, isAuthenticated } = useAuth(); // <-- get auth state
  const navigate = useNavigate();
  const location = useLocation();

  // Add Shop Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    location: "",
    description: "",
    openTime: "",
    closeTime: "",
    telephone: "",
    email: "",
    website: "", // <-- add this
    imgFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPetShops = async () => {
      try {
        const data = await apiClient.getOrganizationsByType('Shop');
        setPetShops(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load pet shops. Please try again.",
          variant: "destructive",
        });
        console.error("Failed to fetch pet shops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPetShops();
  }, [toast]);

  const filteredPetShops = petShops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add Shop Handler
  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const toTimeSpan = (value: string) => {
        // Əgər istifadəçi "09:00" yazıbsa, onu "09:00:00" formatına çevir
        if (/^\d{2}:\d{2}$/.test(value)) return value + ":00";
        return value;
      };

      const formData = new FormData();
      formData.append("Name", addForm.name);
      formData.append("Location", addForm.location);
      formData.append("Description", addForm.description);
      formData.append("OpenTime", toTimeSpan(addForm.openTime));
      formData.append("CloseTime", toTimeSpan(addForm.closeTime));
      formData.append("Telephone", addForm.telephone);
      formData.append("Email", addForm.email);
      formData.append("Website", addForm.website); // <-- append website
      formData.append("OrganizationType", "Shop");
      if (addForm.imgFile) formData.append("ImgFile", addForm.imgFile);

      const response = await fetch(`${API_BASE}/api/Organization/Add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast({ title: "Failed to add shop", description: errorText, variant: "destructive" });
        console.error("Backend error:", errorText);
        setSubmitting(false);
        return;
      }

      toast({ title: "Shop added!", variant: "default" });
      setShowAddModal(false);
      setAddForm({
        name: "",
        location: "",
        description: "",
        openTime: "",
        closeTime: "",
        telephone: "",
        email: "",
        website: "", // <-- reset this
        imgFile: null,
      });
      setLoading(true);
      // Refresh list
      const data = await apiClient.getOrganizationsByType('Shop');
      setPetShops(data);
    } catch (err) {
      toast({ title: "Failed to add shop", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pet shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Pet Shops
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find everything your pets need at these trusted retailers
          </p>
        </div>

        {/* Add Shop Button (only for authenticated users) */}
        {isAuthenticated && (
          <div className="mb-8 flex justify-center">
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Register Your Shop
            </Button>
          </div>
        )}

        {/* Add Shop Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-4"
              onSubmit={handleAddShop}
            >
              <h2 className="text-2xl font-bold mb-4">Add New Shop</h2>
              <Input
                placeholder="Shop Name"
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Location"
                value={addForm.location}
                onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                required
              />
              <Input
                placeholder="Description"
                value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                required
              />
              <Input
                placeholder="Open Time (e.g. 09:00)"
                value={addForm.openTime}
                onChange={e => setAddForm(f => ({ ...f, openTime: e.target.value }))}
                required
              />
              <Input
                placeholder="Close Time (e.g. 18:00)"
                value={addForm.closeTime}
                onChange={e => setAddForm(f => ({ ...f, closeTime: e.target.value }))}
                required
              />
              <Input
                placeholder="Telephone"
                value={addForm.telephone}
                onChange={e => setAddForm(f => ({ ...f, telephone: e.target.value }))}
                required
              />
              <Input
                placeholder="Email"
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Website"
                value={addForm.website}
                onChange={e => setAddForm(f => ({ ...f, website: e.target.value }))}
                required
              />
              <Input
                type="file"
                accept="image/*"
                onChange={e =>
                  setAddForm(f => ({
                    ...f,
                    imgFile: e.target.files ? e.target.files[0] : null,
                  }))
                }
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Adding..." : "Add Shop"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pet shops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Pet Shops Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPetShops.map((shop, idx) => (
            <Card key={shop.id ?? idx} className="group hover:shadow-warm transition-all duration-300 bg-gradient-card border-0">
              <CardHeader className="pb-3">
                <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={shop.imageUrl || shopImage} // Use shop.imgUrl from DB, fallback to static if missing
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      // fallback to static image if URL fails
                      (e.target as HTMLImageElement).src = shopImage;
                    }}
                  />
                </div>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{shop.name}</CardTitle>
                  <Badge className="bg-secondary text-secondary-foreground">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    Shop
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <p className="text-muted-foreground text-sm">
                  {shop.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{shop.location}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">
                      {shop.openTime} - {shop.closeTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">{shop.telephone}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">{shop.email}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => navigate("/shop-detail", { state: { shopId: shop.id } })}
                  >
                    Visit Store
                  </Button>
                  {/* View Orders button removed */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPetShops.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No pet shops found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ShopDetail = () => {
  const location = useLocation();
  const shopId = location.state?.shopId;
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (shopId) {
      fetch(`${API_BASE}/api/Product/getById?shopId=${shopId}`)
        .then(res => res.json())
        .then(data => setProducts(data.items || []));
    }
  }, [shopId]);

  // Render shop info and products here
};

export default PetShopsPage;