import "reflect-metadata";
import { DataSource } from "typeorm";
import { FinancialEntity } from "./entities/FinancialEntity";
import { Category } from "./entities/Category";
import { Transaction } from "./entities/Transaction";
import { ExchangeRate } from "./entities/ExchangeRate";
import { Transfer } from "./entities/Transfer";

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mini_acc_db",
  synchronize: true,
  logging: false,
  entities: [FinancialEntity, Category, Transaction, ExchangeRate, Transfer],
  charset: "utf8mb4",
});

let initialized = false;
let initPromise: Promise<DataSource> | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (initialized) return AppDataSource;
  if (!initPromise) {
    initPromise = AppDataSource.initialize().then((ds) => {
      initialized = true;
      return ds;
    });
  }
  return initPromise;
}

export default AppDataSource;