import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { collection, getDocs, query, where, updateDoc, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "email and role are required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Find the team member by email
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.TEAM_MEMBERS), where("email", "==", email))
    );

    if (snapshot.empty) {
      return NextResponse.json({ error: `No team member found with email: ${email}` }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    
    // Update the role
    await updateDoc(doc.ref, {
      role: role,
      isAffiliate: role === "affiliate",
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${email} to role: ${role}`,
      teamMemberId: doc.id,
    });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
