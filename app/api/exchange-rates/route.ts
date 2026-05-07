import { NextRequest, NextResponse } from "next/server";
import { getAllRates, upsertRate } from "@/lib/services/exchangeRate.service";

// GET /api/exchange-rates → جلب كل الأسعار
export async function GET() {
  try {
    const rates = await getAllRates();
    return NextResponse.json({ success: true, data: rates });
  } catch (error) {
    console.error("GET /api/exchange-rates error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب أسعار الصرف" },
      { status: 500 }
    );
  }
}

// POST /api/exchange-rates → تحديث سعر عملة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.currency || !body.rate) {
      return NextResponse.json(
        { success: false, message: "العملة والسعر مطلوبان" },
        { status: 400 }
      );
    }

    const validCurrencies = ["USD", "JOD", "ILS"];
    if (!validCurrencies.includes(body.currency)) {
      return NextResponse.json(
        { success: false, message: "عملة غير صحيحة" },
        { status: 400 }
      );
    }

    if (Number(body.rate) <= 0) {
      return NextResponse.json(
        { success: false, message: "السعر يجب أن يكون أكبر من صفر" },
        { status: 400 }
      );
    }

    const result = await upsertRate(body.currency, Number(body.rate));
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST /api/exchange-rates error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحديث سعر الصرف" },
      { status: 500 }
    );
  }
}