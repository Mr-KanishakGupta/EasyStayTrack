import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Header from "@/components/Header";
import { auth } from "@/lib/api";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  aadhaar: z.string().length(12, "Aadhaar number must be 12 digits").regex(/^\d+$/, "Aadhaar must contain only numbers"),
});

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Login OTP flow states
  const [loginStep, setLoginStep] = useState<"email" | "otp">("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    if (auth.isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse({ email: loginEmail });

      setLoading(true);
      await auth.sendOTP(loginEmail);

      toast.success("OTP sent to your email!");
      setLoginStep("otp");
      setOtpTimer(120); // 2 minutes
      setOtp("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      otpSchema.parse({ otp });

      setLoading(true);
      const data = await auth.verifyOTP(loginEmail, otp);

      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error instanceof Error ? error.message : "Invalid OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await auth.resendOTP(loginEmail);

      toast.success("New OTP sent to your email!");
      setOtpTimer(120);
      setOtp("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      signupSchema.parse({
        email: signupEmail,
        password: signupPassword,
        fullName,
        phone,
        aadhaar,
      });

      setLoading(true);
      await auth.register({
        email: signupEmail,
        password: signupPassword,
        full_name: fullName,
        phone: phone,
        aadhaar: aadhaar,
      });

      toast.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error instanceof Error ? error.message : "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to EasyStayTrack</CardTitle>
            <CardDescription>Login or create an account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab with OTP */}
              <TabsContent value="login">
                {loginStep === "email" ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter 6-digit OTP</Label>
                      <p className="text-sm text-muted-foreground">
                        OTP sent to {loginEmail}
                      </p>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="otp"
                          type="text"
                          placeholder="123456"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="pl-10 text-center text-2xl tracking-widest"
                          maxLength={6}
                          required
                        />
                      </div>
                      {otpTimer > 0 && (
                        <p className="text-sm text-center text-muted-foreground">
                          OTP expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                    <div className="flex justify-between items-center text-sm">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setLoginStep("email")}
                        className="px-0"
                      >
                        ← Change email
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleResendOTP}
                        disabled={loading || otpTimer > 0}
                        className="px-0"
                      >
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-aadhaar">Aadhaar Number</Label>
                    <Input
                      id="signup-aadhaar"
                      type="text"
                      placeholder="123456789012"
                      maxLength={12}
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      For security, only the last 4 digits will be stored
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
