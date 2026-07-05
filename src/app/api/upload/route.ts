import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { canAddImage } from "@/lib/subscription-utils";

export async function POST(request: Request) {
  try {
    // ✅ التحقق من المصادقة
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
    
    console.log("📦 استلام طلب رفع:", {
      filesCount: files.length,
      propertyId,
      hasPaymentProof: formData.has("paymentProof"),
    });

    // ✅ إذا كان هناك paymentProof (لطلبات الاشتراك)
    if (formData.has("paymentProof")) {
      const paymentProof = formData.get("paymentProof") as File;
      if (paymentProof) {
        // التحقق من حجم الملف
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
          urls: [`/uploads/payments/${filename}`] 
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

    // ✅ التحقق من وجود propertyId (لرفع صور العقار)
    if (!propertyId) {
      return NextResponse.json(
        { error: "معرف العقار مطلوب" },
        { status: 400 }
      );
    }

    // ✅ التحقق من صلاحية إضافة صور
    const canAdd = await canAddImage(propertyId, session.user.id);
    if (!canAdd.allowed) {
      return NextResponse.json(
        { error: canAdd.message },
        { status: 403 }
      );
    }

    // ✅ التحقق من عدد الصور
    if (files.length > 10) {
      return NextResponse.json(
        { error: "يمكن رفع 10 صور كحد أقصى في المرة الواحدة" },
        { status: 400 }
      );
    }

    // ✅ التحقق من أنواع الملفات
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { error: "أنواع الملفات غير مدعومة. يرجى رفع صور بصيغة JPEG, PNG, WEBP أو GIF" },
        { status: 400 }
      );
    }

    // ✅ التحقق من حجم كل ملف
    const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      return NextResponse.json(
        { error: "حجم الملف يجب أن يكون أقل من 5 ميجابايت لكل صورة" },
        { status: 400 }
      );
    }

    // ✅ رفع الصور
    const uploadDir = join(process.cwd(), "public/uploads/properties");
    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = file.name.split(".").pop() || "png";
      const filename = `${randomUUID()}.${ext}`;
      const filepath = join(uploadDir, filename);
      
      await writeFile(filepath, buffer);
      urls.push(`/uploads/properties/${filename}`);
    }

    console.log(`✅ تم رفع ${urls.length} صورة للعقار ${propertyId}`);

    return NextResponse.json({ 
      urls,
      count: urls.length,
      propertyId,
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