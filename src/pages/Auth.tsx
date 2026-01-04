import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import lookforLogo from "@/assets/lookfor-logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

type AuthStep = "credentials" | "verify" | "forgot-password" | "reset-sent";
type AuthMethod = "email" | "phone";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>("credentials");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);


  const getErrorMessage = (error: any): string => {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("password") || msg.includes("weak") || msg.includes("short") || msg.includes("character")) {
      return "Password must be at least 7 chars long and contain lowercase, uppercase and 1 special char.";
    }
    return "An error occurred. Please try again later.";
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMethod === "email") {
        const redirectUrl = `${window.location.origin}/onboarding`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          toast.error(getErrorMessage(error));
        } else if (data.user) {
          toast.success("Check your email for a confirmation link!");
          setStep("verify");
        }
      } else {
        // Phone sign-up with OTP
        const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
        const { error } = await supabase.auth.signUp({
          phone: formattedPhone,
          password,
        });

        if (error) {
          toast.error(getErrorMessage(error));
        } else {
          toast.success("Check your phone for a verification code!");
          setStep("verify");
        }
      }
    } catch (error: any) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });

      if (error) {
        toast.error("An error occurred. Please try again later.");
      } else {
        toast.success("Phone verified! Let's complete your profile.");
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMethod === "email") {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(getErrorMessage(error));
        } else {
          toast.success("Welcome back!");
          navigate("/");
        }
      } else {
        const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
        const { error } = await supabase.auth.signInWithPassword({
          phone: formattedPhone,
          password,
        });
        if (error) {
          toast.error(getErrorMessage(error));
        } else {
          toast.success("Welcome back!");
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const resetUrl = `${window.location.origin}/auth?reset=true`;
      
      // Send password reset via Supabase (this generates the secure token)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      });

      if (error) {
        toast.error("An error occurred. Please try again later.");
      } else {
        toast.success("Check your email for a password reset link!");
        setStep("reset-sent");
      }
    } catch (error: any) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      if (authMethod === "phone") {
        const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
        const { error } = await supabase.auth.resend({
          type: "sms",
          phone: formattedPhone,
        });
        if (error) {
          toast.error("An error occurred. Please try again later.");
        } else {
          toast.success("Verification code resent!");
        }
      } else {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
        });
        if (error) {
          toast.error("An error occurred. Please try again later.");
        } else {
          toast.success("Confirmation email resent!");
        }
      }
    } catch (error: any) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Password reset sent confirmation
  if (step === "reset-sent") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <img
                src={lookforLogo}
                alt="Lookfor"
                className="w-20 h-20 rounded-2xl object-cover"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to <strong>{email}</strong>. 
              Click the link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("credentials");
                setIsLogin(true);
              }}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password form
  if (step === "forgot-password") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <img
                src={lookforLogo}
                alt="Lookfor"
                className="w-20 h-20 rounded-2xl object-cover"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <div className="mt-4">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("credentials");
                  setIsLogin(true);
                }}
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email verification step (waiting for link click)
  if (step === "verify" && authMethod === "email") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <img
                src={lookforLogo}
                alt="Lookfor"
                className="w-20 h-20 rounded-2xl object-cover"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to <strong>{email}</strong>. 
              Click the link to verify your account and continue to profile setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendCode}
              disabled={loading}
            >
              {loading ? "Sending..." : "Resend confirmation email"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("credentials");
                setEmail("");
                setPassword("");
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phone OTP verification step
  if (step === "verify" && authMethod === "phone") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <img
                src={lookforLogo}
                alt="Lookfor"
                className="w-20 h-20 rounded-2xl object-cover"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Phone</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to <strong>{phone}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend code"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("credentials");
                  setPhone("");
                  setPassword("");
                  setOtp("");
                }}
              >
                Use a different phone number
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <img
              src={lookforLogo}
              alt="Lookfor"
              className="w-20 h-20 rounded-2xl object-cover"
            />
          </div>
          <CardTitle className="text-3xl font-bold">
            {isLogin ? "Welcome Back" : "Join Lookfor"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to explore and create experiences"
              : "Create an account to start discovering and sharing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {authMethod === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for US)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {isLogin && authMethod === "email" && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setStep("forgot-password")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
