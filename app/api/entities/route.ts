import { NextRequest, NextResponse } from "next/server";
import { getAllEntities, createEntity } from "@/lib/services/entity.service";
import { EntityCurrency } from "@/lib/db/entities/FinancialEntity";

export async function GET() {
  try {
    const entities = await getAllEntities();
    return NextResponse.json({ success: true, data: entities });
  } catch (error) {
    console.error("GET /api/entities error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب الجهات المالية" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const entity = await createEntity({
      name: body.name.trim(),
      currency: body.currency as EntityCurrency,
      notes: body.notes?.trim(),
    });

    return NextResponse.json({ success: true, data: entity }, { status: 201 });
  } catch (error) {
    console.error("POST /api/entities error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء الجهة المالية" },
      { status: 500 }
    );
  }
}