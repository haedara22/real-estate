import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema/appSettings";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // إعادة ضبط الإعدادات إلى القيم الافتراضية
    const defaultSettings = [
      { key: 'site_name', value: 'سوريا للعقارات', type: 'string' },
      { key: 'site_description', value: 'منصة العقارات الرائدة في سوريا', type: 'string' },
      { key: 'site_language', value: 'ar', type: 'string' },
      { key: 'site_theme', value: 'system', type: 'string' },
      { key: 'notifications_enabled', value: 'true', type: 'boolean' },
      { key: 'email_notifications_enabled', value: 'true', type: 'boolean' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean' },
    ];

    for (const setting of defaultSettings) {
      await db
        .update(appSettings)
        .set({
          value: setting.value,
          type: setting.type,
          updatedAt: new Date(),
        })
        .where(eq(appSettings.key, setting.key));
    }

    return NextResponse.json({
      message: "تم إعادة ضبط الإعدادات بنجاح",
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    return NextResponse.json(
      { error: "فشل في إعادة ضبط الإعدادات" },
      { status: 500 }
    );
  }
}