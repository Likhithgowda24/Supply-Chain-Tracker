import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { OTPInput } from "@/components/OTPInput";
import { RoleSelection } from "@/components/RoleSelection";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "otp" | "role">("email");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setStep("otp");
        toast({ title: "OTP Sent", description: "Check your email for the code" });
      } else {
        setError("Failed to send OTP");
      }
    } catch (err) {
      setError("Error sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, username: username || email.split("@")[0] }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.accessToken);
        setStep("role");
        toast({ title: "Success", description: "OTP verified" });
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Error verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    await handleSendOTP({ preventDefault: () => {} } as any);
  };

  const handleRoleSelect = (role: string) => {
    localStorage.setItem("role", role);
    window.location.href = "/";
  };

  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center glowing-bg p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          <RoleSelection onRoleSelect={handleRoleSelect} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center glowing-bg p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Logo size="lg" showText={false} />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold">Supply Chain Tracker</h1>
          <p className="text-muted-foreground mt-2">Blockchain-powered logistics management</p>
        </div>

        <Card className="p-6 zoom-pop">
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Welcome Back</h3>
                <p className="text-sm text-muted-foreground mb-4">Sign in with OTP</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email or Username</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="zoom-pop"
                  data-testid="input-auth-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username (optional)</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="zoom-pop"
                  data-testid="input-auth-username"
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full zoom-pop" disabled={!email || isLoading} data-testid="button-send-otp">
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <OTPInput
              onOTPSubmit={handleVerifyOTP}
              onResend={handleResendOTP}
              isLoading={isLoading}
              error={error}
            />
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Demo: test@example.com (OTP will be logged to console)
        </p>
      </motion.div>
    </div>
  );
}
