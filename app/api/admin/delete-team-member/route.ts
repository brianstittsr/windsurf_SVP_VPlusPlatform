import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";

/**
 * DELETE /api/admin/delete-team-member
 * Deletes a team member from Firestore and their associated Firebase Auth account
 */
export async function DELETE(request: NextRequest) {
  try {
    const { teamMemberId } = await request.json();

    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Team member ID is required" },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Get the team member document to find the Firebase UID
    const teamMemberRef = adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(teamMemberId);
    const teamMemberDoc = await teamMemberRef.get();

    if (!teamMemberDoc.exists) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const teamMemberData = teamMemberDoc.data();
    const firebaseUid = teamMemberData?.firebaseUid;
    const memberName = `${teamMemberData?.firstName || ""} ${teamMemberData?.lastName || ""}`.trim();

    // Delete Firebase Auth account if it exists
    let authDeleted = false;
    if (firebaseUid && adminAuth) {
      try {
        await adminAuth.deleteUser(firebaseUid);
        authDeleted = true;
        console.log(`Deleted Firebase Auth account for UID: ${firebaseUid}`);
      } catch (authError: any) {
        // If user not found in Auth, that's okay - continue with Firestore deletion
        if (authError.code === "auth/user-not-found") {
          console.log(`No Firebase Auth account found for UID: ${firebaseUid}`);
        } else {
          console.error("Error deleting Firebase Auth account:", authError);
          // Don't fail the whole operation - still delete the Firestore record
        }
      }
    }

    // Delete the team member document from Firestore
    await teamMemberRef.delete();
    console.log(`Deleted team member document: ${teamMemberId}`);

    // Also delete any associated networking profile
    try {
      const networkingProfileRef = adminDb.collection("networkingProfiles").doc(teamMemberId);
      const networkingProfileDoc = await networkingProfileRef.get();
      if (networkingProfileDoc.exists) {
        await networkingProfileRef.delete();
        console.log(`Deleted networking profile for: ${teamMemberId}`);
      }
    } catch (npError) {
      console.error("Error deleting networking profile:", npError);
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      message: `Team member ${memberName} deleted successfully`,
      authDeleted,
      teamMemberId,
    });
  } catch (error: any) {
    console.error("Error deleting team member:", error);
    return NextResponse.json(
      {
        error: "Failed to delete team member",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
