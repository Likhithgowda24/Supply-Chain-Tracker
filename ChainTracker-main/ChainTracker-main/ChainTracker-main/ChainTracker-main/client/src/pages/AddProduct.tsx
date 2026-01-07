import { ArrowLeft, Upload, X, Sliders, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { ImageCropper } from "@/components/ImageCropper";
import { ImageResizer } from "@/components/ImageResizer";

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showResizer, setShowResizer] = useState(false);
  const [resizerImage, setResizerImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    quantity: "",
    unitPrice: "",
    image: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCropperImage(base64String);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    setResizerImage(croppedImage);
    setShowResizer(true);
    setShowCropper(false);
    setCropperImage(null);
  };

  const handleResizeComplete = (resizedImage: string) => {
    setFormData((prev) => ({
      ...prev,
      image: resizedImage,
    }));
    setImagePreview(resizedImage);
    setShowResizer(false);
    setResizerImage(null);
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.sku || !formData.quantity || !formData.unitPrice) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Create product
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          productId: formData.sku,
          name: formData.name,
          description: formData.description,
          stock: parseInt(formData.quantity),
          price: parseFloat(formData.unitPrice),
          image: formData.image,
          category: "General", // Default category
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product added successfully!",
        });

        // Invalidate products query to refresh My Products page
        const manufacturerId = localStorage.getItem("userId");
        queryClient.invalidateQueries({ queryKey: ["/api/products", manufacturerId] });
        queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/stats"] });

        // Reset form
        setFormData({
          name: "",
          sku: "",
          description: "",
          quantity: "",
          unitPrice: "",
          image: "",
        });
        setImagePreview(null);

        // Redirect to dashboard
        setTimeout(() => {
          setLocation("/");
        }, 1000);
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to add product",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding the product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showCropper && cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCrop={handleCropComplete}
          onClose={() => {
            setShowCropper(false);
            setCropperImage(null);
          }}
        />
      )}

      {showResizer && resizerImage && (
        <ImageResizer
          imageSrc={resizerImage}
          onResize={handleResizeComplete}
          onClose={() => {
            setShowResizer(false);
            setResizerImage(null);
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl mx-auto space-y-6"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold glowing-text">Add New Product</h1>
            <p className="text-sm text-muted-foreground mt-1">Create a new product in your inventory</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                    <img src={imagePreview} alt="Product" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex gap-1 items-center justify-center opacity-0 hover:opacity-100 bg-black/50 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCropperImage(imagePreview);
                          setShowCropper(true);
                        }}
                        className="bg-purple-500 hover:bg-purple-600"
                        data-testid="button-crop-image"
                        title="Crop"
                      >
                        <Crop className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setResizerImage(imagePreview);
                          setShowResizer(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600"
                        data-testid="button-resize-image"
                        title="Resize"
                      >
                        <Sliders className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeImage}
                        className="bg-red-500 hover:bg-red-600"
                        data-testid="button-remove-image"
                      >
                        <X className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground flex items-center justify-center bg-secondary/50">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                    data-testid="input-product-image"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, GIF (Max 5MB)</p>
                  {imagePreview && (
                    <p className="text-xs text-blue-500">Hover over image to resize or remove</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Industrial Component A"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  data-testid="input-product-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="e.g., MFG-001"
                  value={formData.sku}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  data-testid="input-product-sku"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your product..."
                value={formData.description}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                rows={4}
                data-testid="textarea-product-description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  data-testid="input-product-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ($) *</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  placeholder="e.g., 19.99"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  step="0.01"
                  data-testid="input-product-price"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
                disabled={isLoading}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
                data-testid="button-add-product"
              >
                {isLoading ? "Adding Product..." : "Add Product"}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </>
  );
}
