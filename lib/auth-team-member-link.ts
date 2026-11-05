/**
 * Auth-Team Member Linking Utilities
 * 
 * This module provides functions to link Firebase Auth accounts with Team Member records.
 * - findTeamMemberByEmail: Finds a Team Member by email (checks both primary and secondary)
 * - linkAuthToTeamMember: Links a Firebase Auth UID to a Team Member record
 * - getTeamMemberByAuthUid: Gets Team Member data by Firebase Auth UID
 */

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  setDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { COLLECTIONS, type LmsRole, type TeamMemberDoc } from "./schema";

/**
 * Sync the roles/{uid} lookup document used by Firestore security rules.
 * Role elevation must happen through an admin; non-admin updates are
 * denied by security rules and failures are ignored here.
 * @param uid - Firebase Auth UID
 * @param role - Effective LMS role
 */
export async function syncRoleDoc(uid: string, role: LmsRole): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, "roles", uid), {
      role,
      firebaseUid: uid,
      updatedAt: Timestamp.now(),
    });
  } catch {
    // Non-admins cannot update their role doc — expected on sign-in.
  }
}

/**
 * Find a Team Member by email address
 * Checks both emailPrimary and emailSecondary fields
 * @param email - Email address to search for
 * @returns TeamMemberDoc if found, null otherwise
 */
export async function findTeamMemberByEmail(email: string): Promise<TeamMemberDoc | null> {
  if (!db) {
    console.error("Firebase not initialized");
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const teamMembersRef = collection(db, COLLECTIONS.TEAM_MEMBERS);

  // Check primary email
  const primaryQuery = query(
    teamMembersRef,
    where("emailPrimary", "==", normalizedEmail)
  );
  const primarySnapshot = await getDocs(primaryQuery);
  
  if (!primarySnapshot.empty) {
    const docData = primarySnapshot.docs[0];
    return { id: docData.id, ...docData.data() } as TeamMemberDoc;
  }

  // Check secondary email
  const secondaryQuery = query(
    teamMembersRef,
    where("emailSecondary", "==", normalizedEmail)
  );
  const secondarySnapshot = await getDocs(secondaryQuery);
  
  if (!secondarySnapshot.empty) {
    const docData = secondarySnapshot.docs[0];
    return { id: docData.id, ...docData.data() } as TeamMemberDoc;
  }

  // Also check case-insensitive by fetching all and comparing
  // This handles cases where emails were stored with different casing
  const allMembersSnapshot = await getDocs(teamMembersRef);
  for (const docSnap of allMembersSnapshot.docs) {
    const data = docSnap.data();
    const primaryEmail = (data.emailPrimary || "").toLowerCase().trim();
    const secondaryEmail = (data.emailSecondary || "").toLowerCase().trim();
    
    if (primaryEmail === normalizedEmail || secondaryEmail === normalizedEmail) {
      return { id: docSnap.id, ...data } as TeamMemberDoc;
    }
  }

  return null;
}

/**
 * Link a Firebase Auth UID to a Team Member record
 * @param teamMemberId - The Firestore document ID of the Team Member
 * @param firebaseUid - The Firebase Auth UID to link
 * @returns true if successful, false otherwise
 */
export async function linkAuthToTeamMember(
  teamMemberId: string, 
  firebaseUid: string
): Promise<boolean> {
  if (!db) {
    console.error("Firebase not initialized");
    return false;
  }

  try {
    const teamMemberRef = doc(db, COLLECTIONS.TEAM_MEMBERS, teamMemberId);
    await updateDoc(teamMemberRef, {
      firebaseUid: firebaseUid,
      updatedAt: Timestamp.now(),
    });
    console.log(`Linked Firebase Auth UID ${firebaseUid} to Team Member ${teamMemberId}`);
    return true;
  } catch (error) {
    console.error("Error linking auth to team member:", error);
    return false;
  }
}

/**
 * Get Team Member data by Firebase Auth UID
 * @param firebaseUid - The Firebase Auth UID
 * @returns TeamMemberDoc if found, null otherwise
 */
export async function getTeamMemberByAuthUid(firebaseUid: string): Promise<TeamMemberDoc | null> {
  if (!db) {
    console.error("Firebase not initialized");
    return null;
  }

  const teamMembersRef = collection(db, COLLECTIONS.TEAM_MEMBERS);
  const uidQuery = query(
    teamMembersRef,
    where("firebaseUid", "==", firebaseUid)
  );
  const snapshot = await getDocs(uidQuery);
  
  if (!snapshot.empty) {
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as TeamMemberDoc;
  }

  return null;
}

/**
 * Find and link a Team Member by email during sign-up/sign-in
 * This is the main function to call when a user authenticates
 * @param email - User's email address
 * @param firebaseUid - User's Firebase Auth UID
 * @returns TeamMemberDoc if found and linked, null if no matching Team Member
 */
export async function findAndLinkTeamMember(
  email: string, 
  firebaseUid: string
): Promise<TeamMemberDoc | null> {
  // First check if already linked by UID
  const existingByUid = await getTeamMemberByAuthUid(firebaseUid);
  if (existingByUid) {
    console.log(`User ${firebaseUid} already linked to Team Member ${existingByUid.id}`);
    return existingByUid;
  }

  // Find Team Member by email
  const teamMember = await findTeamMemberByEmail(email);
  if (!teamMember) {
    console.log(`No Team Member found for email: ${email}`);
    return null;
  }

  // Check if this Team Member is already linked to a different auth account
  if (teamMember.firebaseUid && teamMember.firebaseUid !== firebaseUid) {
    console.warn(`Team Member ${teamMember.id} is already linked to a different auth account`);
    return null;
  }

  // Link the auth account to the Team Member
  const linked = await linkAuthToTeamMember(teamMember.id, firebaseUid);
  if (linked) {
    return { ...teamMember, firebaseUid };
  }

  return null;
}

/**
 * Ensure a user record exists for an authenticated user.
 * Links an existing record if found; otherwise creates a new student record.
 * @param email - User's email address
 * @param firebaseUid - User's Firebase Auth UID
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns TeamMemberDoc for the user, or null on failure
 */
export async function ensureUserRecord(
  email: string,
  firebaseUid: string,
  firstName: string,
  lastName: string,
  extras?: { phone?: string; company?: string; isVeteran?: boolean }
): Promise<TeamMemberDoc | null> {
  const existing = await findAndLinkTeamMember(email, firebaseUid);
  if (existing) {
    const role =
      existing.role === "admin"
        ? "admin"
        : existing.role === "instructor"
          ? "instructor"
          : "student";
    await syncRoleDoc(firebaseUid, role);
    return existing;
  }
  if (!db) {
    console.error("Firebase not initialized");
    return null;
  }

  try {
    const newRecord = {
      firebaseUid,
      firstName,
      lastName,
      expertise: "",
      emailPrimary: email.toLowerCase().trim(),
      mobile: extras?.phone || "",
      company: extras?.company || "",
      isVeteran: extras?.isVeteran === true,
      role: "student" as const,
      status: "active" as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(
      collection(db, COLLECTIONS.TEAM_MEMBERS),
      newRecord
    );
    await syncRoleDoc(firebaseUid, "student");
    return { id: docRef.id, ...newRecord } as TeamMemberDoc;
  } catch (error) {
    console.error("Error creating user record:", error);
    return null;
  }
}
