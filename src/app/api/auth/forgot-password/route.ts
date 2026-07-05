import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || user.length === 0) {
      // لا نكشف عن وجود المستخدم لأسباب أمنية
      return NextResponse.json({
        message: "إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة التعيين",
      });
    }

    const userData = user[0];

    // إنشاء رمز عشوائي
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // صلاحية ساعة واحدة

    // حفظ الرمز في قاعدة البيانات
    await db.insert(passwordResetTokens).values({
      userId: userData.id,
      token,
      expiresAt,
      used: false,
    });

    // إنشاء رابط إعادة التعيين
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${email}`;

    // إرسال البريد الإلكتروني
    await resend.emails.send({
      from: "سوريا للعقارات <haedarahasan69@gmail.com>",
      to: email,
      subject: "إعادة تعيين كلمة المرور",
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🏠 سوريا للعقارات</h1>
          </div>
          <div style="padding: 30px; background: white; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">إعادة تعيين كلمة المرور</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              مرحباً ${userData.name}،
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الزر أدناه لإكمال العملية:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              هذا الرابط صالح لمدة <strong>ساعة واحدة</strong> فقط.
            </p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              © 2026 سوريا للعقارات. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      message: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني",
    });

  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "فشل في إرسال رابط إعادة التعيين" },
      { status: 500 }
    );
  }
}