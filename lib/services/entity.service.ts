import { getDataSource } from "../db/datasource";
import { FinancialEntity, EntityCurrency } from "../db/entities/FinancialEntity";
import { Transaction, TransactionType, Currency } from "../db/entities/Transaction";

export async function getAllEntities() {
  const ds = await getDataSource();
  const entityRepo = ds.getRepository(FinancialEntity);
  const entities = await entityRepo.find({ order: { createdAt: "DESC" } });

  const result = await Promise.all(
    entities.map(async (entity) => {
      const balance = await calculateEntityBalance(entity.id, entity.currency as unknown as Currency);
      const hasTransactions = await checkHasTransactions(entity.id);
      return {
        id: entity.id,
        name: entity.name,
        currency: entity.currency,
        notes: entity.notes,
        createdAt: entity.createdAt,
        balance,
        hasTransactions,
      };
    })
  );

  return result;
}

export async function calculateEntityBalance(
  entityId: number,
  currency: Currency
): Promise<number> {
  const ds = await getDataSource();

  // الرصيد من العمليات العادية
  const txResult = await ds.query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) AS balance
    FROM transactions
    WHERE entityId = ? AND currency = ?`,
    [TransactionType.INCOME, TransactionType.EXPENSE, entityId, currency]
  );
  const txBalance = Number(txResult[0]?.balance ?? 0);

  // التحويلات الصادرة (مخصومة بعملة الجهة المصدر)
  const outResult = await ds.query(
    `SELECT COALESCE(SUM(fromAmount), 0) AS total
     FROM transfers WHERE fromEntityId = ?`,
    [entityId]
  );
  const outTotal = Number(outResult[0]?.total ?? 0);

  // التحويلات الواردة (مضافة بعملة الجهة الهدف)
  const inResult = await ds.query(
    `SELECT COALESCE(SUM(toAmount), 0) AS total
     FROM transfers WHERE toEntityId = ?`,
    [entityId]
  );
  const inTotal = Number(inResult[0]?.total ?? 0);

  return Math.round((txBalance + inTotal - outTotal) * 100) / 100;
}

export async function checkHasTransactions(entityId: number): Promise<boolean> {
  const ds = await getDataSource();
  const txRepo = ds.getRepository(Transaction);
  const count = await txRepo.count({ where: { entityId } });
  return count > 0;
}

export async function createEntity(data: {
  name: string;
  currency: EntityCurrency;
  notes?: string;
}) {
  const ds = await getDataSource();
  const entityRepo = ds.getRepository(FinancialEntity);
  const entity = entityRepo.create({
    name: data.name,
    currency: data.currency,
    notes: data.notes ?? null,
  });
  return await entityRepo.save(entity);
}

export async function updateEntity(
  id: number,
  data: { name: string; currency: EntityCurrency; notes?: string }
) {
  const ds = await getDataSource();
  const entityRepo = ds.getRepository(FinancialEntity);

  const entity = await entityRepo.findOne({ where: { id } });
  if (!entity) throw new Error("الجهة المالية غير موجودة");

  const hasTransactions = await checkHasTransactions(id);
  if (hasTransactions) throw new Error("لا يمكن تعديل جهة مالية لها حركات مسجلة");

  entity.name = data.name;
  entity.currency = data.currency;
  entity.notes = data.notes ?? null;
  return await entityRepo.save(entity);
}

export async function deleteEntity(id: number) {
  const ds = await getDataSource();
  const entityRepo = ds.getRepository(FinancialEntity);

  const entity = await entityRepo.findOne({ where: { id } });
  if (!entity) throw new Error("الجهة المالية غير موجودة");

  const hasTransactions = await checkHasTransactions(id);
  if (hasTransactions) throw new Error("لا يمكن حذف جهة مالية لها حركات مسجلة");

  await entityRepo.remove(entity);
  return { success: true };
}