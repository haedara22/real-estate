// src/app/api/cities/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allCities = await db
      .select()
      .from(cities)
      .orderBy(asc(cities.nameAr));

    return NextResponse.json(allCities);
  } catch (error) {
    console.error("❌ Error fetching cities:", error);
    return NextResponse.json(
      { error: "فشل في جلب المدن" },
      { status: 500 }
    );
  }
}