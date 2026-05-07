import { NextRequest, NextResponse } from "next/server";
import { updateTransaction, deleteTransaction } from "@/lib/services/transaction.service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "معرف العملية غير صحيح" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const updated = await updateTransaction(numericId, {
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      date: body.date,
      description: body.description,
      categoryId: body.categoryId !== undefined ? Number(body.categoryId) : undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "حدث خطأ";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "معرف العملية غير صحيح" },
        { status: 400 }
      );
    }
    const result = await deleteTransaction(numericId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "حدث خطأ";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}