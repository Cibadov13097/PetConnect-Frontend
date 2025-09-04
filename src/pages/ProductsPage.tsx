import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Star, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryMap, setCategoryMap] = useState<{ [key: number]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const pageSize = 12;
  const { toast } = useToast();
  const navigate = useNavigate();

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    // ...other fields...
    shopId: selectedProduct?.shopId || "",
    productCategoryId: selectedProduct?.productCategoryId || "",
    // ...
  });

  // Fetch categories and build map on mount
  useEffect(() => {
    fetch("https://localhost:7213/api/ProductCategory/getAll")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data || []);
        // Build id:name map for fast lookup
        const map: { [key: number]: string } = {};
        (data || []).forEach((cat: any) => {
          map[cat.id] = cat.name;
        });
        setCategoryMap(map);
      })
      .catch(() => {
        setCategories([]);
        setCategoryMap({});
      });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = `https://localhost:7213/api/Product/getAll?pageNumber=${currentPage}&pageSize=${pageSize}`;
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || (data.items || []).length);
        setCurrentPage(data.pageNumber || currentPage);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, pageSize, searchTerm, toast]);

  const filteredProducts = (products || []).filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    // ...append other fields...
    // Debug: log what is being sent
    console.log("Sending shopId to backend:", selectedProduct.shopId);
    // If you want to see all FormData:
    for (let pair of formData.entries()) {
      console.log(pair[0]+ ': ' + pair[1]);
    }
    // ...send formData to backend...
  };

  // Səbətə məhsul əlavə edən funksiya
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
    window.location.reload(); // Refresh page to update basket count
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Pet Products
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything your pets need for a happy and healthy life
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            className="rounded-full px-5 py-2 font-semibold shadow"
            onClick={async () => {
              setSelectedCategory(null);
              setLoading(true);
              // Default məhsulları fetch et
              const res = await fetch(
                `https://localhost:7213/api/Product/getAll?pageNumber=1&pageSize=${pageSize}`
              );
              const data = await res.json();
              setProducts(data.items || []);
              setTotalPages(data.totalPages || 1);
              setTotalItems(data.totalItems || (data.items || []).length);
              setCurrentPage(data.pageNumber || 1);
              setLoading(false);
            }}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className={`rounded-full px-5 py-2 font-semibold shadow flex items-center gap-2 transition-all duration-150 ${
                selectedCategory === cat.id
                  ? "bg-primary text-white"
                  : "bg-white text-primary border-primary"
              }`}
              onClick={async () => {
                setSelectedCategory(cat.id);
                setLoading(true);
                const res = await fetch(
                  `https://localhost:7213/api/Product/filterByCategory/${cat.id}`
                );
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
                setTotalPages(1);
                setTotalItems(Array.isArray(data) ? data.length : 0);
                setCurrentPage(1);
                setLoading(false);
              }}
            >
              {/* İstəyə görə ikon əlavə edə bilərsən */}
              <Star className="h-4 w-4 text-yellow-400" />
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Pagination Info */}
        <div className="mb-4 text-center text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {totalItems} products 
          {searchTerm && ` (filtered by "${searchTerm}")`}
          {!searchTerm && ` - Page ${currentPage} of ${totalPages}`}
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="group hover:shadow-warm transition-all duration-300 bg-gradient-card border-0"
            >
              <CardHeader className="pb-3">
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ${product.price}
                  </span>
                  <Badge variant="secondary">{product.count} in stock</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm mb-4">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    Weight: {product.weight}kg
                  </span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm ml-1">4.5</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedProduct(product);
                      setEditForm({ ...editForm, shopId: product.shopId });
                    }}
                  >
                    More Details
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => addToBasket(product)}
                  >
                    Add to Basket
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {!searchTerm && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const pageNum = start + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageClick(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline" 
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              No products found
            </h2>
            <p className="text-muted-foreground mb-8">
              Try adjusting your search or filter settings.
            </p>
            <Button
              onClick={async () => {
                setSearchTerm("");
                setSelectedCategory(null);
                setLoading(true);
                const res = await fetch(
                  `https://localhost:7213/api/Product/getAll?pageNumber=1&pageSize=${pageSize}`
                );
                const data = await res.json();
                setProducts(data.items || []);
                setTotalPages(data.totalPages || 1);
                setTotalItems(data.totalItems || (data.items || []).length);
                setCurrentPage(data.pageNumber || 1);
                setLoading(false);
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-2xl shadow-2xl max-w-md w-full p-0 relative overflow-hidden border border-slate-200 animate-fadeIn">
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-slate-100 rounded-full p-2 shadow-lg hover:scale-105 transition-transform"
                onClick={() => setSelectedProduct(null)}
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
              <div className="flex flex-col md:flex-row gap-0">
                {/* Product Image */}
                <div className="flex-shrink-0 w-full md:w-1/2">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-56 object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none border-b md:border-b-0 md:border-r"
                    />
                  ) : (
                    <div className="w-full h-56 bg-slate-200 flex items-center justify-center rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none border-b md:border-b-0 md:border-r">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Product Details */}
                <div className="flex-1 px-6 py-6">
                  <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">{selectedProduct.name}</h2>
                  <div className="mb-2 text-slate-600">{selectedProduct.description}</div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-white/90 border border-primary text-primary font-bold text-base px-4 py-1 rounded-full shadow group-hover:bg-primary group-hover:text-white transition-all duration-200 select-none">
                      <span className="align-middle mr-1" style={{ fontSize: "1.1em" }}>₼</span>
                      {selectedProduct.price}
                    </span>
                    <Badge variant="secondary">{selectedProduct.count} in stock</Badge>
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Weight:</span> {selectedProduct.weight}kg
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Category:</span>{" "}
                    {selectedProduct.productCategoryId && categoryMap[selectedProduct.productCategoryId]
                      ? categoryMap[selectedProduct.productCategoryId]
                      : "-"}
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Shop:</span>{" "}
                    {selectedProduct.shopName || selectedProduct.shop || "-"}
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      className="w-full font-serif text-base rounded-full"
                      onClick={() => {
                        setSelectedProduct(null);
                        if (selectedProduct.shopId) {
                          navigate("/shop-detail", { state: { shopId: selectedProduct.shopId } });
                        }
                      }}
                      disabled={!selectedProduct.shopId}
                    >
                      Visit Store
                    </Button>
                    <Button
                      className="w-full font-serif text-base rounded-full"
                      variant="secondary"
                      onClick={() => addToBasket(selectedProduct)}
                    >
                      Add to Basket
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        <input type="hidden" name="shopId" value={editForm.shopId} />

      </div>
    </div>
  );
};

export default ProductsPage;