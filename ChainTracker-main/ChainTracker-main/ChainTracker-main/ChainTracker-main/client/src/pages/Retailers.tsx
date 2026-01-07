import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Mail, Phone, MapPin, ShoppingCart, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Retailer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  joinedDate: string;
  status: "active" | "inactive";
}

export default function Retailers() {
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);

  const { data: retailers = [], isLoading } = useQuery<Retailer[]>({
    queryKey: ["/api/retailers"],
  });

  const activeRetailers = retailers.filter((r) => r.status === "active").length;
  const totalOrders = retailers.reduce((sum, r) => sum + r.totalOrders, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading retailers...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 glowing-text">Retailers Network</h1>
        <p className="text-muted-foreground">
          Manage retailers who sell your products
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Retailers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">{retailers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeRetailers} active
            </p>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From retailers
            </p>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-background/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glowing-text">
              {retailers.length > 0 ? (totalOrders / retailers.length).toFixed(1) : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per retailer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Retailers List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Retailers</h2>
        {retailers.length === 0 ? (
          <Card className="border border-primary/20 bg-background/50">
            <CardContent className="pt-8 pb-8 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No retailers found. When retailers order your products, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {retailers.map((retailer) => (
              <Card
                key={retailer.id}
                className="border border-primary/20 bg-background/50 hover:border-primary/40 cursor-pointer transition-colors hover-elevate"
                onClick={() => setSelectedRetailer(retailer)}
                data-testid={`card-retailer-${retailer.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{retailer.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Joined {retailer.joinedDate}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={retailer.status === "active" ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {retailer.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground break-all">{retailer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {retailer.totalOrders} {retailer.totalOrders === 1 ? "order" : "orders"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Retailer Details Dialog */}
      <Dialog
        open={selectedRetailer !== null}
        onOpenChange={(open) => !open && setSelectedRetailer(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRetailer?.name}</DialogTitle>
            <DialogDescription>Retailer Information</DialogDescription>
          </DialogHeader>
          {selectedRetailer && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Email</p>
                <p className="text-sm break-all">{selectedRetailer.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={selectedRetailer.status === "active" ? "default" : "secondary"}
                >
                  {selectedRetailer.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Total Orders
                </p>
                <p className="text-2xl font-bold glowing-text">
                  {selectedRetailer.totalOrders}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Joined Date
                </p>
                <p className="text-sm">{selectedRetailer.joinedDate}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
