import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    console.log("🔄 جلب المدن من قاعدة البيانات...");
    
    const allCities = await db
      .select()
      .from(cities)
      .orderBy(desc(cities.nameAr));
    
    console.log(`✅ تم جلب ${allCities.length} مدينة`);
    
    return NextResponse.json(allCities);
  } catch (error) {
    console.error("❌ خطأ في جلب المدن:", error);
    return NextResponse.json(
      { error: "فشل في جلب المدن", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}