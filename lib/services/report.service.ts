import { getDataSource } from "../db/datasource";
import { Transaction, TransactionType, Currency } from "../db/entities/Transaction";
import { Transfer } from "../db/entities/Transfer";

interface CurrencyTotals { USD: number; ILS: number; }

interface AggregatedEntry {
  categoryName: string;
  totalUSD: number;
  totalILS: number;
  transactions: ReturnType<typeof formatTransaction>[];
}

export async function getMonthlyReport(month: string, entityId?: number) {
  const ds = await getDataSource();
  const txRepo = ds.getRepository(Transaction);

  const startDate = `${month}-01`;
  const endDate = getLastDayOfMonth(month);

  // ===== الرصيد المرحل (كل ما قبل هذا الشهر) =====
  const prevTxQuery = txRepo
    .createQueryBuilder("t")
    .where("t.date < :startDate", { startDate });
  if (entityId) prevTxQuery.andWhere("t.entityId = :entityId", { entityId });
  const prevTx = await prevTxQuery.getMany();

  const prevTxBalance = calcTotals(
    prevTx.filter(t => t.type === TransactionType.INCOME),
    prevTx.filter(t => t.type === TransactionType.EXPENSE)
  );

  const prevTransferBalance = await calcTransferBalance(entityId, undefined, startDate);

  const carriedBalance: CurrencyTotals = {
    USD: round(prevTxBalance.USD + prevTransferBalance.USD),
    ILS: round(prevTxBalance.ILS + prevTransferBalance.ILS),
  };

  // ===== عمليات الشهر الحالي =====
  const txQuery = txRepo
    .createQueryBuilder("t")
    .leftJoinAndSelect("t.entity", "entity")
    .leftJoinAndSelect("t.category", "category")
    .where("t.date >= :startDate AND t.date <= :endDate", { startDate, endDate });
  if (entityId) txQuery.andWhere("t.entityId = :entityId", { entityId });

  const allTx = await txQuery.orderBy("t.date", "ASC").getMany();

  const incomeList = allTx.filter(t => t.type === TransactionType.INCOME);
  const expenseList = allTx.filter(t => t.type === TransactionType.EXPENSE);

  const incomeTotals = sumByCurrency(incomeList);
  const expenseTotals = sumByCurrency(expenseList);

  // ===== التحويلات في هذا الشهر =====
  const monthTransferBalance = await calcTransferBalance(entityId, startDate, endDate);
  const monthTransferDetails = await getMonthTransferDetails(entityId, startDate, endDate);

  // ===== صافي الشهر والرصيد الختامي =====
  const monthNetBalance: CurrencyTotals = {
    USD: round(incomeTotals.USD - expenseTotals.USD + monthTransferBalance.USD),
    ILS: round(incomeTotals.ILS - expenseTotals.ILS + monthTransferBalance.ILS),
  };

  const closingBalance: CurrencyTotals = {
    USD: round(carriedBalance.USD + monthNetBalance.USD),
    ILS: round(carriedBalance.ILS + monthNetBalance.ILS),
  };

  // ===== تجميع الفئات المجمّعة =====
  const nonAggregated = expenseList.filter(t => !t.category?.isAggregated);
  const aggregated = expenseList.filter(t => t.category?.isAggregated);

  const aggregatedMap = new Map<number, AggregatedEntry>();

  for (const t of aggregated) {
    if (!t.categoryId || !t.category) continue;
    const amt = Number(t.amount);
    const isILS = t.currency === Currency.ILS;
    const existing = aggregatedMap.get(t.categoryId);

    if (existing) {
      if (isILS) existing.totalILS += amt;
      else existing.totalUSD += amt;
      existing.transactions.push(formatTransaction(t));
    } else {
      aggregatedMap.set(t.categoryId, {
        categoryName: t.category.name,
        totalUSD: isILS ? 0 : amt,
        totalILS: isILS ? amt : 0,
        transactions: [formatTransaction(t)],
      });
    }
  }

  return {
    month,
    carriedBalance,
    income: {
      totals: incomeTotals,
      transactions: incomeList.map(formatTransaction),
    },
    expense: {
      totals: expenseTotals,
      nonAggregated: nonAggregated.map(formatTransaction),
      aggregated: Array.from(aggregatedMap.values()).map(item => ({
        categoryName: item.categoryName,
        totalUSD: round(item.totalUSD),
        totalILS: round(item.totalILS),
        transactions: item.transactions,
      })),
    },
    transfers: {
      netBalance: monthTransferBalance,
      details: monthTransferDetails,
    },
    monthNetBalance,
    closingBalance,
  };
}

