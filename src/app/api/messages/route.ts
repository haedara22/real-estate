import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, chats, chatParticipants, agencies } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm"; // ✅ أضف هذا الاستيراد

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { propertyId, agencyId, message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 });
    }

    // البحث عن محادثة موجودة
    let chat = await db
      .select()
      .from(chats)
      .where(eq(chats.propertyId, propertyId))
      .limit(1);

    let chatId;
    if (chat.length > 0) {
      chatId = chat[0].id;
    } else {
      // إنشاء محادثة جديدة
      const [newChat] = await db.insert(chats).values({
        propertyId,
        isActive: true,
      }).returning();
      chatId = newChat.id;

      // إضافة المستخدم كمشارك
      await db.insert(chatParticipants).values({
        chatId,
        userId: session.user.id,
        isActive: true,
      });

      // إذا كانت هناك وكالة، أضف مالكها كمشارك
      if (agencyId) {
        const agency = await db
          .select()
          .from(agencies)
          .where(eq(agencies.id, agencyId))
          .limit(1);

        if (agency.length > 0 && agency[0].ownerId) {
          await db.insert(chatParticipants).values({
            chatId,
            userId: agency[0].ownerId,
            isActive: true,
          });
        }
      }
    }

    // إرسال الرسالة
    await db.insert(messages).values({
      chatId,
      senderId: session.user.id,
      content: message.trim(),
      type: "text",
    });

    return NextResponse.json({ message: "تم إرسال الرسالة بنجاح" });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "فشل في إرسال الرسالة" },
      { status: 500 }
    );
  }
}