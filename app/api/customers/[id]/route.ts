import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, type CustomerDoc } from "@/lib/schema";

// GET - Fetch a single customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const customerRef = doc(db, COLLECTIONS.CUSTOMERS, id);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const customer = {
      id: customerDoc.id,
      ...customerDoc.data(),
    } as CustomerDoc;

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PATCH - Update a customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const customerRef = doc(db, COLLECTIONS.CUSTOMERS, id);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
      lastActivityDate: Timestamp.now(),
      lastActivityType: "updated",
    };

    const allowedFields = [
      "name",
      "industry",
      "size",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
      "website",
      "phone",
      "email",
      "contacts",
      "status",
      "projectCount",
      "totalRevenue",
      "notes",
      "tags",
      "source",
      "referredById",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await updateDoc(customerRef, updateData);

    // Fetch updated document
    const updatedDoc = await getDoc(customerRef);
    const customer = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as CustomerDoc;

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const customerRef = doc(db, COLLECTIONS.CUSTOMERS, id);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    await deleteDoc(customerRef);

    return NextResponse.json({ success: true, message: "Customer deleted" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
