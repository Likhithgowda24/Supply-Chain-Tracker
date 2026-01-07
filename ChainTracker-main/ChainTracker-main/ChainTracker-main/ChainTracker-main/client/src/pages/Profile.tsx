import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Package, Upload, X, Heart, Truck, MapPin } from "lucide-react";

const cancelReasons = [
  "Changed my mind",
  "Found better price elsewhere",
  "Product delayed",
  "No longer needed",
  "Ordered by mistake",
  "Other",
];
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function OrdersTab() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetails, setCancelDetails] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    refetchInterval: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json().then((data: any[]) =>
        data.filter((p: any) => p.image)
      );
    },
    retry: false,
  });

  // Display all orders (not just shop products with images)
  const filteredOrders = orders;

  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/orders/${selectedOrder.orderId}`, {
        status: "cancelled",
        cancelReason,
        cancelDetails,
      });
    },
    onSuccess: () => {
      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setModalOpen(false);
      setSelectedOrder(null);
      setCancelReason("");
      setCancelDetails("");
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/orders/${selectedOrder.orderId}`, {
        status: "delivered",
      });
    },
    onSuccess: () => {
      toast({
        title: "Order Marked as Delivered",
        description: "Your order has been marked as delivered",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to mark order as delivered",
        variant: "destructive",
      });
    },
  });

  // Update selectedOrder whenever orders data changes to keep it fresh
  useEffect(() => {
    if (selectedOrder && modalOpen && orders.length > 0) {
      const updatedOrder = orders.find((o: any) => o.orderId === selectedOrder.orderId);
      if (updatedOrder && updatedOrder.status !== selectedOrder.status) {
        console.log(`Order ${selectedOrder.orderId} status changed from ${selectedOrder.status} to ${updatedOrder.status}`);
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrder, modalOpen]);

  const handleOrderClick = (order: any) => {
    // Get the fresh order from the orders list to ensure latest status
    const freshOrder = orders.find((o: any) => o.orderId === order.orderId) || order;
    setSelectedOrder(freshOrder);
    setModalOpen(true);
    setCancelReason("");
    setCancelDetails("");
  };

  const getStatusLower = (status: string): string => {
    return (status || "").toLowerCase().trim();
  };

  const canCancel =
    selectedOrder &&
    selectedOrder.status &&
    (getStatusLower(selectedOrder.status) === "placed" ||
      getStatusLower(selectedOrder.status) === "confirmed" ||
      getStatusLower(selectedOrder.status) === "in-transit" ||
      getStatusLower(selectedOrder.status) === "processing");

  const canMarkDelivered =
    selectedOrder &&
    selectedOrder.status &&
    (getStatusLower(selectedOrder.status) === "shipped" ||
      getStatusLower(selectedOrder.status) === "placed" ||
      getStatusLower(selectedOrder.status) === "confirmed" ||
      getStatusLower(selectedOrder.status) === "in-transit" ||
      getStatusLower(selectedOrder.status) === "processing");

  console.log("📦 Order opened:", {
    orderId: selectedOrder?.orderId,
    status: selectedOrder?.status,
    canMarkDelivered: canMarkDelivered
  });

  if (isLoading) return <div className="text-muted-foreground">Loading orders...</div>;
  if (filteredOrders.length === 0) return <div className="text-muted-foreground">No orders yet</div>;

  return (
    <>
      <div className="space-y-4">
        {filteredOrders.map((order: any) => {
          const product = products.find((p: any) => p.productId === order.productId);
          return (
            <Card
              key={order.id}
              className="p-4 cursor-pointer hover-elevate"
              onClick={() => handleOrderClick(order)}
              data-testid="card-order"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold">{product?.name || "Unknown Product"}</p>
                  <p className="text-sm text-muted-foreground">Order ID: {order.orderId}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                </div>
                <Badge className="capitalize">{order.status}</Badge>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View order information and manage your order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {(() => {
                const product = products.find((p: any) => p.productId === selectedOrder.productId);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="font-semibold">{selectedOrder.orderId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className="capitalize">{selectedOrder.status}</Badge>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Product Information</h3>
                      <div className="space-y-2">
                        <p>
                          <span className="text-muted-foreground">Name:</span>{" "}
                          <span className="font-medium">{product?.name || "Unknown"}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Quantity:</span>{" "}
                          <span className="font-medium">{selectedOrder.quantity}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Unit Price:</span>{" "}
                          <span className="font-medium">
                            ₹{parseFloat(product?.price || "0").toLocaleString()}
                          </span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Total Amount:</span>{" "}
                          <span className="font-medium">
                            ₹{parseFloat(selectedOrder.totalPrice).toLocaleString()}
                          </span>
                        </p>
                        {product?.description && (
                          <p>
                            <span className="text-muted-foreground">Description:</span>{" "}
                            <span className="text-sm">{product.description}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        Order Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {canMarkDelivered && (
                      <div className="border-t pt-4 space-y-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <h3 className="font-semibold text-green-600">✓ Order Shipped & Ready</h3>
                        <p className="text-sm text-muted-foreground">Your order has been shipped! Click the button below to confirm delivery once you receive it.</p>
                      </div>
                    )}

                    {canCancel && (
                      <div className="border-t pt-4 space-y-3">
                        <h3 className="font-semibold">Cancel Order</h3>
                        <div className="space-y-2">
                          <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
                          <Select value={cancelReason} onValueChange={setCancelReason}>
                            <SelectTrigger id="cancel-reason" data-testid="select-cancel-reason">
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {cancelReasons.map((reason) => (
                                <SelectItem key={reason} value={reason}>
                                  {reason}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cancel-details">Additional Details (Optional)</Label>
                          <Textarea
                            id="cancel-details"
                            placeholder="Tell us more about why you want to cancel..."
                            value={cancelDetails}
                            onChange={(e) => setCancelDetails(e.target.value)}
                            data-testid="textarea-cancel-details"
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-testid="button-close-order-modal"
            >
              Close
            </Button>
            {canMarkDelivered && (
              <Button
                onClick={() => markDeliveredMutation.mutate()}
                disabled={markDeliveredMutation.isPending}
                data-testid="button-mark-delivered"
                className="bg-green-600 hover:bg-green-700"
              >
                {markDeliveredMutation.isPending ? "Marking as Delivered..." : "Mark as Delivered"}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => cancelOrderMutation.mutate()}
                disabled={!cancelReason || cancelOrderMutation.isPending}
                data-testid="button-confirm-cancel-order"
              >
                {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

function WishlistTab() {
  const { data: wishlistItems = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
    retry: false,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json().then((data: any[]) =>
        data.filter((p: any) => p.image)
      );
    },
    retry: false,
  });

  // Filter wishlist products to only include those with images (Shop products)
  const wishlistProducts = products.filter((p: any) =>
    wishlistItems.some((item: any) => item.productId === p.productId)
  );

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/wishlist/${productId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Loading wishlist...</div>;
  if (wishlistProducts.length === 0) return <div className="text-muted-foreground">No items in wishlist</div>;

  return (
    <div className="space-y-4">
      {wishlistProducts.map((product: any) => (
        <Card key={product.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-muted-foreground">Price: ₹{product.price}</p>
              <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeFromWishlistMutation.mutate(product.productId)}
              disabled={removeFromWishlistMutation.isPending}
              data-testid="button-remove-wishlist"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    bio: "",
    role: "customer",
    avatar: null as string | null,
  });

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  // Get current user from localStorage
  const userId = localStorage.getItem("userId");
  const storedRole = localStorage.getItem("role") || "customer";

  // Fetch user profile
  const { data: userData, isLoading: loadingUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    enabled: !!userId,
  });

  // Update local state when user data is fetched
  useEffect(() => {
    if (userData) {
      setProfile({
        username: userData.username || "",
        email: userData.email || "",
        bio: userData.bio || "",
        role: userData.role || storedRole,
        avatar: userData.avatar || null,
      });
    }
  }, [userData, storedRole]);


  // Fetch products from API to show product names in wishlist
  const { data: productsData = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<typeof profile>) => {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          name: data.username,
          bio: data.bio,
          role: data.role,
        }),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await fetch("/api/users/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ avatar: imageData }),
      });
      if (!response.ok) throw new Error("Failed to upload avatar");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setImageDialogOpen(false);
      setSelectedImage(null);
      setCroppedImageUrl(null);
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setImageDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = (): string | null => {
    if (!imageRef.current || !crop.width || !crop.height) {
      toast({
        title: "Error",
        description: "Please select a crop area for your image",
        variant: "destructive",
      });
      return null;
    }

    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Resize to max 512x512 for avatar
    const maxSize = 512;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    canvas.width = Math.min(cropWidth, maxSize);
    canvas.height = Math.min(cropHeight, maxSize);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
      return null;
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleCropComplete = () => {
    const croppedImage = getCroppedImg();
    if (croppedImage) {
      setCroppedImageUrl(croppedImage);
    }
  };

  const handleUploadCroppedImage = () => {
    if (!croppedImageUrl) {
      toast({
        title: "No image",
        description: "Please crop the image first",
        variant: "destructive",
      });
      return;
    }

    // Check image size (max 2MB after compression)
    const sizeInBytes = (croppedImageUrl.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Cropped image is too large. Please select a smaller area.",
        variant: "destructive",
      });
      return;
    }

    uploadAvatarMutation.mutate(croppedImageUrl);
  };

  const handleCancelCrop = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
    setCroppedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar || ""} alt={profile.username} />
                <AvatarFallback className="text-2xl">
                  {profile.username ? profile.username.slice(0, 2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                onClick={handleImageClick}
                className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                data-testid="button-upload-avatar"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-avatar"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.username}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge className="mt-2 capitalize">{profile.role}</Badge>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {storedRole === "customer" && (
                <>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card className="p-6">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      data-testid="input-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="opacity-60 cursor-not-allowed"
                      data-testid="input-email"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      data-testid="textarea-bio"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Card>
            </TabsContent>

            {storedRole === "customer" && (
              <>
                <TabsContent value="orders" className="mt-6">
                  <Card className="p-6">
                    <OrdersTab />
                  </Card>
                </TabsContent>

                <TabsContent value="wishlist" className="mt-6">
                  <Card className="p-6">
                    <WishlistTab />
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      {/* Image Crop Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop Your Profile Picture</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedImage && (
              <div className="max-h-[500px] overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={handleCropComplete}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Crop preview"
                    style={{ maxWidth: '100%' }}
                  />
                </ReactCrop>
              </div>
            )}

            {croppedImageUrl && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Preview:</p>
                <Avatar className="h-32 w-32">
                  <AvatarImage src={croppedImageUrl} alt="Cropped preview" />
                </Avatar>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelCrop}
              disabled={uploadAvatarMutation.isPending}
              data-testid="button-cancel-crop"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleUploadCroppedImage}
              disabled={!croppedImageUrl || uploadAvatarMutation.isPending}
              data-testid="button-upload-cropped"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadAvatarMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
