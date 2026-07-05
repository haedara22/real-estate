import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { favorites } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// إضافة إلى المفضلة
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { propertyId } = await request.json();

    // التحقق من عدم وجودها بالفعل
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.propertyId, propertyId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ message: "العقار موجود بالفعل في المفضلة" });
    }

    await db.insert(favorites).values({
      userId: session.user.id,
      propertyId,
    });

    return NextResponse.json({ message: "تمت الإضافة بنجاح" });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "فشل في إضافة المفضلة" },
      { status: 500 }
    );
  }
}

// إزالة من المفضلة
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { propertyId } = await request.json();

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.propertyId, propertyId)
        )
      );

    return NextResponse.json({ message: "تمت الإزالة بنجاح" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "فشل في إزالة المفضلة" },
      { status: 500 }
    );
  }
}