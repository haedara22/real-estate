import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    // تحديث المستخدم
    const [updatedUser] = await db
      .update(users)
      .set({
        name: name || session.user.name,
        phone: phone || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return NextResponse.json({
      message: "تم تحديث الملف الشخصي بنجاح",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "فشل في تحديث الملف الشخصي" },
      { status: 500 }
    );
  }
}