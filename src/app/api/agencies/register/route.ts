import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, description, address, phone, email, website, logo, coverImage } = body;

    // التحقق من البيانات
    if (!name || !email) {
      return NextResponse.json(
        { error: "الاسم والبريد الإلكتروني مطلوبان" },
        { status: 400 }
      );
    }

    // ✅ التحقق من عدم وجود وكالة بنفس الاسم (تحديد الأعمدة)
    const existingAgency = await db
      .select({
        id: agencies.id,
        name: agencies.name,
      })
      .from(agencies)
      .where(eq(agencies.name, name))
      .limit(1);

    if (existingAgency.length > 0) {
      return NextResponse.json(
        { error: "يوجد وكالة مسجلة بهذا الاسم" },
        { status: 400 }
      );
    }

    // إنشاء slug إذا لم يتم توفيره
    const finalSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    // ✅ إنشاء الوكالة (بدون subscription_id)
    const [newAgency] = await db.insert(agencies).values({
      name,
      slug: finalSlug,
      description: description || null,
      address: address || null,
      phone: phone || null,
      email,
      website: website || null,
      logo: logo || null,
      coverImage: coverImage || null,
      ownerId: session.user.id,
      isActive: true,
      isVerified: false,
      rating: "0",
      reviewCount: 0,
      metadata: {},
    }).returning();

    return NextResponse.json({
      message: "تم تسجيل الوكالة بنجاح",
      slug: newAgency.slug,
      id: newAgency.id,
    }, { status: 201 });

  } catch (error) {
    console.error("Error registering agency:", error);
    return NextResponse.json(
      { error: "فشل في تسجيل الوكالة" },
      { status: 500 }
    );
  }
}