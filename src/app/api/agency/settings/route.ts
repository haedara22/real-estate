import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// ✅ جلب بيانات الوكالة
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const agency = await db
      .select({
        id: agencies.id,
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
      })
      .from(agencies)
      .where(eq(agencies.ownerId, session.user.id))
      .limit(1);

    if (!agency || agency.length === 0) {
      return NextResponse.json(
        { error: "الوكالة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({ agency: agency[0] });

  } catch (error) {
    console.error("Error fetching agency settings:", error);
    return NextResponse.json(
      { error: "فشل في جلب بيانات الوكالة" },
      { status: 500 }
    );
  }
}

// ✅ تحديث بيانات الوكالة
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, address, phone, email, website, logo, coverImage } = body;

    // التحقق من البيانات
    if (!name) {
      return NextResponse.json(
        { error: "اسم الوكالة مطلوب" },
        { status: 400 }
      );
    }

    // تحديث الوكالة
    const [updatedAgency] = await db
      .update(agencies)
      .set({
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        logo: logo || null,
        coverImage: coverImage || null,
        updatedAt: new Date(),
      })
      .where(eq(agencies.ownerId, session.user.id))
      .returning();

    return NextResponse.json({
      message: "تم تحديث الإعدادات بنجاح",
      agency: updatedAgency,
    });

  } catch (error) {
    console.error("Error updating agency settings:", error);
    return NextResponse.json(
      { error: "فشل في تحديث الإعدادات" },
      { status: 500 }
    );
  }
}