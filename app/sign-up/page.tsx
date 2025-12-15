"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Eye, EyeOff, AlertCircle, Users, Building2, CheckCircle, Factory } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<"affiliate" | "strategic_partner" | "client" | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateStep1 = () => {
    if (!accountType) {
      setError("Please select an account type");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return false;
    }
    setError("");
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setIsLoading(true);

    try {
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem("svp_remembered_email", email);
        localStorage.setItem("svp_remember_me", "true");
      }

      // Simulate registration delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store session info
      sessionStorage.setItem("svp_authenticated", "true");
      sessionStorage.setItem("svp_user_email", email);
      sessionStorage.setItem("svp_user_type", accountType);
      sessionStorage.setItem("svp_user_name", `${firstName} ${lastName}`);
      sessionStorage.setItem("svp_user_company", company);
      sessionStorage.setItem("svp_user_phone", phone);

      // Redirect based on account type
      if (accountType === "client") {
        router.push("/onboarding/client");
      } else if (accountType === "affiliate") {
        router.push("/portal");
      } else {
        router.push("/portal");
      }
    } catch (err) {
      setError("An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="relative z-10 w-full max-w-lg">
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

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-[#C8A951] text-white" : "bg-muted text-muted-foreground"}`}>
              {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
            </div>
            <div className={`w-16 h-1 ${step > 1 ? "bg-[#C8A951]" : "bg-muted"}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-[#C8A951] text-white" : "bg-muted text-muted-foreground"}`}>
              2
            </div>
          </div>
        </div>

        {/* Sign Up Card */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">
              {step === 1 ? "Choose Account Type" : "Create Your Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 
                ? "Select how you'd like to join Strategic Value+" 
                : "Fill in your details to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="py-2 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 ? (
              <div className="space-y-4">
                <RadioGroup
                  value={accountType}
                  onValueChange={(value) => setAccountType(value as "affiliate" | "strategic_partner" | "client")}
                  className="space-y-4"
                >
                  <div 
                    className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      accountType === "affiliate" 
                        ? "border-[#C8A951] bg-[#C8A951]/5" 
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                    onClick={() => setAccountType("affiliate")}
                  >
                    <RadioGroupItem value="affiliate" id="affiliate" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#C8A951]" />
                        <Label htmlFor="affiliate" className="text-lg font-semibold cursor-pointer">
                          Affiliate Partner
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Join our referral network and earn commissions by connecting manufacturers with V+ services. 
                        Perfect for consultants, industry experts, and business development professionals.
                      </p>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                        <li>• Earn referral commissions</li>
                        <li>• Access networking tools</li>
                        <li>• One-to-One meeting scheduling</li>
                        <li>• Training and resources</li>
                      </ul>
                    </div>
                  </div>

                  <div 
                    className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      accountType === "strategic_partner" 
                        ? "border-[#C8A951] bg-[#C8A951]/5" 
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                    onClick={() => setAccountType("strategic_partner")}
                  >
                    <RadioGroupItem value="strategic_partner" id="strategic_partner" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#C8A951]" />
                        <Label htmlFor="strategic_partner" className="text-lg font-semibold cursor-pointer">
                          Strategic Partner
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Partner with Strategic Value+ to deliver comprehensive manufacturing solutions. 
                        Ideal for service providers, technology vendors, and industry organizations.
                      </p>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                        <li>• Co-branded solutions</li>
                        <li>• Joint go-to-market opportunities</li>
                        <li>• Access to manufacturer network</li>
                        <li>• Priority deal flow</li>
                      </ul>
                    </div>
                  </div>

                  <div 
                    className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      accountType === "client" 
                        ? "border-[#C8A951] bg-[#C8A951]/5" 
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                    onClick={() => setAccountType("client")}
                  >
                    <RadioGroupItem value="client" id="client" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Factory className="h-5 w-5 text-[#C8A951]" />
                        <Label htmlFor="client" className="text-lg font-semibold cursor-pointer">
                          Client (Customer/Supplier)
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Register as a manufacturing customer or supplier to access V+ services and 
                        connect with our network of consultants and partners.
                      </p>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                        <li>• Access to V+ consulting services</li>
                        <li>• Supplier qualification programs</li>
                        <li>• Manufacturing assessments</li>
                        <li>• Industry 4.0 transformation support</li>
                      </ul>
                    </div>
                  </div>
                </RadioGroup>

                <Button 
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-11 bg-gradient-to-r from-[#C8A951] to-[#a08840] hover:from-[#b89841] hover:to-[#907830] text-white font-semibold"
                >
                  Continue
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name (Optional)</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your Company LLC"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min. 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                      Remember me on this device
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-11"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-11 bg-gradient-to-r from-[#C8A951] to-[#a08840] hover:from-[#b89841] hover:to-[#907830] text-white font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-0">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
