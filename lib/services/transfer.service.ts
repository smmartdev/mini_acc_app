import { getDataSource } from "../db/datasource";
import { Transfer } from "../db/entities/Transfer";
import { FinancialEntity } from "../db/entities/FinancialEntity";

export interface CreateTransferDto {
  fromEntityId: number;
  toEntityId: number;
  fromAmount: number;
  exchangeRate?: number;
  date: string;
  description?: string;
}

export async function getAllTransfers() {
  const ds = await getDataSource();
  const repo = ds.getRepository(Transfer);
  return await repo.find({
    relations: ["fromEntity", "toEntity"],
    order: { date: "DESC", createdAt: "DESC" },
  });
}

export async function createTransfer(dto: CreateTransferDto) {
  const ds = await getDataSource();
  const repo = ds.getRepository(Transfer);
  const entityRepo = ds.getRepository(FinancialEntity);

  // جلب الجهتين
  const fromEntity = await entityRepo.findOne({ where: { id: dto.fromEntityId } });
  const toEntity = await entityRepo.findOne({ where: { id: dto.toEntityId } });

  if (!fromEntity) throw new Error("الجهة المصدر غير موجودة");
  if (!toEntity) throw new Error("الجهة الهدف غير موجودة");
  if (fromEntity.id === toEntity.id) throw new Error("لا يمكن التحويل إلى نفس الجهة");

  const sameCurrency = fromEntity.currency === toEntity.currency;

  // إذا نفس العملة: المبلغ المحول = المبلغ المستلم، سعر الصرف = 1
  // إذا عملات مختلفة: يجب إدخال سعر الصرف
  let exchangeRate = 1;
  let toAmount = dto.fromAmount;

  if (!sameCurrency) {
    if (!dto.exchangeRate || dto.exchangeRate <= 0) {
      throw new Error("يجب إدخال سعر الصرف عند التحويل بين عملات مختلفة");
    }
    exchangeRate = dto.exchangeRate;
    toAmount = Math.round(dto.fromAmount * exchangeRate * 100) / 100;
  }

  const transfer = repo.create({
    fromEntityId: dto.fromEntityId,
    toEntityId: dto.toEntityId,
    fromAmount: dto.fromAmount,
    fromCurrency: fromEntity.currency,
    toAmount,
    toCurrency: toEntity.currency,
    exchangeRate,
    date: dto.date,
    description: dto.description ?? null,
  });

  return await repo.save(transfer);
}

export async function deleteTransfer(id: number) {
  const ds = await getDataSource();
  const repo = ds.getRepository(Transfer);

  const transfer = await repo.findOne({ where: { id } });
  if (!transfer) throw new Error("التحويل غير موجود");

  await repo.remove(transfer);
  return { success: true };
}