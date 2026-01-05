import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";

interface AffiliateMetrics {
  affiliateId: string;
  affiliateName: string;
  company: string;
  
  // One-to-one metrics
  totalOneToOnes: number;
  oneToOnesThisMonth: number;
  oneToOnesThisQuarter: number;
  
  // Referral metrics
  referralsGiven: number;
  referralsReceived: number;
  referralsGivenThisMonth: number;
  referralsReceivedThisMonth: number;
  
  // Deal metrics
  dealsClosedFromGiven: number;
  dealsClosedFromReceived: number;
  totalRevenueGenerated: number;
  totalRevenueReceived: number;
  
  // SVP specific
  svpReferralsGiven: number;
  svpReferralsClosed: number;
  svpRevenueGenerated: number;
  
  // Conversion rates
  givenConversionRate: number;
  receivedConversionRate: number;
  
  // Engagement score
  engagementScore: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get("affiliateId");
    const leaderboard = searchParams.get("leaderboard") === "true";

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    if (leaderboard) {
      // Get metrics for all affiliates for leaderboard
      const affiliatesSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.TEAM_MEMBERS), where("role", "==", "affiliate"))
      );

      const metricsPromises = affiliatesSnapshot.docs.map(async (affiliateDoc) => {
        const affiliate = { id: affiliateDoc.id, ...affiliateDoc.data() };
        return calculateAffiliateMetrics(affiliate, startOfMonth, startOfQuarter);
      });

      const allMetrics = await Promise.all(metricsPromises);
      
      // Sort by engagement score
      allMetrics.sort((a, b) => b.engagementScore - a.engagementScore);

      return NextResponse.json({
        success: true,
        leaderboard: allMetrics,
        generatedAt: new Date().toISOString(),
      });
    }

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
    }

    // Get single affiliate metrics - try by document ID first
    const { doc, getDoc } = await import("firebase/firestore");
    const affiliateDocRef = doc(db, COLLECTIONS.TEAM_MEMBERS, affiliateId);
    const affiliateDocSnap = await getDoc(affiliateDocRef);
    
    let affiliate: { id: string; firstName?: string; lastName?: string; company?: string };
    if (affiliateDocSnap.exists()) {
      affiliate = { id: affiliateDocSnap.id, ...affiliateDocSnap.data() } as typeof affiliate;
    } else {
      // Fallback to query by authUid
      const affiliateSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.TEAM_MEMBERS), where("authUid", "==", affiliateId))
      );
      if (affiliateSnapshot.empty) {
        return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
      }
      affiliate = { id: affiliateSnapshot.docs[0].id, ...affiliateSnapshot.docs[0].data() } as typeof affiliate;
    }

    const metrics = await calculateAffiliateMetrics(affiliate, startOfMonth, startOfQuarter);

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error("Get affiliate metrics error:", error);
    return NextResponse.json({ error: "Failed to get metrics" }, { status: 500 });
  }
}

