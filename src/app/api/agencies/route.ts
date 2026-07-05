import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allAgencies = await db
      .select()
      .from(agencies)
      .where(eq(agencies.isActive, true))
      .orderBy(desc(agencies.createdAt));
    
    return NextResponse.json(allAgencies);
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return NextResponse.json(
      { error: "فشل في جلب الوكالات" },
      { status: 500 }
    );
  }
}