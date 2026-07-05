import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { error: "الرمز والبريد الإلكتروني مطلوبان", valid: false },
        { status: 400 }
      );
    }

    // ✅ جلب المستخدم
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: "المستخدم غير موجود", valid: false },
        { status: 404 }
      );
    }

    const userData = user[0];

    // ✅ جلب الرمز والتحقق منه
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
        { error: "الرمز غير صحيح", valid: false },
        { status: 400 }
      );
    }

    const tokenData = resetToken[0];

    // ✅ التحقق من صلاحية الرمز
    if (new Date() > new Date(tokenData.expiresAt)) {
      return NextResponse.json(
        { error: "انتهت صلاحية الرمز", valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error("❌ Error validating reset token:", error);
    return NextResponse.json(
      { error: "حدث خطأ", valid: false },
      { status: 500 }
    );
  }
}