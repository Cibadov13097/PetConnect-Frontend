import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Phone, Mail, Globe, Clock, Upload } from "lucide-react";

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
}

interface EditShopModalProps {
  shop: Shop;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedShop: Shop) => void;
}

const EditShopModal: React.FC<EditShopModalProps> = ({ shop, isOpen, onClose, onUpdate }) => {
  const { toast } = useToast();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: shop.name || "",
    description: shop.description || "",
    location: shop.location || "",
    telephone: shop.telephone || "",
    email: shop.email || "",
    website: shop.website || "",
    openTime: shop.openTime || "",
    closeTime: shop.closeTime || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('Name', formData.name);
      formDataToSend.append('Description', formData.description);
      formDataToSend.append('Location', formData.location);
      formDataToSend.append('Telephone', formData.telephone);
      formDataToSend.append('Email', formData.email);
      formDataToSend.append('Website', formData.website);
      formDataToSend.append('OpenTime', formData.openTime);
      formDataToSend.append('CloseTime', formData.closeTime);
      
      if (imageFile) {
        formDataToSend.append('ImgFile', imageFile);
      }

      const response = await fetch(`https://localhost:7213/api/Organization/edit?id=${shop.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Shop updated successfully!",
        });
        
        // Update the local shop data
        const updatedShop = {
          ...shop,
          ...formData,
          imageUrl: imageFile ? URL.createObjectURL(imageFile) : shop.imageUrl
        };
        onUpdate(updatedShop);
        onClose();
      } else {
        const errorData = await response.text();
        toast({
          title: "Error",
          description: errorData || "Failed to update shop",
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
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shop</DialogTitle>
          <DialogDescription>
            Update your shop information and settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter shop name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your shop and services"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                name="location"
                type="text"
                placeholder="Enter shop address"
                value={formData.location}
                onChange={handleInputChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://your-website.com"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openTime">Opening Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="openTime"
                  name="openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeTime">Closing Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="closeTime"
                  name="closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={handleInputChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Shop Image</Label>
            <div className="relative">
              <Upload className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="pl-10"
              />
            </div>
            {shop.imageUrl && (
              <div className="mt-2">
                <img 
                  src={shop.imageUrl} 
                  alt="Current shop image"
                  className="w-20 h-20 rounded-lg object-cover border"
                />
                <p className="text-xs text-muted-foreground mt-1">Current image</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Shop"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditShopModal;
