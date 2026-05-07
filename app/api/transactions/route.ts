import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions, createTransaction } from "@/lib/services/transaction.service";
import { TransactionType, Currency } from "@/lib/db/entities/Transaction";

export async function GET() {
  try {
    const transactions = await getAllTransactions();
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب العمليات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.type || !body.amount || !body.currency || !body.date || !body.entityId) {
      return NextResponse.json(
        { success: false, message: "جميع الحقول الأساسية مطلوبة" },
        { status: 400 }
      );
    }

    if (!Object.values(TransactionType).includes(body.type)) {
      return NextResponse.json(
        { success: false, message: "نوع العملية غير صحيح" },
        { status: 400 }
      );
    }

    if (!Object.values(Currency).includes(body.currency)) {
      return NextResponse.json(
        { success: false, message: "العملة غير صحيحة" },
        { status: 400 }
      );
    }

    if (Number(body.amount) <= 0) {
      return NextResponse.json(
        { success: false, message: "المبلغ يجب أن يكون أكبر من صفر" },
        { status: 400 }
      );
    }

    const transaction = await createTransaction({
      type: body.type,
      amount: Number(body.amount),
      currency: body.currency,
      date: body.date,
      description: body.description,
      entityId: Number(body.entityId),
      categoryId: body.categoryId ? Number(body.categoryId) : undefined,
    });

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "حدث خطأ";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}