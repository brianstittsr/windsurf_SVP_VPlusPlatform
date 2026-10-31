"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  ArrowRight,
  CheckCircle,
  Linkedin,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const services = [
  "Supplier Readiness & OEM Qualification",
  "ISO/QMS Certification",
  "Lean Manufacturing",
  "Digital Transformation",
  "Reshoring Advisory",
  "Workforce Development",
  "Other",
];

const companySizes = [
  "1-25 employees",
  "25-100 employees",
  "100-250 employees",
  "250-500 employees",
  "500+ employees",
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookCallOpen, setBookCallOpen] = useState(false);
  const [isBookingCall, setIsBookingCall] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    companySize: "",
    industry: "",
    serviceInterest: "",
    message: "",
    newsletterOptIn: false,
    website: "",
  });
  const [bookCallForm, setBookCallForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "assessment",
          firstName: assessmentForm.firstName,
          lastName: assessmentForm.lastName,
          email: assessmentForm.email,
          phone: assessmentForm.phone || undefined,
          company: assessmentForm.company || undefined,
          jobTitle: assessmentForm.jobTitle || undefined,
          companySize: assessmentForm.companySize || undefined,
          industry: assessmentForm.industry || undefined,
          serviceInterest: assessmentForm.serviceInterest || undefined,
          message: assessmentForm.message || undefined,
          newsletterOptIn: assessmentForm.newsletterOptIn,
          website: assessmentForm.website,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Submission failed");
      }
      toast.success("Thank you for your inquiry!", {
        description: "We'll get back to you within 24 hours.",
      });
      setAssessmentForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        companySize: "",
        industry: "",
        serviceInterest: "",
        message: "",
        newsletterOptIn: false,
        website: "",
      });
    } catch (error) {
      console.error("Error submitting assessment request:", error);
      toast.error("Failed to submit request", {
        description: error instanceof Error ? error.message : "Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookCall = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsBookingCall(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "book-call",
          source: "contact-page",
          firstName: bookCallForm.firstName,
          lastName: bookCallForm.lastName,
          email: bookCallForm.email,
          phone: bookCallForm.phone || undefined,
          company: bookCallForm.company || undefined,
          jobTitle: bookCallForm.jobTitle || undefined,
          preferredDate: bookCallForm.preferredDate || undefined,
          preferredTime: bookCallForm.preferredTime || undefined,
          message: bookCallForm.message || undefined,
          website: bookCallForm.website,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Submission failed");
      }

      toast.success("Call request submitted!", {
        description: "We'll contact you shortly to schedule your call.",
      });

      setBookCallForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        preferredDate: "",
        preferredTime: "",
        message: "",
        website: "",
      });
      setBookCallOpen(false);
    } catch (error) {
      console.error("Error submitting book call request:", error);
      toast.error("Failed to submit request", {
        description: error instanceof Error ? error.message : "Please try again or contact us directly.",
      });
    } finally {
      setIsBookingCall(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-black text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary">
              Get in Touch
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Let&apos;s Start Your{" "}
              <span className="text-primary">Transformation</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Ready to become an OEM-qualified supplier? Schedule a free assessment 
              or reach out to discuss how we can help your manufacturing business grow.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Request a Free Assessment</CardTitle>
                  <CardDescription>
                    Fill out the form below and one of our experts will contact you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot — hidden from humans, bots fill it */}
                    <input
                      type="text"
                      name="website"
                      value={assessmentForm.website}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, website: e.target.value })}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="hidden"
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          required
                          placeholder="John"
                          value={assessmentForm.firstName}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          required
                          placeholder="Smith"
                          value={assessmentForm.lastName}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="john@company.com"
                          value={assessmentForm.email}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={assessmentForm.phone}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          required
                          placeholder="Your Company Inc."
                          value={assessmentForm.company}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, company: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                          id="title"
                          placeholder="VP Operations"
                          value={assessmentForm.jobTitle}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, jobTitle: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="size">Company Size *</Label>
                        <Select
                          required
                          value={assessmentForm.companySize}
                          onValueChange={(v) => setAssessmentForm({ ...assessmentForm, companySize: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            {companySizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          placeholder="e.g., Automotive, Aerospace"
                          value={assessmentForm.industry}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, industry: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service">Service of Interest *</Label>
                      <Select
                        required
                        value={assessmentForm.serviceInterest}
                        onValueChange={(v) => setAssessmentForm({ ...assessmentForm, serviceInterest: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Tell us about your goals</Label>
                      <Textarea
                        id="message"
                        placeholder="What challenges are you facing? What outcomes are you hoping to achieve?"
                        rows={4}
                        value={assessmentForm.message}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, message: e.target.value })}
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="newsletter"
                        checked={assessmentForm.newsletterOptIn}
                        onCheckedChange={(checked) =>
                          setAssessmentForm({ ...assessmentForm, newsletterOptIn: checked === true })
                        }
                      />
                      <Label htmlFor="newsletter" className="text-sm font-normal">
                        Subscribe to our newsletter for manufacturing insights and industry updates
                      </Label>
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          Request Free Assessment
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <Link
                        href="mailto:info@strategicvalueplus.com"
                        className="text-muted-foreground hover:text-primary"
                      >
                        info@strategicvalueplus.com
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <Link
                        href="tel:+1-555-123-4567"
                        className="text-muted-foreground hover:text-primary"
                      >
                        (555) 123-4567
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">United States</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-muted-foreground">Mon-Fri: 8am - 6pm EST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Call */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Schedule a Call
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Prefer to talk directly? Book a 30-minute discovery call with one of our experts.
                  </p>
                  <Dialog open={bookCallOpen} onOpenChange={setBookCallOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        Book a Call
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Book a Discovery Call</DialogTitle>
                        <DialogDescription>
                          Fill out the form below and we&apos;ll reach out to schedule a 30-minute call.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBookCall} className="space-y-4 mt-4">
                        {/* Honeypot — hidden from humans, bots fill it */}
                        <input
                          type="text"
                          name="website"
                          value={bookCallForm.website}
                          onChange={(e) => setBookCallForm({ ...bookCallForm, website: e.target.value })}
                          tabIndex={-1}
                          autoComplete="off"
                          aria-hidden="true"
                          className="hidden"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="book-firstName">First Name *</Label>
                            <Input
                              id="book-firstName"
                              required
                              value={bookCallForm.firstName}
                              onChange={(e) => setBookCallForm({ ...bookCallForm, firstName: e.target.value })}
                              placeholder="John"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="book-lastName">Last Name *</Label>
                            <Input
                              id="book-lastName"
                              required
                              value={bookCallForm.lastName}
                              onChange={(e) => setBookCallForm({ ...bookCallForm, lastName: e.target.value })}
                              placeholder="Smith"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="book-email">Email *</Label>
                          <Input
                            id="book-email"
                            type="email"
                            required
                            value={bookCallForm.email}
                            onChange={(e) => setBookCallForm({ ...bookCallForm, email: e.target.value })}
                            placeholder="john@company.com"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="book-phone">Phone</Label>
                            <Input
                              id="book-phone"
                              type="tel"
                              value={bookCallForm.phone}
                              onChange={(e) => setBookCallForm({ ...bookCallForm, phone: e.target.value })}
                              placeholder="(555) 123-4567"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="book-company">Company</Label>
                            <Input
                              id="book-company"
                              value={bookCallForm.company}
                              onChange={(e) => setBookCallForm({ ...bookCallForm, company: e.target.value })}
                              placeholder="Your Company"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="book-date">Preferred Date</Label>
                            <Input
                              id="book-date"
                              type="date"
                              value={bookCallForm.preferredDate}
                              onChange={(e) => setBookCallForm({ ...bookCallForm, preferredDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="book-time">Preferred Time</Label>
                            <Select
                              value={bookCallForm.preferredTime}
                              onValueChange={(value) => setBookCallForm({ ...bookCallForm, preferredTime: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">Morning (9am-12pm)</SelectItem>
                                <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                                <SelectItem value="evening">Evening (5pm-7pm)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="book-message">What would you like to discuss?</Label>
                          <Textarea
                            id="book-message"
                            value={bookCallForm.message}
                            onChange={(e) => setBookCallForm({ ...bookCallForm, message: e.target.value })}
                            placeholder="Tell us about your goals..."
                            rows={3}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isBookingCall}>
                          {isBookingCall ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Request Call
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Connect */}
              <Card>
                <CardHeader>
                  <CardTitle>Connect With Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button variant="outline" size="icon" asChild>
                      <Link href="https://linkedin.com">
                        <Linkedin className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* What to Expect */}
              <Card>
                <CardHeader>
                  <CardTitle>What to Expect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">Response within 24 hours</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">Free initial assessment</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">Customized recommendations</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">No obligation to proceed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
