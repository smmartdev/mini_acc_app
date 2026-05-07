import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export enum EntityCurrency {
  USD = "USD",
  ILS = "ILS",
}

@Entity("financial_entities")
export class FinancialEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({
    type: "enum",
    enum: EntityCurrency,
    default: EntityCurrency.USD,
  })
  currency!: EntityCurrency;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}