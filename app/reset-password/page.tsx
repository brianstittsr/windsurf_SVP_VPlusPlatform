"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const oobCode = searchParams.get("oobCode"); // Firebase action code

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  useEffect(() => {
    const verifyToken = async () => {
      setIsVerifying(true);
      
      // Handle Firebase oobCode (from Firebase email)
      if (oobCode && auth) {
        try {
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(userEmail);
          setTokenValid(true);
        } catch (err) {
          console.error("Invalid or expired reset code:", err);
          setError("This password reset link is invalid or has expired. Please request a new one.");
          setTokenValid(false);
        }
      }
      // Handle custom token (from our API)
      else if (token) {
        try {
          const response = await fetch(`/api/admin/verify-reset-token?token=${token}`);
          const data = await response.json();
          
          if (data.valid) {
            setEmail(data.email);
            setTokenValid(true);
          } else {
            setError(data.error || "This password reset link is invalid or has expired.");
            setTokenValid(false);
          }
        } catch (err) {
          setError("Unable to verify reset link. Please try again.");
          setTokenValid(false);
        }
      } else {
        setError("No reset token provided. Please use the link from your email.");
        setTokenValid(false);
      }
      
      setIsVerifying(false);
    };

    verifyToken();
  }, [token, oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordStrong) {
      setError("Please create a stronger password.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // Handle Firebase oobCode
      if (oobCode && auth) {
        await confirmPasswordReset(auth, oobCode, password);
        setIsSuccess(true);
      }
      // Handle custom token
      else if (token) {
        const response = await fetch("/api/admin/complete-password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });

        const data = await response.json();

        if (data.success) {
          setIsSuccess(true);
        } else {
          setError(data.error || "Failed to reset password. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (err.code === "auth/expired-action-code") {
        setError("This reset link has expired. Please request a new one.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" />
              <p className="text-muted-foreground">Verifying your reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#C8A951] to-[#a08840] rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <Image
                src="/VPlus_logo.webp"
                alt="Strategic Value+ Logo"
                width={80}
                height={80}
                className="relative h-20 w-auto"
                priority
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Strategic Value+</h1>
              <p className="text-sm text-muted-foreground">Transforming U.S. Manufacturing</p>
            </div>
          </Link>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          {!tokenValid ? (
            // Invalid/Expired Token State
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold">Link Invalid or Expired</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button asChild className="mt-4">
                  <Link href="/forgot-password">Request New Reset Link</Link>
                </Button>
              </div>
            </CardContent>
          ) : isSuccess ? (
            // Success State
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Password Reset Successful!</h3>
                <p className="text-muted-foreground">
                  Your password has been successfully updated. You can now sign in with your new password.
                </p>
                <Button 
                  className="mt-4 bg-gradient-to-r from-[#C8A951] to-[#a08840] hover:from-[#b89841] hover:to-[#907830]"
                  onClick={() => router.push("/sign-in")}
                >
                  Sign In Now
                </Button>
              </div>
            </CardContent>
          ) : (
            // Reset Form
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-center">Create New Password</CardTitle>
                <CardDescription className="text-center">
                  {email && (
                    <span>
                      Enter a new password for <strong>{email}</strong>
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                        placeholder="Enter new password"
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

                  {/* Password Strength Indicators */}
                  {password.length > 0 && (
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-1 ${hasMinLength ? "text-green-600" : "text-muted-foreground"}`}>
                          {hasMinLength ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                          8+ characters
                        </div>
                        <div className={`flex items-center gap-1 ${hasUppercase ? "text-green-600" : "text-muted-foreground"}`}>
                          {hasUppercase ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                          Uppercase letter
                        </div>
                        <div className={`flex items-center gap-1 ${hasLowercase ? "text-green-600" : "text-muted-foreground"}`}>
                          {hasLowercase ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                          Lowercase letter
                        </div>
                        <div className={`flex items-center gap-1 ${hasNumber ? "text-green-600" : "text-muted-foreground"}`}>
                          {hasNumber ? <CheckCircle className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                          Number
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                        {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-[#C8A951] to-[#a08840] hover:from-[#b89841] hover:to-[#907830] text-white font-semibold"
                    disabled={isLoading || !isPasswordStrong || !passwordsMatch}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </form>

                {/* Security Notice */}
                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Your connection is secure. Strategic Value+ uses industry-standard encryption to protect your information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          )}
          <CardFooter className="pt-0">
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
