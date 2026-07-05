import { db } from "./index";
import { provinces, subscriptionPlans } from "./schema";

async function seed() {
  console.log("🌱 بدء إضافة البيانات الأولية...");

  try {
    // 1. إضافة المحافظات السورية
    const provincesData = [
      { name: "Damascus", nameAr: "دمشق", code: "DM" },
      { name: "Rural Damascus", nameAr: "ريف دمشق", code: "RD" },
      { name: "Aleppo", nameAr: "حلب", code: "AL" },
      { name: "Homs", nameAr: "حمص", code: "HM" },
      { name: "Hama", nameAr: "حماة", code: "HA" },
      { name: "Latakia", nameAr: "اللاذقية", code: "LA" },
      { name: "Tartus", nameAr: "طرطوس", code: "TA" },
      { name: "Idlib", nameAr: "إدلب", code: "ID" },
      { name: "Deir ez-Zor", nameAr: "دير الزور", code: "DE" },
      { name: "Al-Hasakah", nameAr: "الحسكة", code: "HS" },
      { name: "Al-Raqqah", nameAr: "الرقة", code: "RA" },
      { name: "Daraa", nameAr: "درعا", code: "DR" },
      { name: "Al-Suwayda", nameAr: "السويداء", code: "SU" },
      { name: "Quneitra", nameAr: "القنيطرة", code: "QU" },
    ];

    for (const p of provincesData) {
      await db.insert(provinces).values(p).onConflictDoNothing();
    }
    console.log("✅ تم إضافة المحافظات");

    // 2. إضافة خطط الاشتراك
    const plans = [
      {
        name: "Free",
        nameAr: "مجاني",
        description: "خطة مجانية للمبتدئين",
        descriptionAr: "خطة مجانية للمبتدئين",
        price: "0",
        currency: "USD",
        interval: "month",
        features: ["عرض 3 عقارات", "دعم أساسي"],
        featuresAr: ["عرض 3 عقارات", "دعم أساسي"],
        maxProperties: 3,
        isFeatured: false,
        isActive: true,
      },
      {
        name: "Basic",
        nameAr: "أساسي",
        description: "خطة مناسبة للوكالات الصغيرة",
        descriptionAr: "خطة مناسبة للوكالات الصغيرة",
        price: "29",
        currency: "USD",
        interval: "month",
        features: ["عرض 20 عقار", "دعم أولوية", "تحليلات أساسية"],
        featuresAr: ["عرض 20 عقار", "دعم أولوية", "تحليلات أساسية"],
        maxProperties: 20,
        isFeatured: false,
        isActive: true,
      },
      {
        name: "Premium",
        nameAr: "مميز",
        description: "خطة متقدمة للوكالات النشطة",
        descriptionAr: "خطة متقدمة للوكالات النشطة",
        price: "79",
        currency: "USD",
        interval: "month",
        features: ["عرض 100 عقار", "ظهور في المقدمة", "تحليلات متقدمة", "مميز في البحث"],
        featuresAr: ["عرض 100 عقار", "ظهور في المقدمة", "تحليلات متقدمة", "مميز في البحث"],
        maxProperties: 100,
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Enterprise",
        nameAr: "مؤسسي",
        description: "خطة مخصصة للوكالات الكبرى",
        descriptionAr: "خطة مخصصة للوكالات الكبرى",
        price: "199",
        currency: "USD",
        interval: "month",
        features: ["عرض غير محدود", "تحليلات مخصصة", "دعم مخصص", "تخصيص كامل"],
        featuresAr: ["عرض غير محدود", "تحليلات مخصصة", "دعم مخصص", "تخصيص كامل"],
        maxProperties: 9999,
        isFeatured: true,
        isActive: true,
      },
    ];

    for (const plan of plans) {
      await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
    }
    console.log("✅ تم إضافة خطط الاشتراك");

    console.log("🎉 تم إكمال إضافة البيانات الأولية بنجاح!");
  } catch (error) {
    console.error("❌ خطأ في إضافة البيانات:", error);
    throw error;
  }
}

seed()
  .catch((e) => {
    console.error("❌ فشل في إضافة البيانات:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));