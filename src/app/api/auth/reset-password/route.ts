import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // جلب المستخدم
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const userData = user[0];

    // جلب الرمز والتحقق منه
    const resetToken = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, userData.id),
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    if (!resetToken || resetToken.length === 0) {
      return NextResponse.json(
        { error: "الرمز غير صالح" },
        { status: 400 }
      );
    }

    const tokenData = resetToken[0];

    // التحقق من صلاحية الرمز
    if (new Date() > new Date(tokenData.expiresAt)) {
      return NextResponse.json(
        { error: "انتهت صلاحية الرمز" },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(password, 10);

    // تحديث كلمة المرور
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userData.id));

    // تعليم الرمز كمستخدم
    await db
      .update(passwordResetTokens)
      .set({
        used: true,
      })
      .where(eq(passwordResetTokens.id, tokenData.id));

    return NextResponse.json({
      message: "تم إعادة تعيين كلمة المرور بنجاح",
    });

  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "فشل في إعادة تعيين كلمة المرور" },
      { status: 500 }
    );
  }
}