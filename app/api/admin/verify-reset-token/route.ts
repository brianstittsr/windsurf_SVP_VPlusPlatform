import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "No token provided" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ valid: false, error: "Database not initialized" }, { status: 500 });
    }

    // Find the reset token
    const tokensRef = collection(db, "passwordResetTokens");
    const q = query(tokensRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ valid: false, error: "Invalid reset token" });
    }

    const tokenDoc = snapshot.docs[0];
    const tokenData = tokenDoc.data();

    // Check if token has been used
    if (tokenData.used) {
      return NextResponse.json({ valid: false, error: "This reset link has already been used" });
    }

    // Check if token has expired
    const expiresAt = tokenData.expiresAt?.toDate?.() || new Date(tokenData.expiresAt);
    if (new Date() > expiresAt) {
      return NextResponse.json({ valid: false, error: "This reset link has expired" });
    }

    return NextResponse.json({
      valid: true,
      email: tokenData.email,
      tokenId: tokenDoc.id,
    });

  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ valid: false, error: "Failed to verify token" }, { status: 500 });
  }
}
