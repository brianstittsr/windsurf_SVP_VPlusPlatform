import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 500 });
    }

    // Find the reset token
    const tokensRef = collection(db, "passwordResetTokens");
    const q = query(tokensRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ success: false, error: "Invalid reset token" });
    }

    const tokenDoc = snapshot.docs[0];
    const tokenData = tokenDoc.data();

    // Check if token has been used
    if (tokenData.used) {
      return NextResponse.json({ success: false, error: "This reset link has already been used" });
    }

    // Check if token has expired
    const expiresAt = tokenData.expiresAt?.toDate?.() || new Date(tokenData.expiresAt);
    if (new Date() > expiresAt) {
      return NextResponse.json({ success: false, error: "This reset link has expired" });
    }

    // Mark token as used
    await updateDoc(doc(db, "passwordResetTokens", tokenDoc.id), {
      used: true,
      usedAt: Timestamp.now(),
    });

    // Note: In a production environment, you would use Firebase Admin SDK
    // to update the user's password. Since we're using client SDK, 
    // the actual password update should be done client-side with Firebase Auth
    // or through a secure server-side implementation with Admin SDK.

    return NextResponse.json({
      success: true,
      message: "Password reset token validated. Please complete the password update.",
      email: tokenData.email,
    });

  } catch (error) {
    console.error("Password reset completion error:", error);
    return NextResponse.json({ success: false, error: "Failed to complete password reset" }, { status: 500 });
  }
}
