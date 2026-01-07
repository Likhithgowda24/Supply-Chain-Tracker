import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (address: AddressData) => void;
  isSubmitting?: boolean;
}

export interface AddressData {
  building: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export function AddressDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: AddressDialogProps) {
  const [address, setAddress] = useState<AddressData>({
    building: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddressData, string>>>({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof AddressData, string>> = {};

    if (!address.building.trim()) {
      newErrors.building = "Building name/number is required";
    }

    if (!address.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!address.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!address.pinCode.trim()) {
      newErrors.pinCode = "Pin code is required";
    } else if (!/^\d{6}$/.test(address.pinCode)) {
      newErrors.pinCode = "Pin code must be 6 digits";
    }

    if (!address.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(address);
      // Reset form after submission
      setAddress({
        building: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India",
      });
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Shipping Address
          </DialogTitle>
          <DialogDescription>
            Please enter your delivery address to complete the order
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="building">
                Building Name/Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="building"
                placeholder="e.g., Flat 301, Building A"
                value={address.building}
                onChange={(e) => setAddress({ ...address, building: e.target.value })}
                data-testid="input-building"
              />
              {errors.building && (
                <p className="text-sm text-destructive">{errors.building}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                placeholder="e.g., Bangalore"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                data-testid="input-city"
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Select
                value={address.state}
                onValueChange={(value) => setAddress({ ...address, state: value })}
              >
                <SelectTrigger id="state" data-testid="select-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pinCode">
                Pin Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pinCode"
                placeholder="e.g., 560001"
                maxLength={6}
                value={address.pinCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setAddress({ ...address, pinCode: value });
                }}
                data-testid="input-pincode"
              />
              {errors.pinCode && (
                <p className="text-sm text-destructive">{errors.pinCode}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country"
                value={address.country}
                disabled
                className="opacity-60 cursor-not-allowed"
                data-testid="input-country"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              data-testid="button-cancel-address"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-confirm-address"
            >
              {isSubmitting ? "Placing Order..." : "Confirm & Place Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
