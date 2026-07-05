import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { districts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { cityId: string } }
) {
  try {
    const { cityId } = await params;
    
    console.log(`🔄 جلب الأحياء للمدينة: ${cityId}`);
    
    const cityDistricts = await db
      .select()
      .from(districts)
      .where(eq(districts.cityId, cityId))
      .orderBy(districts.nameAr);
    
    console.log(`✅ تم جلب ${cityDistricts.length} حي`);
    
    return NextResponse.json(cityDistricts);
  } catch (error) {
    console.error("❌ خطأ في جلب الأحياء:", error);
    return NextResponse.json(
      { error: "فشل في جلب الأحياء" },
      { status: 500 }
    );
  }
}