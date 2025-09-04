import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, MapPin, Phone, Mail, Globe, Edit, Plus, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import EditShopModal from "@/components/EditShopModal";
import { apiClient } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Shop {
  id: string;
  name: string;
  description: string;
  location: string;
  telephone: string;
  email: string;
  website?: string;
  imageUrl?: string;
  openTime: string;
  closeTime: string;
  organizationType: string;
  isActive: boolean;
  ownerId?: string; // Added ownerId property
}

const ShopDetail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, token, user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const location = useLocation();
  const shopId = location.state?.shopId;
  const [products, setProducts] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [shopProductsShopId, setShopProductsShopId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [animalMap, setAnimalMap] = useState<{ [key: number]: string }>({});

  // Fetch shop data and determine owner
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        if (!isAuthenticated || !token) {
          toast({
            title: "Authentication Required",
            description: "Please login to access shop details",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        let data;
        if (shopId) {
          // Fetch shop by ID
          const response = await fetch(`https://localhost:7213/api/Organization/getBy${shopId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            data = await response.json();
          }
        } else {
          // Fallback: fetch current user's shop
          const response = await fetch("https://localhost:7213/api/Organization/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            data = await response.json();
          }
        }

        if (data && data.organizationType === "Shop") {
          setShop(data);
          // Only use shopId for fetching products
          if (data.shopId) {
            setShopProductsShopId(Number(data.shopId));
          } else {
            setShopProductsShopId(null);
          }
          if (data.ownerId && user?.id && data.ownerId === user.id) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }
        } else {
          toast({
            title: "Info",
            description: "No shop found.",
          });
          setShop(null);
        }
      } catch (error) {
        console.error("Error fetching shop data:", error);
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
        setShop(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopData();
  }, [isAuthenticated, token, navigate, toast, shopId, user?.id]);

  // Fetch products for this shop (with pagination)
  useEffect(() => {
    if (shopId) {
      fetch(`https://localhost:7213/api/Product/getAll?pageNumber=1&pageSize=1000`)
        .then(res => res.json())
        .then(data => {
          // Filter only this shop's products
          const filtered = (data.items || []).filter((p: any) => String(p.shopId) === String(shopId));
          // Pagination logic on frontend
          const pageSize = 8;
          const total = filtered.length;
          const totalPages = Math.max(1, Math.ceil(total / pageSize));
          setTotalPages(totalPages);
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          setProducts(filtered.slice(start, end));
        })
        .catch(err => {
          console.error("Error fetching products:", err);
        });
    }
  }, [shopId, page]);

  // Fetch animal types and map animalId to name (Dog, Cat, etc.)
  useEffect(() => {
    fetch("https://localhost:7213/api/Animal/getAll")
      .then(res => res.json())
      .then((data: any[]) => {
        // data: [{ id: 1, name: "Dog" }, ...]
        const map: { [key: number]: string } = {};
        data.forEach(animal => {
          map[animal.id] = animal.name;
        });
        setAnimalMap(map);
      })
      .catch(() => setAnimalMap({}));
  }, []);

  const handleShopUpdate = (updatedShop: Shop) => {
    setShop(updatedShop);
  };

  const addToBasket = (product: any) => {
    const basket = JSON.parse(sessionStorage.getItem("cart") || "[]");
    const existing = basket.find((item: any) => item.id === product.id);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      basket.push({ ...product, count: 1 });
    }
    sessionStorage.setItem("cart", JSON.stringify(basket));
    toast({ title: "Added to basket!" });
  };

  // Determine if the current user is the owner of this shop
  

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading shop details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Shop Found</h1>
          <p className="text-muted-foreground mb-6">You don't have a shop registered yet.</p>
          <Button onClick={() => navigate("/petshops")}>
            <Plus className="h-4 w-4 mr-2" />
            Register Your Shop
          </Button>
        </div>
      </div>
    );
  }

  // Also, right before rendering products, add:
  console.log("Products to render:", products); // DEBUG: log products array before render

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-4">
              {shop.imageUrl && (
                <img 
                  src={shop.imageUrl} 
                  alt={shop.name}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              )}
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{shop.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={shop.isActive ? "default" : "secondary"}>
                  {shop.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">Pet Shop</Badge>
              </div>
            </div>
          </div>
          {/* Only show Edit Shop button if current user is the owner */}
          {isOwner && (
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Shop
            </Button>
          )}
        </div>

        {/* Shop Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription>Basic details about your pet shop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{shop.description || "No description provided"}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Address</h4>
                  <p className="text-sm">{shop.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Hours</h4>
                  <p className="text-sm">
                    {shop.openTime && shop.closeTime
                      ? `${shop.openTime} - ${shop.closeTime}`
                      : "Hours not specified"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shop.telephone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Phone</h4>
                    <p className="text-sm">{shop.telephone}</p>
                  </div>
                </div>
              )}

              {shop.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                    <p className="text-sm">{shop.email}</p>
                  </div>
                </div>
              )}

              {shop.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Website</h4>
                    <a 
                      href={shop.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {shop.website}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your shop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/my-products")}
                  >
                    View My Products
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/add-product")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/shop-orders")}>
                    View Orders
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/shop-settings")}>
                    Shop Settings
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products section: yalnız mağaza sahibi DEYİLSƏ göstər */}
        {!isOwner && (
          <div className="mt-10" ref={productsRef}>
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Products available in this shop</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-muted-foreground">No products found for this shop.</p>
                ) : (
                  <div
                    className="
                      grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8
                      justify-items-center
                    "
                  >
                    {products.map((product: any, idx: number) => (
                      <Card
                        key={product.id}
                        className="group shadow-lg hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent hover:border-primary bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-xl overflow-hidden relative w-full max-w-xs"
                      >
                        <div className="relative">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center bg-slate-200 text-slate-400 text-4xl">
                              <ShoppingBag />
                            </div>
                          )}
                          {/* Engaging price badge */}
                          <span className="absolute top-3 right-3 bg-white/90 border border-primary text-primary font-bold text-base px-4 py-1 rounded-full shadow-lg group-hover:bg-primary group-hover:text-white transition-all duration-200 select-none"
        style={{ letterSpacing: "0.03em" }}
      >
        <span className="align-middle mr-1" style={{ fontSize: "1.1em" }}>₼</span>
        {product.price}
      </span>
                        </div>
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                            {product.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-3 min-h-[48px]">
                            {product.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              In Stock
                            </Badge>
                          </div>
                        </CardContent>
                        <div className="absolute bottom-3 right-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-full shadow hover:bg-primary hover:text-white transition"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsProductModalOpen(true);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6 space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

{/* Product Details Modal */}
<Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
  <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 animate-fadeIn">
    
    {/* Close Button */}
    <button
      className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:scale-105 transition-transform"
      onClick={() => setIsProductModalOpen(false)}
      aria-label="Close"
    >
      <X className="h-5 w-5 text-slate-500" />
    </button>

    {/* Product Image */}
    <div className="relative group">
      {selectedProduct?.imageUrl ? (
        <img
          src={selectedProduct.imageUrl}
          alt={selectedProduct.name}
          className="w-full h-56 object-cover rounded-t-2xl border-b transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-56 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400 text-5xl rounded-t-2xl border-b">
          <ShoppingBag />
        </div>
      )}
      <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow text-primary font-semibold">
        {selectedProduct?.price} ₼
      </div>
    </div>

    {/* Header */}
    <DialogHeader className="px-6 pt-6 pb-3">
      <DialogTitle className="text-2xl font-serif font-bold text-slate-800 leading-snug">
        {selectedProduct?.name}
      </DialogTitle>
      <DialogDescription className="flex items-center gap-3 mt-3 text-sm">
        <Badge variant="outline" className="text-xs font-semibold border-green-300 bg-green-50 text-green-700 px-2 py-0.5">
          In Stock
        </Badge>
      </DialogDescription>
    </DialogHeader>

    {/* Product Details */}
    <div className="px-6 pb-4">
      <div className="mb-3">
        <span className="block text-base font-semibold text-slate-700 mb-1">Description</span>
        <p className="text-base text-slate-600 leading-relaxed">
          {selectedProduct?.description || "No description available."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border">
          <span className="block text-sm font-semibold text-slate-700">Weight</span>
          <span className="text-sm text-slate-600">
            {selectedProduct?.weight ? `${selectedProduct.weight} kg` : "N/A"}
          </span>
        </div>
        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border">
          <span className="block text-sm font-semibold text-slate-700">Animal</span>
          <span className="text-sm text-slate-600">
            For{" "}
            {selectedProduct?.animalId && animalMap[selectedProduct.animalId]
              ? animalMap[selectedProduct.animalId]
              : "N/A"}
              s
          </span>
        </div>
      </div>
    </div>

    {/* Footer */}
    <DialogFooter className="flex justify-end px-6 pb-6">
      <Button
        size="lg"
        className="bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all font-serif text-base px-8 py-3 rounded-full"
        onClick={() => addToBasket(selectedProduct)}
      >
        🛒 Add to Basket
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      {/* Edit Modal */}
      {shop && (
        <EditShopModal
          shop={shop}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleShopUpdate}
        />
      )}
    </div>
  );
};

export default ShopDetail;
