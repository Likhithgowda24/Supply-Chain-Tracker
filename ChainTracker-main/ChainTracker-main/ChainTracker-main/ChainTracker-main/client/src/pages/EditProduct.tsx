import { ArrowLeft, Upload, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function EditProduct() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/edit-product/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Robust ID extraction
  const productId = match && params?.id ? params.id : window.location.pathname.split('/').pop();

  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    quantity: "",
    unitPrice: "",
    image: "",
  });

  // Fetch product data
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      if (!productId) throw new Error("No product ID");
      const response = await fetch(`/api/products/${productId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch product");
      const data = await response.json();
      return {
        ...data,
        price: typeof data.price === 'number' ? data.price : parseFloat(String(data.price) || '0'),
        stock: typeof data.stock === 'number' ? data.stock : parseInt(String(data.stock) || '0'),
      };
    },
    enabled: !!productId,
  });

  // Populate form when product data loads
  useEffect(() => {
    if (product) {
      console.log("Product data loaded:", product); // Debug log
      setFormData({
        name: product.name || "",
        sku: product.productId || product.sku || "",
        description: product.description || "",
        quantity: String(product.stock || ""),
        unitPrice: String(product.price || ""),
        image: product.image || "",
      });
      if (product.image) {
        setImagePreview(product.image);
      }
    }
  }, [product]);

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
      setFormData((prev) => ({
        ...prev,
        image: base64String,
      }));
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
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
        setIsLoading(false);
        return;
      }

      // Update product
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          stock: parseInt(formData.quantity),
          price: parseFloat(formData.unitPrice),
          image: formData.image,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product updated successfully!",
        });

        // Invalidate queries
        const manufacturerId = localStorage.getItem("userId");
        queryClient.invalidateQueries({ queryKey: ["/api/products", manufacturerId] });
        queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/stats"] });

        // Redirect to my products
        setTimeout(() => {
          setLocation("/my-products");
        }, 1000);
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update product",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully!",
        });

        // Invalidate queries
        const manufacturerId = localStorage.getItem("userId");
        queryClient.invalidateQueries({ queryKey: ["/api/products", manufacturerId] });
        queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/stats"] });

        // Redirect to my products
        setTimeout(() => {
          setLocation("/my-products");
        }, 1000);
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete product",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  return (
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
          onClick={() => setLocation("/my-products")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold glowing-text">Edit Product</h1>
          <p className="text-sm text-muted-foreground mt-1">Update product information</p>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
                    data-testid="button-remove-image"
                  >
                    <X className="w-4 h-4 text-white" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground flex items-center justify-center bg-secondary/50">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isLoading}
                  data-testid="input-product-image"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">Supported formats: JPG, PNG, GIF (Max 5MB)</p>
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
              onClick={() => setLocation("/my-products")}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              data-testid="button-update-product"
            >
              {isLoading ? "Updating Product..." : "Update Product"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleDelete()}
              disabled={isLoading}
              data-testid="button-delete-product"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
