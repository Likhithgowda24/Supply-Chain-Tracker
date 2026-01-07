import { ShoppingCart, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  onOrder?: (id: string, quantity: number) => void;
  onWishlist?: (id: string) => void;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  category,
  stock,
  onOrder,
  onWishlist,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onWishlist?.(id);
  };

  return (
    <Card className="overflow-hidden hover-elevate zoom-pop transition-all hover:[animation:menu-zoom-glow_0.5s_ease-in-out] duration-300" data-testid={`card-product-${id}`}>
      <div className="aspect-square bg-muted relative">
        {image ? (
          <img src={image} alt={name} className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <ShoppingCart className="h-12 w-12" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:scale-110 transition-transform duration-300"
          onClick={handleWishlist}
          data-testid={`button-wishlist-${id}`}
        >
          <Heart className={`h-4 w-4 transition-all ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <Badge variant="secondary" className="mb-2 text-xs hover:scale-105 transition-transform duration-300">
            {category}
          </Badge>
          <p className="font-mono text-xs text-muted-foreground">{id}</p>
          <h3 className="font-semibold line-clamp-2 mt-1">{name}</h3>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">₹{price.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{stock} in stock</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-8 px-2 hover:scale-110 transition-transform duration-300"
              data-testid={`button-decrease-quantity-${id}`}
            >
              −
            </Button>
            <span className="px-3 text-sm font-medium" data-testid={`text-quantity-${id}`}>{quantity}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              className="h-8 px-2 hover:scale-110 transition-transform duration-300"
              data-testid={`button-increase-quantity-${id}`}
            >
              +
            </Button>
          </div>
          <Button
            className="flex-1 zoom-pop transition-all"
            onClick={() => onOrder?.(id, quantity)}
            data-testid={`button-order-${id}`}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order
          </Button>
        </div>
      </div>
    </Card>
  );
}
