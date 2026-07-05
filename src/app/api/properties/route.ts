import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties, propertyImages, agencies, agencyStaff } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { canAddProperty } from "@/lib/subscription-utils";

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    // ✅ التحقق من صلاحية الخطة
    const canAdd = await canAddProperty(session.user.id);
    if (!canAdd.allowed) {
      return NextResponse.json(
        { error: canAdd.message },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      purpose,
      type,
      bedrooms,
      bathrooms,
      area,
      cityId,
      districtId,
      address,
      isFeatured,
    } = body;

    // ✅ التحقق من البيانات المطلوبة
    if (!title || !price || !cityId || !purpose || !type) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة غير مكتملة" },
        { status: 400 }
      );
    }

    // ✅ جلب الوكالة التابعة للمستخدم (أو إنشاء واحدة افتراضية)
    let agencyId = null;
    let userRole = session.user.role;

    // 🔥 إذا كان المستخدم مالك وكالة، جلب وكالته
    if (userRole === "agency_owner") {
      const agency = await db
        .select({ id: agencies.id })
        .from(agencies)
        .where(eq(agencies.ownerId, session.user.id))
        .limit(1);

      if (agency && agency.length > 0) {
        agencyId = agency[0].id;
      } else {
        // ❌ المستخدم مالك وكالة لكن ليس لديه وكالة مسجلة
        return NextResponse.json(
          { 
            error: "ليس لديك وكالة مسجلة. يرجى تسجيل وكالة أولاً من هنا: /agency/register" 
          },
          { status: 403 }
        );
      }
    } else if (userRole === "agency_staff") {
      // 🔥 إذا كان المستخدم موظف وكالة، جلب الوكالة التي يعمل بها
      const staffAgency = await db
        .select({ agencyId: agencyStaff.agencyId })
        .from(agencyStaff)
        .where(eq(agencyStaff.userId, session.user.id))
        .limit(1);

      if (staffAgency && staffAgency.length > 0) {
        agencyId = staffAgency[0].agencyId;
      } else {
        return NextResponse.json(
          { 
            error: "أنت موظف ولكن ليس لديك وكالة مرتبطة. يرجى التواصل مع المدير." 
          },
          { status: 403 }
        );
      }
    } else {
      // 🔥 إذا كان المستخدم عادي، لا يمكنه إضافة عقار (يجب أن يكون مالك وكالة أو موظف)
      return NextResponse.json(
        { 
          error: "يجب أن تكون مالك وكالة أو موظفاً لإضافة عقار. سجل وكالتك الآن." 
        },
        { status: 403 }
      );
    }

    // ✅ إنشاء slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    const slug = `${baseSlug}-${Date.now()}`;
    const code = `SYR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

    // ✅ إنشاء العقار مع ربط الوكالة والمستخدم
    const [property] = await db.insert(properties).values({
      title,
      slug,
      code,
      description: description || null,
      price: price.toString(),
      purpose,
      type,
      status: "active",
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area: area ? area.toString() : null,
      cityId,
      districtId: districtId || null,
      address: address || null,
      isFeatured: isFeatured || false,
      userId: session.user.id,          // ✅ ربط المستخدم
      agencyId: agencyId,               // ✅ ربط الوكالة
      viewsCount: 0,
      favoritesCount: 0,
      metadata: {},
      publishedAt: new Date(),
    }).returning();

    return NextResponse.json({
      message: "✅ تم إضافة العقار بنجاح",
      id: property.id,
      slug: property.slug,
      code: property.code,
      agencyId: agencyId,
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error creating property:", error);
    return NextResponse.json(
      { 
        error: "فشل في إضافة العقار",
        details: error instanceof Error ? error.message : "حدث خطأ غير متوقع"
      },
      { status: 500 }
    );
  }
}