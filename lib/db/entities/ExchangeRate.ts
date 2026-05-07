import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from "typeorm";

@Entity("exchange_rates")
export class ExchangeRate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 10, unique: true })
  currency!: string;

  @Column({ type: "decimal", precision: 10, scale: 6 })
  rate!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}