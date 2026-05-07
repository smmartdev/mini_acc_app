import { getDataSource } from "../db/datasource";
import { ExchangeRate } from "../db/entities/ExchangeRate";

const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  JOD: 1.41,
  ILS: 0.27,
};

// جلب كل أسعار الصرف
export async function getAllRates(): Promise<Record<string, number>> {
  const ds = await getDataSource();
  const repo = ds.getRepository(ExchangeRate);

  const rows = await repo.find();

  // ابدأ بالأسعار الافتراضية ثم استبدلها بالمحفوظة
  const result: Record<string, number> = { ...DEFAULT_RATES };
  for (const row of rows) {
    result[row.currency] = Number(row.rate);
  }

  return result;
}

// تحديث أو إنشاء سعر صرف لعملة معينة
export async function upsertRate(currency: string, rate: number): Promise<ExchangeRate> {
  const ds = await getDataSource();
  const repo = ds.getRepository(ExchangeRate);

  let existing = await repo.findOne({ where: { currency } });

  if (existing) {
    existing.rate = rate;
    return await repo.save(existing);
  } else {
    const newRate = repo.create({ currency, rate });
    return await repo.save(newRate);
  }
}