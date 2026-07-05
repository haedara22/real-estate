import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema/appSettings";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// جلب جميع الإعدادات
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const settings = await db.select().from(appSettings);
    
    // تحويل إلى كائن key: value
    const settingsObject: Record<string, any> = {};
    settings.forEach((setting) => {
      if (setting.type === "boolean") {
        settingsObject[setting.key] = setting.value === "true";
      } else if (setting.type === "number") {
        settingsObject[setting.key] = Number(setting.value);
      } else if (setting.type === "json") {
        try {
          settingsObject[setting.key] = JSON.parse(setting.value || "{}");
        } catch {
          settingsObject[setting.key] = {};
        }
      } else {
        settingsObject[setting.key] = setting.value || "";
      }
    });

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "فشل في جلب الإعدادات" },
      { status: 500 }
    );
  }
}

// تحديث الإعدادات
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    // تحديث كل إعداد
    for (const [key, value] of Object.entries(settings)) {
      const type = typeof value === "boolean" ? "boolean" : "string";
      const stringValue = typeof value === "boolean" ? String(value) : String(value);
      
      await db
        .update(appSettings)
        .set({
          value: stringValue,
          type: type,
          updatedAt: new Date(),
        })
        .where(eq(appSettings.key, key));
    }

    return NextResponse.json({
      message: "تم تحديث الإعدادات بنجاح",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "فشل في تحديث الإعدادات" },
      { status: 500 }
    );
  }
}