// src/app/api/upload/route.ts

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { canAddImage } from "@/lib/subscription-utils";
import { db } from "@/lib/db";
import { propertyImages } from "@/lib/db/schema";

// ✅ تعريف نوع للصورة المرتجعة
interface UploadedImage {
  id: string;
  url: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    const propertyId = formData.get("propertyId") as string;
    const isPaymentProof = formData.get("isPaymentProof") === "true";
    
    console.log("📦 استلام طلب رفع:", {
      filesCount: files.length,
      propertyId,
      isPaymentProof,
      keys: Array.from(formData.keys()),
    });

    // ✅ إذا كان paymentProof
    if (formData.has("paymentProof") || isPaymentProof) {
      const paymentProof = formData.get("paymentProof") as File || files[0];
      if (paymentProof && paymentProof instanceof File) {
        if (paymentProof.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "حجم الملف يجب أن يكون أقل من 5 ميجابايت" },
            { status: 400 }
          );
        }

        const bytes = await paymentProof.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const uploadDir = join(process.cwd(), "public/uploads/payments");
        await mkdir(uploadDir, { recursive: true });
        
        const ext = paymentProof.name.split(".").pop() || "png";
        const filename = `${randomUUID()}.${ext}`;
        const filepath = join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        
        return NextResponse.json({ 
          urls: [`/uploads/payments/${filename}`],
          isPaymentProof: true,
        });
      }
    }

    // ✅ التحقق من وجود ملفات
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "لم يتم رفع أي صور" },
        { status: 400 }
      );
    }

    // ✅ التحقق من وجود propertyId
    if (!propertyId || propertyId === "undefined" || propertyId === "null") {
      return NextResponse.json(
        { error: "معرف العقار مطلوب" },
        { status: 400 }
      );
    }

    // ✅ التحقق من الصلاحية
    const canAdd = await canAddImage(propertyId, session.user.id);
    if (!canAdd.allowed) {
      return NextResponse.json(
        { error: canAdd.message },
        { status: 403 }
      );
    }

    // ✅ أنواع الملفات المسموحة
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg", "image/svg+xml"];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { error: `أنواع الملفات غير مدعومة` },
        { status: 400 }
      );
    }

    // ✅ رفع الصور وحفظها بقاعدة البيانات
    const uploadDir = join(process.cwd(), "public/uploads/properties");
    await mkdir(uploadDir, { recursive: true });

    const uploadedImages: UploadedImage[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = file.name.split(".").pop() || "png";
      const filename = `${randomUUID()}.${ext}`;
      const filepath = join(uploadDir, filename);
      const url = `/uploads/properties/${filename}`;
      
      await writeFile(filepath, buffer);
      
      // ✅ حفظ الصورة في قاعدة البيانات
      try {
        // ✅ استخدم as any أو حدد النوع
        const result = await db
          .insert(propertyImages)
          .values({
            propertyId: propertyId,
            url: url,
            order: uploadedImages.length,
            createdAt: new Date(),
          })
          .returning({
            id: propertyImages.id,
            url: propertyImages.url,
          });

        // ✅ تأكد من وجود نتيجة
        if (result && result.length > 0) {
          const newImage = result[0] as UploadedImage;
          uploadedImages.push(newImage);
          console.log(`✅ تم حفظ الصورة في قاعدة البيانات: ${url}`);
        }
      } catch (dbError) {
        console.error("❌ فشل حفظ الصورة في قاعدة البيانات:", dbError);
        // استمر مع بقية الصور
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: "فشل حفظ الصور في قاعدة البيانات" },
        { status: 500 }
      );
    }

    console.log(`✅ تم رفع وحفظ ${uploadedImages.length} صورة للعقار ${propertyId}`);

    return NextResponse.json({ 
      urls: uploadedImages.map(img => img.url),
      images: uploadedImages,
      count: uploadedImages.length,
      propertyId,
      success: true,
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { 
        error: "فشل في رفع الصور",
        details: error instanceof Error ? error.message : "حدث خطأ غير متوقع"
      },
      { status: 500 }
    );
  }
}