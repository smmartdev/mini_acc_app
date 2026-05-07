import { NextRequest, NextResponse } from "next/server";
import { getAllTransfers, createTransfer } from "@/lib/services/transfer.service";

export async function GET() {
  try {
    const transfers = await getAllTransfers();
    return NextResponse.json({ success: true, data: transfers });
  } catch (error) {
    console.error("GET /api/transfers error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب التحويلات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.fromEntityId || !body.toEntityId || !body.fromAmount || !body.date) {
      return NextResponse.json(
        { success: false, message: "جميع الحقول الأساسية مطلوبة" },
        { status: 400 }
      );
    }

    if (Number(body.fromAmount) <= 0) {
      return NextResponse.json(
        { success: false, message: "المبلغ يجب أن يكون أكبر من صفر" },
        { status: 400 }
      );
    }

    const transfer = await createTransfer({
      fromEntityId: Number(body.fromEntityId),
      toEntityId: Number(body.toEntityId),
      fromAmount: Number(body.fromAmount),
      exchangeRate: body.exchangeRate ? Number(body.exchangeRate) : undefined,
      date: body.date,
      description: body.description,
    });

    return NextResponse.json({ success: true, data: transfer }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء التحويل";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}