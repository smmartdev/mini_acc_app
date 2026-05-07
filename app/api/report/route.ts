import { NextRequest, NextResponse } from "next/server";
import { getMonthlyReport } from "@/lib/services/report.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const entityId = searchParams.get("entityId");

    // التحقق من الشهر
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, message: "يجب تحديد الشهر بصيغة YYYY-MM" },
        { status: 400 }
      );
    }

    const report = await getMonthlyReport(
      month,
      entityId ? Number(entityId) : undefined
    );

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("GET /api/report error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء التقرير" },
      { status: 500 }
    );
  }
}