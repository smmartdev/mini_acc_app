import { getDataSource } from "../db/datasource";
import { Transaction, TransactionType } from "../db/entities/Transaction";
import { CreateTransactionDto, UpdateTransactionDto } from "../dto/transaction.dto";

export async function getAllTransactions() {
  const ds = await getDataSource();
  const repo = ds.getRepository(Transaction);
  return await repo.find({
    relations: ["entity", "category"],
    order: { date: "DESC", createdAt: "DESC" },
  });
}

export async function createTransaction(dto: CreateTransactionDto) {
  const ds = await getDataSource();
  const repo = ds.getRepository(Transaction);

  if (dto.type === TransactionType.EXPENSE && !dto.categoryId) {
    throw new Error("يجب تحديد الفئة للمصروفات");
  }

  const transaction = repo.create({
    type: dto.type,
    amount: dto.amount,
    currency: dto.currency,
    date: dto.date,
    description: dto.description ?? null,
    entityId: dto.entityId,
    categoryId: dto.categoryId ?? null,
  });

  return await repo.save(transaction);
}

export async function updateTransaction(id: number, dto: UpdateTransactionDto) {
  const ds = await getDataSource();
  const repo = ds.getRepository(Transaction);

  const transaction = await repo.findOne({ where: { id } });
  if (!transaction) throw new Error("العملية غير موجودة");

  if (dto.amount !== undefined) transaction.amount = dto.amount;
  if (dto.date !== undefined) transaction.date = dto.date;
  if (dto.description !== undefined) transaction.description = dto.description;
  if (dto.categoryId !== undefined) transaction.categoryId = dto.categoryId;

  return await repo.save(transaction);
}

export async function deleteTransaction(id: number) {
  const ds = await getDataSource();
  const repo = ds.getRepository(Transaction);

  const transaction = await repo.findOne({ where: { id } });
  if (!transaction) throw new Error("العملية غير موجودة");

  await repo.remove(transaction);
  return { success: true };
}