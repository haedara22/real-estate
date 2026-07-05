import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, subscriptionPlans, userSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role = "user" } = body;

    // ============================================
    // 1. التحقق من البيانات
    // ============================================
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صحيح" },
        { status: 400 }
      );
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // ============================================
    // 2. التحقق من وجود المستخدم
    // ============================================
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 }
      );
    }

    // ============================================
    // 3. جلب الخطة المجانية
    // ============================================
    const freePlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, "Free"))
      .limit(1);

    if (!freePlan || freePlan.length === 0) {
      return NextResponse.json(
        { error: "الخطة المجانية غير موجودة في النظام" },
        { status: 500 }
      );
    }

    const freePlanData = freePlan[0];

    // ============================================
    // 4. تشفير كلمة المرور
    // ============================================
    const hashedPassword = await bcrypt.hash(password, 10);

    // ============================================
    // 5. إنشاء المستخدم
    // ============================================
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
        // ✅ إضافة الخطة المجانية مباشرة
        planId: freePlanData.id,
        planStatus: "active",
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // شهر واحد
      })
      .returning();

    // ============================================
    // 6. إنشاء اشتراك مجاني
    // ============================================
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await db.insert(userSubscriptions).values({
      userId: newUser.id,
      planId: freePlanData.id,
      status: "active",
      startDate: startDate,
      endDate: endDate,
      autoRenew: false,
    });

    // ============================================
    // 7. حذف كلمة المرور من الاستجابة
    // ============================================
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        message: "✅ تم إنشاء الحساب بنجاح مع الخطة المجانية",
        user: userWithoutPassword,
        plan: {
          name: freePlanData.name,
          nameAr: freePlanData.nameAr,
          expiresAt: endDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء الحساب" },
      { status: 500 }
    );
  }
}