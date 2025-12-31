import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";

interface AffiliateActivity {
  id: string;
  affiliateId: string;
  name: string;
  email: string;
  lastMeetingDate?: Date;
  totalMeetings: number;
  currentStreak: number;
  referralsGiven: number;
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Fetch all affiliate stats
    const statsSnapshot = await getDocs(collection(db, COLLECTIONS.AFFILIATE_STATS));
    const allStats = statsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as any));

    // Fetch team members for names/emails
    const membersSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.TEAM_MEMBERS),
        where("role", "==", "affiliate"),
        where("status", "==", "active")
      )
    );
    const membersMap = new Map();
    membersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      membersMap.set(doc.id, {
        name: `${data.firstName} ${data.lastName}`,
        email: data.emailPrimary,
      });
    });

    const now = new Date();
    const alerts = [];
    const lowActivityThreshold = 14; // days
    const streakRiskThreshold = 2; // days until streak breaks

    for (const stats of allStats) {
      const member = membersMap.get(stats.affiliateId);
      if (!member) continue;

      const activity: AffiliateActivity = {
        id: stats.id,
        affiliateId: stats.affiliateId,
        name: member.name,
        email: member.email,
        lastMeetingDate: stats.lastOneToOneDate?.toDate(),
        totalMeetings: stats.totalOneToOnesCompleted || 0,
        currentStreak: stats.currentOneToOneStreak || 0,
        referralsGiven: stats.referralsGiven || 0,
      };

      // Check for low activity
      if (activity.lastMeetingDate) {
        const daysSinceLastMeeting = Math.floor(
          (now.getTime() - activity.lastMeetingDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastMeeting >= lowActivityThreshold) {
          alerts.push({
            type: "low-activity",
            affiliateId: activity.affiliateId,
            affiliateName: activity.name,
            priority: daysSinceLastMeeting >= 30 ? "high" : "medium",
            title: "Networking Activity Below Average",
            message: `No meetings in the past ${daysSinceLastMeeting} days`,
            recommendation: "Schedule 2-3 meetings this week to maintain momentum",
            daysSinceLastMeeting,
          });
        }

        // Check for streak risk
        if (activity.currentStreak >= 3) {
          const daysUntilStreakBreaks = 7 - (daysSinceLastMeeting % 7);
          if (daysUntilStreakBreaks <= streakRiskThreshold) {
            alerts.push({
              type: "streak-risk",
              affiliateId: activity.affiliateId,
              affiliateName: activity.name,
              priority: "medium",
              title: "Weekly Streak at Risk",
              message: `Your ${activity.currentStreak}-week streak ends in ${daysUntilStreakBreaks} days`,
              recommendation: "Schedule at least one meeting before the week ends",
              currentStreak: activity.currentStreak,
              daysRemaining: daysUntilStreakBreaks,
            });
          }
        }
      } else if (activity.totalMeetings === 0) {
        // New affiliate who hasn't had their first meeting
        alerts.push({
          type: "missed-opportunity",
          affiliateId: activity.affiliateId,
          affiliateName: activity.name,
          priority: "high",
          title: "Get Started with Networking",
          message: "You haven't scheduled your first 1-to-1 meeting yet",
          recommendation: "Check out AI-recommended matches and schedule your first meeting",
        });
      }
    }

    // Save alerts to database
    const savedAlerts = [];
    for (const alert of alerts) {
      try {
        const alertDoc = {
          affiliateId: alert.affiliateId,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          recommendation: alert.recommendation,
          suggestedAction: getSuggestedAction(alert.type),
          priority: alert.priority,
          status: "active",
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        };

        const docRef = await addDoc(collection(db, "networkingAlerts"), alertDoc);
        savedAlerts.push({ id: docRef.id, ...alertDoc });
      } catch (error) {
        console.error("Error saving alert:", error);
      }
    }

    return NextResponse.json({
      alertsGenerated: savedAlerts.length,
      alerts: savedAlerts,
      summary: {
        lowActivity: alerts.filter(a => a.type === "low-activity").length,
        streakRisk: alerts.filter(a => a.type === "streak-risk").length,
        missedOpportunity: alerts.filter(a => a.type === "missed-opportunity").length,
      },
      processedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error detecting low activity:", error);
    return NextResponse.json(
      { error: "Failed to detect low activity" },
      { status: 500 }
    );
  }
}

function getSuggestedAction(alertType: string): string {
  switch (alertType) {
    case "low-activity":
      return "View AI-recommended matches and schedule a meeting";
    case "streak-risk":
      return "Schedule a quick virtual coffee to maintain your streak";
    case "missed-opportunity":
      return "Complete your networking profile and view recommended connections";
    case "follow-up":
      return "Review pending follow-ups and reach out";
    default:
      return "Visit the networking dashboard";
  }
}

// GET endpoint to fetch alerts for a specific affiliate
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get("affiliateId");

    if (!affiliateId) {
      return NextResponse.json(
        { error: "Affiliate ID is required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const alertsSnapshot = await getDocs(
      query(
        collection(db, "networkingAlerts"),
        where("affiliateId", "==", affiliateId),
        where("status", "==", "active")
      )
    );

    const alerts = alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      alerts,
      count: alerts.length,
    });

  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
