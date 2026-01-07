import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface OTPInputProps {
  onOTPSubmit: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function OTPInput({ onOTPSubmit, onResend, isLoading, error }: OTPInputProps) {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [isResending, setIsResending] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    try {
      await onOTPSubmit(otp);
      setAttempts(attempts + 1);
    } catch (error) {
      console.error("OTP submit error:", error);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setOtp("");
      setTimeLeft(300);
      setAttempts(0);
    } catch (error) {
      console.error("OTP resend error:", error);
    } finally {
      setIsResending(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Enter OTP</h3>
          <p className="text-sm text-muted-foreground">
            A 6-digit code has been sent to your phone/email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono zoom-pop"
              data-testid="input-otp"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center justify-between text-sm">
            <span className={isExpired ? "text-destructive font-semibold" : "text-muted-foreground"}>
              {isExpired ? "OTP Expired" : `Expires in ${minutes}:${seconds.toString().padStart(2, "0")}`}
            </span>
            {attempts > 0 && (
              <span className="text-muted-foreground">
                Attempts: {attempts}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={otp.length !== 6 || isLoading || isExpired}
            className="w-full zoom-pop"
            data-testid="button-verify-otp"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={timeLeft > 120 || isResending}
          className="w-full zoom-pop"
          data-testid="button-resend-otp"
        >
          {isResending ? "Sending..." : "Resend OTP"}
        </Button>
      </div>
    </motion.div>
  );
}
