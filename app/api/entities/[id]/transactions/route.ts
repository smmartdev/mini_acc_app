import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/db/datasource";
import { Transaction, TransactionType } from "@/lib/db/entities/Transaction";
import { Transfer } from "@/lib/db/entities/Transfer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entityId = Number(id);
    if (isNaN(entityId)) {
      return NextResponse.json(
        { success: false, message: "معرف الجهة غير صحيح" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const ds = await getDataSource();
    const txRepo = ds.getRepository(Transaction);
    const trRepo = ds.getRepository(Transfer);

    // ===== العمليات (واردات + مصروفات) =====
    const txQuery = txRepo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.category", "category")
      .where("t.entityId = :entityId", { entityId });

    if (fromDate) txQuery.andWhere("t.date >= :fromDate", { fromDate });
    if (toDate) txQuery.andWhere("t.date <= :toDate", { toDate });

    const transactions = await txQuery.orderBy("t.date", "DESC").getMany();

    // ===== التحويلات الصادرة =====
    const outQuery = trRepo
      .createQueryBuilder("tr")
      .leftJoinAndSelect("tr.toEntity", "toEntity")
      .where("tr.fromEntityId = :entityId", { entityId });

    if (fromDate) outQuery.andWhere("tr.date >= :fromDate", { fromDate });
    if (toDate) outQuery.andWhere("tr.date <= :toDate", { toDate });

    const outTransfers = await outQuery.orderBy("tr.date", "DESC").getMany();

    // ===== التحويلات الواردة =====
    const inQuery = trRepo
      .createQueryBuilder("tr")
      .leftJoinAndSelect("tr.fromEntity", "fromEntity")
      .where("tr.toEntityId = :entityId", { entityId });

    if (fromDate) inQuery.andWhere("tr.date >= :fromDate", { fromDate });
    if (toDate) inQuery.andWhere("tr.date <= :toDate", { toDate });

    const inTransfers = await inQuery.orderBy("tr.date", "DESC").getMany();

    // ===== تجميع كل الحركات في قائمة موحدة =====
    const movements = [
      ...transactions.map(t => ({
        id: `tx-${t.id}`,
        date: t.date,
        type: t.type === TransactionType.INCOME ? "income" : "expense",
        label: t.type === TransactionType.INCOME ? "وارد" : "مصروف",
        amount: Number(t.amount),
        currency: t.currency,
        category: t.category?.name ?? null,
        counterpart: null,
        description: t.description,
      })),
      ...outTransfers.map(tr => ({
        id: `out-${tr.id}`,
        date: tr.date,
        type: "transfer-out",
        label: "تحويل صادر",
        amount: Number(tr.fromAmount),
        currency: tr.fromCurrency,
        category: null,
        counterpart: tr.toEntity?.name ?? null,
        description: tr.description,
      })),
      ...inTransfers.map(tr => ({
        id: `in-${tr.id}`,
        date: tr.date,
        type: "transfer-in",
        label: "تحويل وارد",
        amount: Number(tr.toAmount),
        currency: tr.toCurrency,
        category: null,
        counterpart: tr.fromEntity?.name ?? null,
        description: tr.description,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    // ===== الإجماليات =====
    const totalIn = movements
      .filter(m => m.type === "income" || m.type === "transfer-in")
      .reduce((s, m) => s + m.amount, 0);

    const totalOut = movements
      .filter(m => m.type === "expense" || m.type === "transfer-out")
      .reduce((s, m) => s + m.amount, 0);

    return NextResponse.json({
      success: true,
      data: { movements, totalIn, totalOut, net: totalIn - totalOut },
    });
  } catch (error) {
    console.error("GET /api/entities/[id]/transactions error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب الحركات" },
      { status: 500 }
    );
  }
}