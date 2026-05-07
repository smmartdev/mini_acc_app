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

@Entity("transfers")
@Index(["date"])
@Index(["fromEntityId"])
@Index(["toEntityId"])
export class Transfer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fromEntityId!: number;

  @Column()
  toEntityId!: number;

  // المبلغ المخصوم من الجهة المصدر بعملتها
  @Column({ type: "decimal", precision: 15, scale: 2 })
  fromAmount!: number;

  @Column({ type: "varchar", length: 10 })
  fromCurrency!: string;

  // المبلغ المضاف إلى الجهة الهدف بعملتها
  @Column({ type: "decimal", precision: 15, scale: 2 })
  toAmount!: number;

  @Column({ type: "varchar", length: 10 })
  toCurrency!: string;

  // سعر الصرف (1 إذا نفس العملة)
  @Column({ type: "decimal", precision: 10, scale: 6, default: 1 })
  exchangeRate!: number;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @ManyToOne(() => FinancialEntity, { eager: false })
  @JoinColumn({ name: "fromEntityId" })
  fromEntity!: FinancialEntity;

  @ManyToOne(() => FinancialEntity, { eager: false })
  @JoinColumn({ name: "toEntityId" })
  toEntity!: FinancialEntity;

  @CreateDateColumn()
  createdAt!: Date;
}