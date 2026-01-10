"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Building,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  FolderKanban,
  Mail,
  Trash2,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { CustomerDoc, CustomerContact } from "@/lib/schema";

interface Customer extends Omit<CustomerDoc, "createdAt" | "updatedAt" | "lastActivityDate"> {
  createdAt: string;
  updatedAt: string;
  lastActivityDate?: string;
}

const industries = [
  "Aerospace",
  "Automotive",
  "Construction",
  "Consumer Goods",
  "Defense",
  "Electronics",
  "Energy",
  "Food & Beverage",
  "Healthcare",
  "Industrial Equipment",
  "Manufacturing",
  "Medical Devices",
  "Pharmaceuticals",
  "Technology",
  "Transportation",
  "Other",
];

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "10-25", label: "10-25 employees" },
  { value: "25-100", label: "25-100 employees" },
  { value: "100-250", label: "100-250 employees" },
  { value: "250-500", label: "250-500 employees" },
  { value: "500-1000", label: "500-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

const statusOptions = [
  { value: "prospect", label: "Prospect", color: "bg-blue-100 text-blue-800" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-yellow-100 text-yellow-800" },
  { value: "completed", label: "Completed", color: "bg-gray-100 text-gray-800" },
];

function getStatusBadge(status: string) {
  const option = statusOptions.find((o) => o.value === status);
  if (option) {
    return <Badge className={option.color}>{option.label}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    size: "25-100" as CustomerDoc["size"],
    address: "",
    city: "",
    state: "",
    zipCode: "",
    website: "",
    phone: "",
    email: "",
    status: "prospect" as CustomerDoc["status"],
    notes: "",
    contacts: [] as CustomerContact[],
  });

  // New contact form
  const [newContact, setNewContact] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
  });

  // Fetch customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/customers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        toast.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      industry: "",
      size: "25-100",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      website: "",
      phone: "",
      email: "",
      status: "prospect",
      notes: "",
      contacts: [],
    });
    setNewContact({ name: "", role: "", email: "", phone: "" });
  };

  // Add contact to form
  const addContact = () => {
    if (!newContact.name || !newContact.role) {
      toast.error("Contact name and role are required");
      return;
    }
    const contact: CustomerContact = {
      id: crypto.randomUUID(),
      name: newContact.name,
      role: newContact.role,
      email: newContact.email || undefined,
      phone: newContact.phone || undefined,
      isPrimary: formData.contacts.length === 0,
    };
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, contact],
    }));
    setNewContact({ name: "", role: "", email: "", phone: "" });
  };

  // Remove contact from form
  const removeContact = (contactId: string) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== contactId),
    }));
  };

  // Create customer
  const handleCreate = async () => {
    if (!formData.name || !formData.industry || !formData.city || !formData.state) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Customer created successfully");
        setIsCreateOpen(false);
        resetForm();
        fetchCustomers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update customer
  const handleUpdate = async () => {
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Customer updated successfully");
        setIsEditOpen(false);
        setSelectedCustomer(null);
        resetForm();
        fetchCustomers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update customer");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete customer
  const handleDelete = async () => {
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Customer deleted successfully");
        setIsDeleteOpen(false);
        setSelectedCustomer(null);
        fetchCustomers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      industry: customer.industry,
      size: customer.size,
      address: customer.address || "",
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode || "",
      website: customer.website || "",
      phone: customer.phone || "",
      email: customer.email || "",
      status: customer.status,
      notes: customer.notes || "",
      contacts: customer.contacts || [],
    });
    setIsEditOpen(true);
  };

  // Open view dialog
  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewOpen(true);
  };

  // Stats
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const prospects = customers.filter((c) => c.status === "prospect").length;
  const totalProjects = customers.reduce((sum, c) => sum + (c.projectCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer relationships and track engagements
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{prospects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Building className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm">Add your first customer to get started</p>
              <Button className="mt-4" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <button
                            onClick={() => openViewDialog(customer)}
                            className="font-medium hover:underline text-left"
                          >
                            {customer.name}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {customer.size} employees
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.industry}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {customer.city}, {customer.state}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        {customer.projectCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {(customer.contacts || []).slice(0, 3).map((contact, i) => (
                          <Avatar key={contact.id || i} className="h-7 w-7 border-2 border-background">
                            <AvatarFallback className="bg-secondary/20 text-secondary text-xs">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {(customer.contacts || []).length > 3 && (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +{customer.contacts.length - 3}
                          </div>
                        )}
                        {(customer.contacts || []).length === 0 && (
                          <span className="text-xs text-muted-foreground">No contacts</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewDialog(customer)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {customer.email && (
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${customer.email}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Customer Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          setSelectedCustomer(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? "Update customer information" : "Enter the customer details below"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Company Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Company Size</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, size: value as CustomerDoc["size"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as CustomerDoc["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Detroit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="MI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="48201"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="info@example.com"
                />
              </div>
            </div>

            {/* Contacts */}
            <div className="space-y-2">
              <Label>Contacts</Label>
              <div className="border rounded-lg p-4 space-y-4">
                {formData.contacts.length > 0 && (
                  <div className="space-y-2">
                    {formData.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.role}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContact(contact.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Contact name"
                    value={newContact.name}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Role/Title"
                    value={newContact.role}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, role: e.target.value }))}
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={newContact.email}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Phone (optional)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this customer..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setSelectedCustomer(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditOpen ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditOpen ? "Update Customer" : "Create Customer"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
            <DialogDescription>Customer details and information</DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{selectedCustomer.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company Size</p>
                  <p className="font-medium">{selectedCustomer.size} employees</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedCustomer.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="font-medium">{selectedCustomer.projectCount || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="font-medium">
                  {selectedCustomer.address && `${selectedCustomer.address}, `}
                  {selectedCustomer.city}, {selectedCustomer.state}
                  {selectedCustomer.zipCode && ` ${selectedCustomer.zipCode}`}
                </p>
              </div>

              {(selectedCustomer.website || selectedCustomer.phone || selectedCustomer.email) && (
                <div className="grid grid-cols-3 gap-4">
                  {selectedCustomer.website && (
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={selectedCustomer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {selectedCustomer.website}
                      </a>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${selectedCustomer.email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {selectedCustomer.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedCustomer.contacts && selectedCustomer.contacts.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Contacts</p>
                  <div className="space-y-2">
                    {selectedCustomer.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 p-2 bg-muted rounded-md"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.role}</p>
                        </div>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-primary">
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCustomer.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewOpen(false);
                if (selectedCustomer) openEditDialog(selectedCustomer);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCustomer?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
