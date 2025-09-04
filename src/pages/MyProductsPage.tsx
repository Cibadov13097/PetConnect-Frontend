import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Weight, 
  Hash,
  ArrowLeft,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  weight: number;
  count: number;
  productCategoryId: number;
  animalId: number;
  image?: string;
  imageUrl?: string; // Add this to handle the API response
  shopId: number;
}

const MyProductsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    description: "",
    weight: "",
    count: "",
    image: null as File | null,
    animalId: "",
    productCategoryId: "", // <-- əlavə et
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Default template download handler
  const handleDownloadTemplate = () => {
    window.open("/excel-product-template.xlsx", "_blank");
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12; // Products per page

  // Animal state
  const [animals, setAnimals] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Fetch products function using the new /me endpoint
  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      console.log("=== FETCHING MY PRODUCTS ===");
      console.log(`Fetching page ${page} with pageSize ${pageSize}`);
      
      const response = await fetch(
        `https://localhost:7213/api/Product/me?pageNumber=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please login again",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("My Products API Response:", data);
      console.log("Response type:", typeof data);
      console.log("Is array?", Array.isArray(data));
      
      // Handle different response structures
      let productsList: Product[] = [];
      type Pagination = {
        totalItems: number;
        pageNumber: number;
        pageSize: number;
        totalPages: number;
      };
      let pagination: Pagination = {
        totalItems: 0,
        pageNumber: 1,
        pageSize: pageSize,
        totalPages: 1
      };
      
      if (Array.isArray(data)) {
        // If response is just an array
        console.log("Response is array format");
        productsList = data;
        pagination = {
          totalItems: data.length,
          pageNumber: 1,
          pageSize: data.length,
          totalPages: 1
        };
      } else if (data.items || data.Items) {
        // If response has pagination structure
        console.log("Response is paginated format");
        const rawProducts = data.items || data.Items;
        
        // Transform products to normalize imageUrl to image
        productsList = rawProducts.map((product: any) => ({
          ...product,
          image: product.imageUrl || product.image // Use imageUrl if available, fallback to image
        }));
        
        pagination = {
          totalItems: data.totalItems || productsList.length,
          pageNumber: data.pageNumber || page,
          pageSize: data.pageSize || pageSize,
          totalPages: data.totalPages || Math.ceil((data.totalItems || productsList.length) / pageSize)
        };
      } else {
        // Fallback
        console.log("Response is unknown format, using fallback");
        productsList = [];
        pagination = {
          totalItems: 0,
          pageNumber: 1,
          pageSize: pageSize,
          totalPages: 0
        };
      }
      
      console.log(`Found ${productsList.length} products for current user`);
      console.log("Pagination info:", pagination);
      
      // // Enhanced debugging for each product
      // if (productsList.length > 0) {
      //   console.log("=== DETAILED PRODUCT ANALYSIS ===");
      //   productsList.forEach((product, index) => {
      //     console.log(`Product ${index + 1}:`, {
      //       id: product.id,
      //       name: product.name,
      //       price: product.price,
      //       image: product.image,
      //       imageUrl: product.imageUrl,
      //       finalImageUrl: product.image || product.imageUrl,
      //       imageType: typeof (product.image || product.imageUrl),
      //       imageLength: (product.image || product.imageUrl) ? (product.image || product.imageUrl)!.length : 0,
      //       shopId: product.shopId,
      //     });
      //   });
      // }
      
      setProducts(productsList);
      setTotalItems(pagination.totalItems);
      setTotalPages(pagination.totalPages);
      setCurrentPage(pagination.pageNumber);
      
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load your products. Please try again.",
        variant: "destructive",
      });
      setProducts([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, navigate, pageSize]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated || !token) {
      toast({
        title: "Authentication Required",
        description: "Please login to view your products",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    fetchProducts(currentPage);
  }, [isAuthenticated, token, fetchProducts, navigate, toast, currentPage]);

  // Filter products based on search term (from current page)
  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
    }
  };

  const handlePageClick = (pageNumber: number) => {
    if (pageNumber !== currentPage && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Delete handlers
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !productToDelete.id) {
      toast({
        title: "Error",
        description: "No product selected for deletion.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://localhost:7213/api/Product/delete/${productToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        fetchProducts(currentPage);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Failed to delete product",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description || "",
      weight: product.weight?.toString() || "",
      count: product.count?.toString() || "",
      image: null,
      animalId: product.animalId ? product.animalId.toString() : "",
      productCategoryId: product.productCategoryId ? product.productCategoryId.toString() : "", // <-- əlavə et
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit) return;
    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append("Name", editForm.name);
      formData.append("Price", editForm.price);
      formData.append("Description", editForm.description);
      formData.append("Weight", editForm.weight);
      formData.append("Count", editForm.count);
      if (editForm.image) formData.append("file", editForm.image);
      formData.append("AnimalId", editForm.animalId); // <-- Added this line
      formData.append("ProductCategoryId", editForm.productCategoryId);

      const response = await fetch(
        `https://localhost:7213/api/Product/edit/${productToEdit.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (response.ok) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        setEditDialogOpen(false);
        setProductToEdit(null);
        fetchProducts(currentPage);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Failed to update product",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Handle product upload
  const handleUploadProducts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", excelFile);

      const res = await fetch("https://localhost:7213/api/Product/upload-products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        toast({ title: "Products uploaded successfully!" });
        setUploadDialogOpen(false);
        setExcelFile(null);
        fetchProducts(currentPage);
      } else {
        const errText = await res.text();
        toast({ title: "Upload failed", description: errText, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch animals for the select input
  useEffect(() => {
    fetch("https://localhost:7213/api/Animal/getAll")
      .then(res => res.json())
      .then(data => setAnimals(data || []))
      .catch(() => setAnimals([]));
  }, []);

  // Kategoriya siyahısını yüklə
  useEffect(() => {
    fetch("https://localhost:7213/api/ProductCategory/getAll")
      .then(res => res.json())
      .then(data => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxPagesToShow - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Stats data for cards
  const statsData = [
    {
      id: 'total-products',
      icon: Package,
      label: 'Total Products',
      value: totalItems.toString(),
      color: 'text-primary'
    },
    {
      id: 'current-page',
      icon: Hash,
      label: 'Current Page',
      value: totalPages > 0 ? `${currentPage} of ${totalPages}` : '0 of 0',
      color: 'text-green-600'
    },
    {
      id: 'showing',
      icon: DollarSign,
      label: 'Showing',
      value: `${products.length} products`,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">My Products</h1>
                <p className="text-muted-foreground">
                  Manage your shop's product inventory
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
              Upload Products
            </Button>
            <Button onClick={() => navigate("/add-product")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {statsData.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <Card key={stat.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`h-5 w-5 ${stat.color}`} />
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products on this page..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Pagination Info */}
          <div className="text-sm text-muted-foreground">
            {totalItems > 0 && (
              <span>
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} products
              </span>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {filteredProducts.map((product, index) => {
                // Get the image URL (prioritize normalized image field, fallback to imageUrl)
                const imageUrl = product.image || product.imageUrl;
                
                // Debug each product in the map
                console.log(`Rendering product ${index}:`, {
                  id: product.id,
                  name: product.name,
                  image: product.image,
                  imageUrl: product.imageUrl,
                  finalImageUrl: imageUrl,
                  hasImage: !!imageUrl,
                  imageLength: imageUrl ? imageUrl.length : 0
                });

                return (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {imageUrl && imageUrl.trim() !== '' ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onLoad={(e) => {
                              console.log(`✅ Image loaded successfully for product ${product.id}:`, imageUrl);
                            }}
                            onError={(e) => {
                              console.log(`❌ Failed to load image for product ${product.id}:`, imageUrl);
                              console.log('Image error event:', e);
                              
                              // Hide the broken image and show fallback
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallbackDiv = target.nextElementSibling as HTMLElement;
                              if (fallbackDiv) {
                                fallbackDiv.style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Fallback icon (hidden by default if image exists) */}
                        {imageUrl && imageUrl.trim() !== '' && (
                          <div 
                            className="w-full h-full flex items-center justify-center bg-muted"
                            style={{ display: 'none' }}
                          >
                            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                            <span className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background px-1 rounded">
                              Image failed to load
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-2xl font-bold text-primary">
                              ${product.price.toFixed(2)}
                            </span>
                            <Badge variant={product.count > 0 ? "default" : "secondary"}>
                              {product.count} in stock
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
            
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {product.description || "No description"}
                      </p>
                      
                      {product.weight > 0 && (
                        <div className="flex items-center text-sm text-muted-foreground mb-4">
                          <Weight className="h-4 w-4 mr-1" />
                          <span>{product.weight}kg</span>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          key={`edit-${product.id}`}
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditClick(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          key={`delete-${product.id}`}
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && !searchTerm && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageClick(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
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
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No products found" : "No products yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? "Try adjusting your search terms or check other pages"
                : "Start by adding your first product to your shop"
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate("/add-product")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                key="cancel-delete"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                key="confirm-delete"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting || !productToDelete || !productToDelete.id}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the product details and save changes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <Input
                placeholder="Name"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Price"
                type="number"
                value={editForm.price}
                onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                required
              />
              <Input
                placeholder="Description"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                required
              />
              <Input
                placeholder="Weight"
                type="number"
                value={editForm.weight}
                onChange={e => setEditForm(f => ({ ...f, weight: e.target.value }))}
                required
              />
              <Input
                placeholder="Count"
                type="number"
                value={editForm.count}
                onChange={e => setEditForm(f => ({ ...f, count: e.target.value }))}
                required
              />
              {/* Animal Section */}
              <div>
                <label className="block mb-1 font-medium">Animal</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editForm.animalId || ""}
                  onChange={e => setEditForm(f => ({ ...f, animalId: e.target.value }))}
                  required
                >
                  <option value="">Select animal</option>
                  {animals.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Product Category</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editForm.productCategoryId || ""}
                  onChange={e => setEditForm(f => ({ ...f, productCategoryId: e.target.value }))}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={e =>
                  setEditForm(f => ({
                    ...f,
                    image: e.target.files ? e.target.files[0] : null,
                  }))
                }
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isEditing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditing}>
                  {isEditing ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Upload Products Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Products (Excel)</DialogTitle>
              <DialogDescription>
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="flex items-center"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1 text-green-600" />
                    Download Excel Template
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    (Download and fill the template before uploading)
                  </span>
                </div>
                Select an Excel file (.xlsx) to bulk upload products.
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <b>Note:</b> Əgər mağazanızda məhsul artıq varsa və Excel faylında həmin məhsul varsa, məhsulun sayı Excel faylında göstərilən məbləğ qədər artırılacaq.
                </div>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUploadProducts} className="space-y-4">
              <Input
                type="file"
                accept=".xlsx"
                onChange={e => setExcelFile(e.target.files ? e.target.files[0] : null)}
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || !excelFile}>
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyProductsPage;
