import { NextRequest, NextResponse } from "next/server";
import { deleteTransfer } from "@/lib/services/transfer.service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "معرف التحويل غير صحيح" },
        { status: 400 }
      );
    }

    await deleteTransfer(numericId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "حدث خطأ أثناء حذف التحويل";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}