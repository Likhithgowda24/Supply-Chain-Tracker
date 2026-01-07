import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, Heart, X, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    image?: string;
    description?: string;
  } | null;
  onOrder?: (id: string, quantity: number) => void;
  onWishlist?: (id: string) => void;
}

export function ProductDetailModal({
  open,
  onOpenChange,
  product,
  onOrder,
  onWishlist,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const ratingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ratings", {
        productId: product?.id,
        rating: rating,
        review: review
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setRating(0);
      setReview("");
      toast({
        title: "Rating Submitted",
        description: "Thank you for rating this product!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  if (!product) return null;

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onWishlist?.(product.id);
  };

  const handleOrder = () => {
    onOrder?.(product.id, quantity);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative aspect-square bg-muted rounded-lg overflow-hidden"
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="h-16 w-16" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
              onClick={handleWishlist}
              data-testid={`button-wishlist-modal-${product.id}`}
            >
              <Heart
                className={`h-4 w-4 transition-all ${isWishlisted ? "fill-red-500 text-red-500" : ""
                  }`}
              />
            </Button>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="space-y-4"
          >
            <div>
              <Badge variant="secondary" className="mb-3">
                {product.category}
              </Badge>
              <p className="font-mono text-xs text-muted-foreground mb-2">
                {product.id}
              </p>
              <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price and Stock */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
            >
              <div>
                <p className="text-sm text-muted-foreground mb-1">Price</p>
                <p className="text-3xl font-bold text-primary">
                  ₹{product.price.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Stock</p>
                <p className="text-2xl font-semibold">{product.stock} Available</p>
              </div>
            </motion.div>

            {/* Quantity Selector */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium">Quantity</p>
              <div className="flex items-center border rounded-lg w-fit">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 px-3"
                  data-testid={`button-decrease-qty-modal-${product.id}`}
                >
                  −
                </Button>
                <span className="px-4 text-lg font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="h-10 px-3"
                  data-testid={`button-increase-qty-modal-${product.id}`}
                >
                  +
                </Button>
              </div>
            </motion.div>

            {/* Rating Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="space-y-3 p-4 bg-muted/30 rounded-lg"
            >
              <p className="text-sm font-medium">Rate and Review this product</p>
              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    data-testid={`button-rating-${star}`}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                        }`}
                    />
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Write a description about your experience (optional)..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="resize-none min-h-[80px]"
              />

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => ratingMutation.mutate()}
                  disabled={rating === 0 || ratingMutation.isPending}
                >
                  Submit Review
                </Button>
              </div>

              {rating > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  You selected {rating} star{rating !== 1 ? "s" : ""}
                </p>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex gap-3 pt-4"
            >
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  if (ratingMutation.isSuccess) {
                    setLocation("/");
                  }
                }}
                className="flex-1"
                data-testid="button-close-modal"
              >
                Close
              </Button>
              <Button
                onClick={handleOrder}
                className="flex-1"
                data-testid={`button-order-modal-${product.id}`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Order Now
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
