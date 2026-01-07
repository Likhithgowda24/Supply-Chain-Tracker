import { ProductCard } from "../ProductCard";

export default function ProductCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <ProductCard
        id="PROD-001"
        name="Wireless Bluetooth Headphones"
        price={2499}
        category="Electronics"
        stock={45}
        onOrder={(id, qty) => console.log("Order:", id, qty)}
        onWishlist={(id) => console.log("Wishlist:", id)}
      />
      <ProductCard
        id="PROD-002"
        name="Smart Watch Series 5"
        price={12999}
        category="Wearables"
        stock={23}
        onOrder={(id, qty) => console.log("Order:", id, qty)}
        onWishlist={(id) => console.log("Wishlist:", id)}
      />
      <ProductCard
        id="PROD-003"
        name="Portable Power Bank 20000mAh"
        price={1899}
        category="Accessories"
        stock={89}
        onOrder={(id, qty) => console.log("Order:", id, qty)}
        onWishlist={(id) => console.log("Wishlist:", id)}
      />
    </div>
  );
}
