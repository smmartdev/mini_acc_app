import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { FinancialEntity } from "./FinancialEntity";
import { Category } from "./Category";

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum Currency {
  USD = "USD",
  ILS = "ILS",
}

@Entity("transactions")
@Index(["date"])
@Index(["entityId"])
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: TransactionType })
  type!: TransactionType;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: "enum", enum: Currency })
  currency!: Currency;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column()
  entityId!: number;

  @Column({ nullable: true })
  categoryId!: number | null;

  @ManyToOne(() => FinancialEntity, { eager: false })
  @JoinColumn({ name: "entityId" })
  entity!: FinancialEntity;

  @ManyToOne(() => Category, { nullable: true, eager: false })
  @JoinColumn({ name: "categoryId" })
  category!: Category | null;

  @CreateDateColumn()
  createdAt!: Date;
}