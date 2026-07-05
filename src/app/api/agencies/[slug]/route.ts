import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = await params;
    
    const agency = await db
      .select()
      .from(agencies)
      .where(eq(agencies.slug, slug))
      .limit(1);
    
    if (!agency || agency.length === 0) {
      return NextResponse.json(
        { error: "الوكالة غير موجودة" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(agency[0]);
  } catch (error) {
    console.error("Error fetching agency:", error);
    return NextResponse.json(
      { error: "فشل في جلب الوكالة" },
      { status: 500 }
    );
  }
}