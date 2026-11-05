import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CourseDoc, type LmsProductDoc } from "@/lib/schema";

/** Public, read-only catalog endpoint. Prices and descriptions come from LMS Firestore. */
export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: "Catalog is unavailable" }, { status: 503 });
  }
  try {
    const [courseSnapshot, productSnapshot] = await Promise.all([
      adminDb.collection(COLLECTIONS.COURSES).where("published", "==", true).get(),
      adminDb.collection(COLLECTIONS.PRODUCTS).where("published", "==", true).get(),
    ]);
    const courses = courseSnapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }) as CourseDoc)
      .filter((course) => course.archived !== true)
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    const products = productSnapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }) as LmsProductDoc)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return NextResponse.json({ data: courses, products });
  } catch (error) {
    console.error("[catalog/courses] failed:", error);
    return NextResponse.json({ error: "Catalog is unavailable" }, { status: 500 });
  }
}
