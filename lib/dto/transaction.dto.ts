import { TransactionType, Currency } from "../db/entities/Transaction";

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  currency: Currency;
  date: string;
  description?: string;
  entityId: number;
  categoryId?: number;
}

export interface UpdateTransactionDto {
  amount?: number;
  date?: string;
  description?: string;
  categoryId?: number;
}