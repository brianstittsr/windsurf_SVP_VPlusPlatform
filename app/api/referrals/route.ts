import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, Timestamp, orderBy } from "firebase/firestore";

// GET - Fetch referrals for an affiliate
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get("affiliateId");
    const type = searchParams.get("type"); // "given" or "received"

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    let referralsQuery;
    if (type === "given") {
      referralsQuery = query(
        collection(db, COLLECTIONS.REFERRALS),
        where("referrerId", "==", affiliateId),
        orderBy("createdAt", "desc")
      );
    } else if (type === "received") {
      referralsQuery = query(
        collection(db, COLLECTIONS.REFERRALS),
        where("recipientId", "==", affiliateId),
        orderBy("createdAt", "desc")
      );
    } else {
      // Get both given and received
      const givenQuery = query(
        collection(db, COLLECTIONS.REFERRALS),
        where("referrerId", "==", affiliateId)
      );
      const receivedQuery = query(
        collection(db, COLLECTIONS.REFERRALS),
        where("recipientId", "==", affiliateId)
      );

      const [givenSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(givenQuery),
        getDocs(receivedQuery),
      ]);

      const given = givenSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        direction: "given",
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
        dealClosedDate: doc.data().dealClosedDate?.toDate?.()?.toISOString(),
      }));

      const received = receivedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        direction: "received",
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
        dealClosedDate: doc.data().dealClosedDate?.toDate?.()?.toISOString(),
      }));

      // Combine and sort by date
      const allReferrals = [...given, ...received].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      return NextResponse.json({ success: true, referrals: allReferrals });
    }

    const snapshot = await getDocs(referralsQuery);
    const referrals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      direction: type,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      dealClosedDate: doc.data().dealClosedDate?.toDate?.()?.toISOString(),
    }));

    return NextResponse.json({ success: true, referrals });
  } catch (error) {
    console.error("Get referrals error:", error);
    return NextResponse.json({ error: "Failed to get referrals" }, { status: 500 });
  }
}

// POST - Create a new referral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referrerId,
      recipientId,
      oneToOneMeetingId,
      referralType,
      prospectName,
      prospectCompany,
      prospectEmail,
      prospectPhone,
      prospectTitle,
      description,
      whyGoodFit,
      isSvpReferral,
      svpServiceInterest,
      commissionTier,
      dealValue,
    } = body;

    if (!referrerId || !recipientId || !prospectName || !description) {
      return NextResponse.json(
        { error: "referrerId, recipientId, prospectName, and description are required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const referralData = {
      referrerId,
      recipientId,
      oneToOneMeetingId: oneToOneMeetingId || null,
      referralType: referralType || "short-term",
      prospectName,
      prospectCompany: prospectCompany || null,
      prospectEmail: prospectEmail || null,
      prospectPhone: prospectPhone || null,
      prospectTitle: prospectTitle || null,
      description,
      whyGoodFit: whyGoodFit || null,
      isSvpReferral: isSvpReferral || false,
      svpServiceInterest: svpServiceInterest || null,
      commissionTier: commissionTier || null,
      dealValue: dealValue || null,
      status: "submitted",
      contactAttempts: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.REFERRALS), referralData);

    return NextResponse.json({
      success: true,
      referralId: docRef.id,
      message: "Referral created successfully",
    });
  } catch (error) {
    console.error("Create referral error:", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}

// PATCH - Update referral status or report deal
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralId, status, dealValue, dealClosedDate, lostReason, notes } = body;

    if (!referralId) {
      return NextResponse.json({ error: "referralId is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (status) {
      updateData.status = status;
    }

    if (dealValue !== undefined) {
      updateData.dealValue = dealValue;
    }

    if (dealClosedDate) {
      updateData.dealClosedDate = Timestamp.fromDate(new Date(dealClosedDate));
    }

    if (lostReason) {
      updateData.lostReason = lostReason;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const referralRef = doc(db, COLLECTIONS.REFERRALS, referralId);
    await updateDoc(referralRef, updateData);

    return NextResponse.json({
      success: true,
      message: "Referral updated successfully",
    });
  } catch (error) {
    console.error("Update referral error:", error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}
