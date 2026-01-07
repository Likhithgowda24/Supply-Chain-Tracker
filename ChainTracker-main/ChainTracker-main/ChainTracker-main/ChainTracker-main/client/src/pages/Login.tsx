import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthMode = "login" | "signup";

export default function Login() {
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"customer" | "manufacturer" | "supplier">("customer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "question" | "password">("email");
  const [forgotQuestion, setForgotQuestion] = useState("");
  const [forgotAnswer, setForgotAnswer] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();

      if (data && data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        toast({ title: "Success", description: "Login successful!" });
        setTimeout(() => {
          window.location.href = "/";
        }, 800);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Extract clean error message
      let errorMsg = "Invalid credentials. Please try again.";
      if (err?.message) {
        // Message format is like "401: Invalid credentials"
        const parts = err.message.split(": ");
        if (parts.length > 1) {
          errorMsg = parts[1];
        }
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
      setError("Please fill in all fields including security question");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await apiRequest("POST", "/api/auth/signup", {
        username, email, password, role, securityQuestion, securityAnswer
      });
      const data = await response.json();

      if (data && data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("email", data.user.email);
        toast({ title: "Success", description: "Account created successfully!" });
        setTimeout(() => {
          window.location.href = "/";
        }, 800);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      // Extract clean error message
      let errorMsg = "Signup failed. Please try again.";
      if (err?.message) {
        // Message format is like "400: Email already registered"
        const parts = err.message.split(": ");
        if (parts.length > 1) {
          errorMsg = parts[1];
        }
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupAndLogin = async (e: React.FormEvent) => {
    // Reuse signup but set the flag
    await handleSignup(e);
  };

  const handleForgotPasswordRequest = async () => {
    if (!forgotEmail) {
      setForgotError("Please enter your email");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    try {
      const response = await apiRequest("POST", "/api/auth/get-security-question", { email: forgotEmail });
      const data = await response.json();

      if (data && data.question) {
        setForgotQuestion(data.question);
        setForgotStep("question");
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      let errorMsg = "Error retrieving security question";
      if (err?.message) {
        const parts = err.message.split(": ");
        if (parts.length > 1) {
          errorMsg = parts[1];
        }
      }
      setForgotError(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleAnswerSecurityQuestion = async () => {
    if (!forgotAnswer) {
      setForgotError("Please enter your answer");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password-with-security", {
        email: forgotEmail,
        answer: forgotAnswer,
        newPassword: forgotNewPassword || ""
      });

      if (forgotNewPassword) {
        toast({ title: "Success", description: "Password reset successfully!" });
        setShowForgotPassword(false);
        setForgotStep("email");
        setForgotEmail("");
        setForgotQuestion("");
        setForgotAnswer("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
      } else {
        setForgotStep("password");
      }
    } catch (err: any) {
      console.error("Security answer error:", err);
      let errorMsg = "Error verifying answer";
      if (err?.message) {
        const parts = err.message.split(": ");
        if (parts.length > 1) {
          errorMsg = parts[1];
        }
      }
      setForgotError(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotNewPassword || !forgotConfirmPassword) {
      setForgotError("Please fill in all fields");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotError("Password must be at least 6 characters");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password-with-security", {
        email: forgotEmail,
        answer: forgotAnswer,
        newPassword: forgotNewPassword
      });
      const data = await response.json();

      if (data && data.success) {
        toast({ title: "Success", description: "Password reset successfully!" });
        setShowForgotPassword(false);
        setForgotStep("email");
        setForgotEmail("");
        setForgotQuestion("");
        setForgotAnswer("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      let errorMsg = "Error resetting password";
      if (err?.message) {
        const parts = err.message.split(": ");
        if (parts.length > 1) {
          errorMsg = parts[1];
        }
      }
      setForgotError(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center glowing-bg p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
              <Logo size="md" showText={false} />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold glowing-text">Supply Chain Tracker</h1>
          <p className="text-xs text-muted-foreground mt-1">Blockchain-powered logistics</p>
        </div>

        <Card className="p-4 hover-glow space-y-2">
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className="flex-1 text-sm"
              size="sm"
              data-testid="button-mode-login"
            >
              Login
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className="flex-1 text-sm"
              size="sm"
              data-testid="button-mode-signup"
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-2">
            {mode === "signup" && (
              <div className="space-y-1">
                <Label htmlFor="username" className="text-xs">Username</Label>
                <Input
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="hover-glow text-sm h-8"
                  data-testid="input-username"
                  required={mode === "signup"}
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="hover-glow text-sm h-8"
                data-testid="input-email"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="hover-glow text-sm h-8"
                data-testid="input-password"
                required
              />
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-primary hover:underline mt-1"
                  data-testid="button-forgot-password"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="hover-glow text-sm h-8"
                    data-testid="input-confirm-password"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="role" className="text-xs">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    disabled={isLoading}
                    className="hover-glow w-full px-3 py-1 text-sm border border-input rounded-md bg-background text-foreground h-8 cursor-pointer"
                    data-testid="select-role"
                  >
                    <option value="customer">Customer</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="securityQuestion" className="text-xs">Security Question</Label>
                  <Input
                    id="securityQuestion"
                    placeholder="e.g., What is your pet's name?"
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    disabled={isLoading}
                    className="hover-glow text-sm h-8"
                    data-testid="input-security-question"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="securityAnswer" className="text-xs">Security Answer</Label>
                  <Input
                    id="securityAnswer"
                    placeholder="Your answer"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    disabled={isLoading}
                    className="hover-glow text-sm h-8"
                    data-testid="input-security-answer"
                    required
                  />
                </div>
              </>
            )}

            {error && <p className="text-xs text-destructive bg-destructive/10 p-1 rounded">{error}</p>}

            <Button
              type="submit"
              className="w-full hover-glow font-semibold text-sm"
              size="sm"
              disabled={isLoading}
              data-testid={mode === "login" ? "button-login" : "button-signup"}
            >
              {isLoading
                ? (mode === "login" ? "Logging in..." : "Creating...")
                : (mode === "login" ? "Login" : "Create Account")
              }
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground mt-2">
            <p>
              {mode === "login"
                ? "No account? Click Sign Up"
                : "Have account? Click Login"
              }
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {forgotStep === "email" && "Enter your email address"}
              {forgotStep === "question" && "Answer your security question"}
              {forgotStep === "password" && "Create your new password"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {forgotStep === "email" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-xs">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    className="text-sm h-8"
                    data-testid="input-forgot-email"
                  />
                </div>
                {forgotError && <p className="text-xs text-destructive">{forgotError}</p>}
                <Button
                  onClick={handleForgotPasswordRequest}
                  disabled={forgotLoading}
                  className="w-full text-sm"
                  size="sm"
                  data-testid="button-get-security-question"
                >
                  {forgotLoading ? "Loading..." : "Continue"}
                </Button>
              </>
            )}

            {forgotStep === "question" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Security Question</Label>
                  <p className="text-sm text-muted-foreground">{forgotQuestion}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forgot-answer" className="text-xs">Your Answer</Label>
                  <Input
                    id="forgot-answer"
                    placeholder="Enter your answer"
                    value={forgotAnswer}
                    onChange={(e) => setForgotAnswer(e.target.value)}
                    disabled={forgotLoading}
                    className="text-sm h-8"
                    data-testid="input-security-answer"
                  />
                </div>
                {forgotError && <p className="text-xs text-destructive">{forgotError}</p>}
                <Button
                  onClick={handleAnswerSecurityQuestion}
                  disabled={forgotLoading}
                  className="w-full text-sm"
                  size="sm"
                  data-testid="button-verify-answer"
                >
                  {forgotLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
              </>
            )}

            {forgotStep === "password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="forgot-new-password" className="text-xs">New Password</Label>
                  <Input
                    id="forgot-new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    disabled={forgotLoading}
                    className="text-sm h-8"
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forgot-confirm-password" className="text-xs">Confirm Password</Label>
                  <Input
                    id="forgot-confirm-password"
                    type="password"
                    placeholder="Confirm password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    disabled={forgotLoading}
                    className="text-sm h-8"
                    data-testid="input-confirm-new-password"
                  />
                </div>
                {forgotError && <p className="text-xs text-destructive">{forgotError}</p>}
                <Button
                  onClick={handleResetPassword}
                  disabled={forgotLoading}
                  className="w-full text-sm"
                  size="sm"
                  data-testid="button-reset-password"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
