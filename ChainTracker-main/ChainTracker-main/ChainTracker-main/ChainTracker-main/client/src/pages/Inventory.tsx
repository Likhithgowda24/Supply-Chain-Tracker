import { Plus, Trash2, Boxes } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Product {
  productId: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  category?: string;
}

export default function Inventory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    category: "",
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product added successfully!",
      });
      setNewProduct({ name: "", price: "", stock: "", description: "", category: "" });
      setIsAddProductDialogOpen(false);
      refetchProducts();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/products/${productId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
      refetchProducts();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      toast({
        title: "Error",
        description: "Name, price, and stock are required",
        variant: "destructive",
      });
      return;
    }
    addProductMutation.mutate({
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      description: newProduct.description,
      category: newProduct.category,
    });
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeInOut", staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-3xl font-bold glowing-text flex items-center gap-2">
          <Boxes className="w-8 h-8" />
          Inventory Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your product inventory
        </p>
      </motion.div>

      {/* Search and Add Product */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="zoom-pop text-sm h-9"
            data-testid="input-search-inventory-products"
          />
        </div>
        <Button
          onClick={() => setIsAddProductDialogOpen(true)}
          className="zoom-pop"
          size="sm"
          data-testid="button-add-inventory-product"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </motion.div>

      {/* Products Table */}
      <motion.div variants={itemVariants}>
        <Card className="glowing-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Product ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Stock</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No products found. Add one to get started!
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <motion.tr
                      key={product.productId}
                      variants={itemVariants}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid={`row-inventory-product-${product.productId}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{product.productId.slice(0, 12)}...</td>
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{product.category || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-primary">${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(String(product.price)).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={typeof product.stock === 'number' && product.stock > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteProductMutation.mutate(product.productId)}
                          disabled={deleteProductMutation.isPending}
                          className="h-8 w-8"
                          data-testid={`button-delete-inventory-product-${product.productId}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Add Product Dialog */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the product details below to add a new product to your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-name" className="text-sm">
                Product Name *
              </Label>
              <Input
                id="product-name"
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-inventory-product-name"
              />
            </div>

            <div>
              <Label htmlFor="product-price" className="text-sm">
                Price *
              </Label>
              <Input
                id="product-price"
                type="number"
                placeholder="0.00"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-inventory-product-price"
              />
            </div>

            <div>
              <Label htmlFor="product-stock" className="text-sm">
                Stock *
              </Label>
              <Input
                id="product-stock"
                type="number"
                placeholder="0"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-inventory-product-stock"
              />
            </div>

            <div>
              <Label htmlFor="product-category" className="text-sm">
                Category
              </Label>
              <Input
                id="product-category"
                placeholder="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-inventory-product-category"
              />
            </div>

            <div>
              <Label htmlFor="product-description" className="text-sm">
                Description
              </Label>
              <Input
                id="product-description"
                placeholder="Product description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="zoom-pop text-sm h-8 mt-1"
                data-testid="input-inventory-product-description"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddProductDialogOpen(false)}
                size="sm"
                data-testid="button-cancel-inventory-product"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProduct}
                size="sm"
                disabled={addProductMutation.isPending}
                data-testid="button-save-inventory-product"
              >
                {addProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
