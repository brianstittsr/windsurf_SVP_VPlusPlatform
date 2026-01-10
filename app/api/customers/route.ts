import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
  where,
} from "firebase/firestore";
import { COLLECTIONS, type CustomerDoc } from "@/lib/schema";

// GET - Fetch all customers or filter by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const customersRef = collection(db, COLLECTIONS.CUSTOMERS);
    let q = query(customersRef, orderBy("createdAt", "desc"));

    if (status && status !== "all") {
      q = query(customersRef, where("status", "==", status), orderBy("createdAt", "desc"));
    }

    const snapshot = await getDocs(q);
    let customers: CustomerDoc[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CustomerDoc[];

    // Client-side search filtering (Firestore doesn't support full-text search)
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.industry.toLowerCase().includes(searchLower) ||
          c.city.toLowerCase().includes(searchLower) ||
          c.state.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      industry,
      size,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      phone,
      email,
      contacts,
      status,
      notes,
      tags,
      source,
      referredById,
    } = body;

    if (!name || !industry || !city || !state) {
      return NextResponse.json(
        { error: "Name, industry, city, and state are required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const customerData = {
      name,
      industry,
      size: size || "25-100",
      address: address || null,
      city,
      state,
      zipCode: zipCode || null,
      country: country || "USA",
      website: website || null,
      phone: phone || null,
      email: email || null,
      contacts: contacts || [],
      status: status || "prospect",
      projectCount: 0,
      totalRevenue: 0,
      notes: notes || null,
      tags: tags || [],
      source: source || null,
      referredById: referredById || null,
      lastActivityDate: Timestamp.now(),
      lastActivityType: "created",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const customersRef = collection(db, COLLECTIONS.CUSTOMERS);
    const docRef = await addDoc(customersRef, customerData);

    return NextResponse.json({
      success: true,
      customer: { id: docRef.id, ...customerData },
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