// ===== حساب صافي التحويلات =====
async function calcTransferBalance(
  entityId: number | undefined,
  fromDate: string | undefined,
  toDate: string | undefined
): Promise<CurrencyTotals> {
  const ds = await getDataSource();

  let inQuery = `SELECT COALESCE(SUM(toAmount), 0) AS total, toCurrency AS currency
                 FROM transfers WHERE 1=1`;
  let outQuery = `SELECT COALESCE(SUM(fromAmount), 0) AS total, fromCurrency AS currency
                  FROM transfers WHERE 1=1`;
  const inParams: unknown[] = [];
  const outParams: unknown[] = [];

  if (entityId) {
    inQuery += " AND toEntityId = ?";
    outQuery += " AND fromEntityId = ?";
    inParams.push(entityId);
    outParams.push(entityId);
  }

  if (fromDate) {
    inQuery += " AND date >= ?";
    outQuery += " AND date >= ?";
    inParams.push(fromDate);
    outParams.push(fromDate);
  }

  if (toDate) {
    inQuery += " AND date < ?";
    outQuery += " AND date < ?";
    inParams.push(toDate);
    outParams.push(toDate);
  }

  inQuery += " GROUP BY toCurrency";
  outQuery += " GROUP BY fromCurrency";

  const inRows: { total: string; currency: string }[] = await ds.query(inQuery, inParams);
  const outRows: { total: string; currency: string }[] = await ds.query(outQuery, outParams);

  const inUSD = Number(inRows.find(r => r.currency === "USD")?.total ?? 0);
  const inILS = Number(inRows.find(r => r.currency === "ILS")?.total ?? 0);
  const outUSD = Number(outRows.find(r => r.currency === "USD")?.total ?? 0);
  const outILS = Number(outRows.find(r => r.currency === "ILS")?.total ?? 0);

  return {
    USD: round(inUSD - outUSD),
    ILS: round(inILS - outILS),
  };
}

// ===== تفاصيل التحويلات في الشهر =====
async function getMonthTransferDetails(
  entityId: number | undefined,
  startDate: string,
  endDate: string
) {
  const ds = await getDataSource();
  const trRepo = ds.getRepository(Transfer);

  const query = trRepo
    .createQueryBuilder("tr")
    .leftJoinAndSelect("tr.fromEntity", "fromEntity")
    .leftJoinAndSelect("tr.toEntity", "toEntity")
    .where("tr.date >= :startDate AND tr.date <= :endDate", { startDate, endDate });

  if (entityId) {
    query.andWhere(
      "(tr.fromEntityId = :entityId OR tr.toEntityId = :entityId)",
      { entityId }
    );
  }

  const transfers = await query.orderBy("tr.date", "ASC").getMany();

  return transfers.map(tr => ({
    id: tr.id,
    date: tr.date,
    fromEntityName: tr.fromEntity?.name ?? "",
    toEntityName: tr.toEntity?.name ?? "",
    fromAmount: Number(tr.fromAmount),
    fromCurrency: tr.fromCurrency,
    toAmount: Number(tr.toAmount),
    toCurrency: tr.toCurrency,
    exchangeRate: Number(tr.exchangeRate),
    description: tr.description,
  }));
}

// ===== دوال مساعدة =====
function sumByCurrency(txs: Transaction[]): CurrencyTotals {
  let USD = 0; let ILS = 0;
  for (const t of txs) {
    if (t.currency === Currency.ILS) ILS += Number(t.amount);
    else USD += Number(t.amount);
  }
  return { USD: round(USD), ILS: round(ILS) };
}

function calcTotals(income: Transaction[], expense: Transaction[]): CurrencyTotals {
  const inc = sumByCurrency(income);
  const exp = sumByCurrency(expense);
  return { USD: round(inc.USD - exp.USD), ILS: round(inc.ILS - exp.ILS) };
}

function round(n: number) { return Math.round(n * 100) / 100; }

function getLastDayOfMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(year, m, 0).getDate()).padStart(2, "0")}`;
}

function formatTransaction(t: Transaction) {
  return {
    id: t.id,
    amount: Number(t.amount),
    currency: t.currency,
    date: t.date,
    description: t.description,
    entityName: t.entity?.name ?? "",
    categoryName: t.category?.name ?? null,
  };
}