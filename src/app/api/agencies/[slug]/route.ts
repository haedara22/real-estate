import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ✅ استخدم NextRequest و params مع Promise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const agency = await db
      .select({
        id: agencies.id,
        ownerId: agencies.ownerId,
        name: agencies.name,
        slug: agencies.slug,
        description: agencies.description,
        logo: agencies.logo,
        coverImage: agencies.coverImage,
        address: agencies.address,
        phone: agencies.phone,
        email: agencies.email,
        website: agencies.website,
        isVerified: agencies.isVerified,
        isActive: agencies.isActive,
        rating: agencies.rating,
        reviewCount: agencies.reviewCount,
        metadata: agencies.metadata,
        createdAt: agencies.createdAt,
        updatedAt: agencies.updatedAt,
      })
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