async function calculateAffiliateMetrics(
  affiliate: { id: string; firstName?: string; lastName?: string; company?: string },
  startOfMonth: Date,
  startOfQuarter: Date
): Promise<AffiliateMetrics> {
  if (!db) {
    throw new Error("Database not initialized");
  }

  const affiliateId = affiliate.id;

  // Get one-to-one meetings
  const meetingsSnapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.ONE_TO_ONE_MEETINGS),
      where("initiatorId", "==", affiliateId)
    )
  );

  const partnerMeetingsSnapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.ONE_TO_ONE_MEETINGS),
      where("partnerId", "==", affiliateId)
    )
  );

  const allMeetings = [
    ...meetingsSnapshot.docs.map((d) => d.data()),
    ...partnerMeetingsSnapshot.docs.map((d) => d.data()),
  ];

  const completedMeetings = allMeetings.filter((m) => m.status === "completed");
  const meetingsThisMonth = completedMeetings.filter((m) => {
    const date = m.scheduledDate?.toDate?.();
    return date && date >= startOfMonth;
  });
  const meetingsThisQuarter = completedMeetings.filter((m) => {
    const date = m.scheduledDate?.toDate?.();
    return date && date >= startOfQuarter;
  });

  // Get referrals given
  const givenSnapshot = await getDocs(
    query(collection(db, COLLECTIONS.REFERRALS), where("referrerId", "==", affiliateId))
  );
  const referralsGiven = givenSnapshot.docs.map((d) => d.data());

  // Get referrals received
  const receivedSnapshot = await getDocs(
    query(collection(db, COLLECTIONS.REFERRALS), where("recipientId", "==", affiliateId))
  );
  const referralsReceived = receivedSnapshot.docs.map((d) => d.data());

  // Calculate metrics
  const givenThisMonth = referralsGiven.filter((r) => {
    const date = r.createdAt?.toDate?.();
    return date && date >= startOfMonth;
  });

  const receivedThisMonth = referralsReceived.filter((r) => {
    const date = r.createdAt?.toDate?.();
    return date && date >= startOfMonth;
  });

  const dealsClosedFromGiven = referralsGiven.filter((r) => r.status === "won");
  const dealsClosedFromReceived = referralsReceived.filter((r) => r.status === "won");

  const totalRevenueGenerated = dealsClosedFromGiven.reduce(
    (sum, r) => sum + (r.dealValue || 0),
    0
  );
  const totalRevenueReceived = dealsClosedFromReceived.reduce(
    (sum, r) => sum + (r.dealValue || 0),
    0
  );

  const svpReferralsGiven = referralsGiven.filter((r) => r.isSvpReferral);
  const svpReferralsClosed = svpReferralsGiven.filter((r) => r.status === "won");
  const svpRevenueGenerated = svpReferralsClosed.reduce(
    (sum, r) => sum + (r.dealValue || 0),
    0
  );

  // Calculate conversion rates
  const givenConversionRate =
    referralsGiven.length > 0
      ? Math.round((dealsClosedFromGiven.length / referralsGiven.length) * 100)
      : 0;

  const receivedConversionRate =
    referralsReceived.length > 0
      ? Math.round((dealsClosedFromReceived.length / referralsReceived.length) * 100)
      : 0;

  // Calculate engagement score (0-100)
  let engagementScore = 0;
  
  // One-to-ones this quarter (max 30 points)
  engagementScore += Math.min(meetingsThisQuarter.length * 5, 30);
  
  // Referrals given this month (max 25 points)
  engagementScore += Math.min(givenThisMonth.length * 5, 25);
  
  // Referrals received this month (max 15 points)
  engagementScore += Math.min(receivedThisMonth.length * 3, 15);
  
  // Deals closed (max 20 points)
  engagementScore += Math.min((dealsClosedFromGiven.length + dealsClosedFromReceived.length) * 5, 20);
  
  // SVP referrals bonus (max 10 points)
  engagementScore += Math.min(svpReferralsGiven.length * 5, 10);

  return {
    affiliateId,
    affiliateName: `${affiliate.firstName || ""} ${affiliate.lastName || ""}`.trim() || "Unknown",
    company: affiliate.company || "Unknown",
    totalOneToOnes: completedMeetings.length,
    oneToOnesThisMonth: meetingsThisMonth.length,
    oneToOnesThisQuarter: meetingsThisQuarter.length,
    referralsGiven: referralsGiven.length,
    referralsReceived: referralsReceived.length,
    referralsGivenThisMonth: givenThisMonth.length,
    referralsReceivedThisMonth: receivedThisMonth.length,
    dealsClosedFromGiven: dealsClosedFromGiven.length,
    dealsClosedFromReceived: dealsClosedFromReceived.length,
    totalRevenueGenerated,
    totalRevenueReceived,
    svpReferralsGiven: svpReferralsGiven.length,
    svpReferralsClosed: svpReferralsClosed.length,
    svpRevenueGenerated,
    givenConversionRate,
    receivedConversionRate,
    engagementScore: Math.min(engagementScore, 100),
  };
}
