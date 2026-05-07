import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/datasource";
import { Category } from "@/lib/db/entities/Category";

export async function GET() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Category);

    const categories = await repo.find({
      order: { name: "ASC" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب الفئات" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "اسم الفئة مطلوب" },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(Category);

    const category = repo.create({
      name: body.name.trim(),
      isAggregated: body.isAggregated ?? false,
    });

    const saved = await repo.save(category);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء إنشاء الفئة" },
      { status: 500 }
    );
  }
}