import { NextRequest, NextResponse } from "next/server";
import { updateEntity, deleteEntity } from "@/lib/services/entity.service";
import { EntityCurrency } from "@/lib/db/entities/FinancialEntity";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "معرف الجهة غير صحيح" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "اسم الجهة المالية مطلوب" },
        { status: 400 }
      );
    }

    if (!Object.values(EntityCurrency).includes(body.currency)) {
      return NextResponse.json(
        { success: false, message: "عملة الجهة غير صحيحة" },
        { status: 400 }
      );
    }

    const entity = await updateEntity(numericId, {
      name: body.name.trim(),
      currency: body.currency as EntityCurrency,
      notes: body.notes?.trim(),
    });

    return NextResponse.json({ success: true, data: entity });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "حدث خطأ";
    const status = message.includes("لا يمكن") ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
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
        { success: false, message: "معرف الجهة غير صحيح" },
        { status: 400 }
      );
    }

    await deleteEntity(numericId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "حدث خطأ";
    const status = message.includes("لا يمكن") ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}