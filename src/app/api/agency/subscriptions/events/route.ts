// src/app/api/agency/subscriptions/events/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // ✅ إرسال حدث كل 5 ثواني للتحقق من التحديثات
      const interval = setInterval(() => {
        const data = JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }, 5000);

      // ✅ تنظيف عند الإغلاق
      return () => clearInterval(interval);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}