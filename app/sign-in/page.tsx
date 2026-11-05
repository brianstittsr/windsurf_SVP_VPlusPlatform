"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";


export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("efvs_remembered_email");
    const savedRememberMe = localStorage.getItem("efvs_remember_me") === "true";

    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem("efvs_remembered_email", email);
        localStorage.setItem("efvs_remember_me", "true");
      } else {
        localStorage.removeItem("efvs_remembered_email");
        localStorage.removeItem("efvs_remember_me");
      }

      if (!email || !password) {
        setError("Please enter both email and password");
        setIsLoading(false);
        return;
      }

      if (!auth) {
        setError("Authentication is not configured. Please contact support.");
        setIsLoading(false);
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        const profileResponse = await fetch("/api/profile/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({}),
        });
        if (!profileResponse.ok) {
          const profileResult = await profileResponse.json();
          throw new Error(profileResult.error || "Student profile setup requires EFVS support");
        }
      } catch (authError: unknown) {
        const code = (authError as { code?: string }).code;
        if (code === "auth/user-not-found") {
          setError("No account found with this email. Please sign up first.");
          setIsLoading(false);
          return;
        }
        if (
          code === "auth/wrong-password" ||
          code === "auth/invalid-credential"
        ) {
          setError("Invalid email or password. Please try again.");
          setIsLoading(false);
          return;
        }
        throw authError;
      }

      const requestedPath = new URLSearchParams(window.location.search).get("next") || "/portal";
      router.push(requestedPath.startsWith("/portal") ? requestedPath : "/portal");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f7f1] p-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-3">
            <div className="bg-[#071628] rounded-xl px-6 py-4">
              <Image
                src="/images/efvs-logo-transparent.png"
                alt="Eagle Flight Vertical Solutions"
                width={200}
                height={60}
                className="h-14 w-auto"
                priority
              />
            </div>
            <div className="text-center mt-2">
              <p className="text-sm font-semibold tracking-[0.2em] text-[#1478ac] font-display">
                UAS TRAINING ACADEMY
              </p>
            </div>
          </Link>
        </div>

        {/* Sign In Card */}
        <Card className="shadow-xl border-[#d9d8ce]">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center font-display">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your EFVS Academy account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#1478ac] hover:bg-[#318dc1] text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-0">
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                onClick={(event) => {
                  const next = new URLSearchParams(window.location.search).get("next");
                  if (next?.startsWith("/portal")) {
                    event.preventDefault();
                    router.push(`/sign-up?next=${encodeURIComponent(next)}`);
                  }
                }}
                className="text-primary hover:underline font-medium"
              >
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
