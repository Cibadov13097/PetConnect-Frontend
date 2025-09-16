import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Package, DollarSign, Weight, Hash, Upload, ArrowLeft } from "lucide-react";

interface ProductAddDto {
  Name: string;
  Price: number;
  Description: string;
  Weight: number;
  Count: number;
  ProductCategoryId: number;
  AnimalId: number;
  ImageFile: File | null;
}

interface Category {
  id: number;
  name: string;
}

interface Animal {
  id: number;
  name: string;
}

const API_BASE = import.meta.env.VITE_API_URL;

const AddProductPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  
  const [formData, setFormData] = useState<ProductAddDto>({
    Name: "",
    Price: 0,
    Description: "",
    Weight: 0,
    Count: 0,
    ProductCategoryId: 0,
    AnimalId: 0,
    ImageFile: null,
  });

  useEffect(() => {
    // Check if user is authenticated and is a shop owner
    if (!isAuthenticated || !token) {
      toast({
        title: "Authentication Required",
        description: "Please login as a shop owner to add products",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchCategoriesAndAnimals = async () => {
      try {
        // Fetch categories from API
        const categoriesResponse = await fetch(`${API_BASE}/api/ProductCategory/getAll`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.Items || categoriesData || []);
        } else {
          // Fallback to hardcoded categories if API fails
          setCategories([
            { id: 1, name: "Yemlər" },
            { id: 2, name: "Qumlar" },
            { id: 3, name: "Çərəzlər" },
            { id: 4, name: "Aksesuarlar" },
            { id: 5, name: "Qulluq Vasitələri" },
            { id: 6, name: "Aptek" },
          ]);
        }

        // Fetch animals from API
        const animalsResponse = await fetch(`${API_BASE}/api/Animal/getAll`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (animalsResponse.ok) {
          const animalsData = await animalsResponse.json();
          // Filter only Dog and Cat
          const filteredAnimals = (animalsData.Items || animalsData || []).filter(
            (animal: Animal) => animal.name === "Dog" || animal.name === "Cat"
          );
          setAnimals(filteredAnimals);
        } else {
          // Fallback to hardcoded animals
          setAnimals([
            { id: 1, name: "Dog" },
            { id: 2, name: "Cat" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching categories or animals:", error);
        // Use fallback data
        setCategories([
          { id: 1, name: "Yemlər" },
          { id: 2, name: "Qumlar" },
          { id: 3, name: "Çərəzlər" },
          { id: 4, name: "Aksesuarlar" },
          { id: 5, name: "Qulluq Vasitələri" },
          { id: 6, name: "Aptek" },
        ]);
        setAnimals([
          { id: 1, name: "Dog" },
          { id: 2, name: "Cat" },
        ]);
      }
    };

    fetchCategoriesAndAnimals();
  }, [isAuthenticated, token, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Price' || name === 'Weight' || name === 'Count' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        ImageFile: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      if (!formData.Name || !formData.Price || !formData.ProductCategoryId || !formData.AnimalId) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('Name', formData.Name);
      formDataToSend.append('Price', formData.Price.toString());
      formDataToSend.append('Description', formData.Description);
      formDataToSend.append('Weight', formData.Weight.toString());
      formDataToSend.append('Count', formData.Count.toString());
      formDataToSend.append('ProductCategoryId', formData.ProductCategoryId.toString());
      formDataToSend.append('AnimalId', formData.AnimalId.toString());
      
      if (formData.ImageFile) {
        formDataToSend.append('ImageFile', formData.ImageFile);
      }

      const response = await fetch(`${API_BASE}/api/Product/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Product created successfully:", result);
        toast({
          title: "Success",
          description: "Product added successfully!",
        });
        
        // Reset form
        setFormData({
          Name: "",
          Price: 0,
          Description: "",
          Weight: 0,
          Count: 0,
          ProductCategoryId: 0,
          AnimalId: 0,
          ImageFile: null,
        });
        
        // Redirect to my products page to see the newly created product
        navigate("/my-products");
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Failed to add product",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Add New Product</h1>
              <p className="text-muted-foreground">Add a new product to your shop inventory</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Fill in the details for your new product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="Name">Product Name *</Label>
                  <Input
                    id="Name"
                    name="Name"
                    type="text"
                    placeholder="Enter product name"
                    value={formData.Name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="Price">Price ($) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="Price"
                      name="Price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.Price || ""}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="Description">Description</Label>
                <Textarea
                  id="Description"
                  name="Description"
                  placeholder="Describe your product"
                  value={formData.Description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="Weight">Weight (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="Weight"
                      name="Weight"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.0"
                      value={formData.Weight || ""}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="Count">Stock Count</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="Count"
                      name="Count"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.Count || ""}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.ProductCategoryId > 0 ? formData.ProductCategoryId.toString() : ""}
                    onValueChange={(value) => handleSelectChange('ProductCategoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Animal Type *</Label>
                  <Select
                    value={formData.AnimalId > 0 ? formData.AnimalId.toString() : ""}
                    onValueChange={(value) => handleSelectChange('AnimalId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {animals.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id.toString()}>
                          {animal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ImageFile">Product Image</Label>
                <div className="relative">
                  <Upload className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ImageFile"
                    name="ImageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="pl-10"
                  />
                </div>
                {formData.ImageFile && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Selected: {formData.ImageFile.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProductPage;
