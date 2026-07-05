import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // ✅ التحقق من وجود البريد الإلكتروني
    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    // ✅ البحث عن المستخدم
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // ✅ لأسباب أمنية: نفس الرسالة في جميع الحالات
    if (!user || user.length === 0) {
      console.log(`⚠️ محاولة إعادة تعيين لبريد غير مسجل: ${email}`);
      return NextResponse.json({
        message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رمز إعادة التعيين",
      });
    }

    const userData = user[0];

    // ✅ حذف الرموز القديمة غير المستخدمة
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userData.id));

    // ✅ إنشاء رمز مكون من 6 أرقام
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // صلاحية 15 دقيقة

    // ✅ حفظ الرمز في قاعدة البيانات
    await db.insert(passwordResetTokens).values({
      userId: userData.id,
      token,
      expiresAt,
      used: false,
    });

    // ✅ طباعة الرمز في Console للتطوير
    console.log("🔑 ====== رمز إعادة التعيين ======");
    console.log(`📧 البريد: ${email}`);
    console.log(`🔑 الرمز: ${token}`);
    console.log(`⏰ ينتهي في: ${expiresAt.toLocaleTimeString()}`);
    console.log("==================================");

    // ✅ إرجاع الرمز للمستخدم (سيظهر في الصفحة)
    return NextResponse.json({
      message: "تم إنشاء رمز إعادة التعيين",
      token: token,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error("❌ Error in forgot-password:", error);
    return NextResponse.json(
      { error: "فشل في إنشاء رمز إعادة التعيين" },
      { status: 500 }
    );
  }
}