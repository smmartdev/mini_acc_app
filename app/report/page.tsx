"use client";

import { Fragment, useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";

interface Entity { id: number; name: string; }
interface TxRow {
  id: number; amount: number; currency: string; date: string;
  description: string | null; entityName: string; categoryName: string | null;
}
interface AggRow {
  categoryName: string; totalUSD: number; totalILS: number;
  transactions?: TxRow[];
}
interface CurrencyTotals { USD: number; ILS: number; }
interface TransferRow {
  id: number; date: string;
  fromEntityName: string; toEntityName: string;
  fromAmount: number; fromCurrency: string;
  toAmount: number; toCurrency: string;
  exchangeRate: number; description: string | null;
}
interface Report {
  month: string;
  carriedBalance: CurrencyTotals;
  income: { totals: CurrencyTotals; transactions: TxRow[] };
  expense: { totals: CurrencyTotals; nonAggregated: TxRow[]; aggregated: AggRow[] };
  transfers: { netBalance: CurrencyTotals; details: TransferRow[] };
  monthNetBalance: CurrencyTotals;
  closingBalance: CurrencyTotals;
}

const SYMBOL: Record<string, string> = { USD: "$", ILS: "₪" };

function fmt(n: number) {
  return Number(n).toLocaleString("ar-SA", { minimumFractionDigits: 2 });
}

function CurrencyCard({ label, usd, ils, colorRule = "sign", highlight = false }: {
  label: string; usd: number; ils: number;
  colorRule?: "sign" | "positive" | "negative";
  highlight?: boolean;
}) {
  const usdColor = colorRule === "positive" ? "var(--success)"
    : colorRule === "negative" ? "var(--danger)"
      : usd >= 0 ? "var(--success)" : "var(--danger)";
  const ilsColor = colorRule === "positive" ? "#7c3aed"
    : colorRule === "negative" ? "var(--danger)"
      : ils >= 0 ? "#7c3aed" : "var(--danger)";
  return (
    <div className="stat-card" style={highlight ? { border: "2px solid var(--primary)", background: "#eff6ff" } : {}}>
      <div className="stat-label">{label}</div>
      <div style={{ color: usdColor, fontWeight: 700, fontSize: "1.05rem" }}>{fmt(usd)} $</div>
      <div style={{ color: ilsColor, fontWeight: 700, fontSize: "0.95rem", marginTop: "0.2rem" }}>{fmt(ils)} ₪</div>
    </div>
  );
}

export default function ReportPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [entityId, setEntityId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedAgg, setExpandedAgg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/entities").then(r => r.json()).then(j => {
      if (j.success) setEntities(j.data);
    });
  }, []);

  async function fetchReport() {
    setLoading(true); setError(""); setReport(null); setExpandedAgg(null);
    try {
      const params = new URLSearchParams({ month });
      if (entityId) params.append("entityId", entityId);
      const res = await fetch(`/api/report?${params}`);
      const json = await res.json();
      if (json.success) setReport(json.data);
      else setError(json.message);
    } catch { setError("حدث خطأ في الاتصال"); }
    setLoading(false);
  }

  // ===== تصدير Excel — ورقة واحدة بنفس ترتيب التقرير =====
 function exportToExcel() {
    if (!report) return;

    type CellStyle = {
      font?: { bold?: boolean; color?: { rgb: string }; sz?: number; name?: string };
      fill?: { patternType?: string; fgColor: { rgb: string } };
      alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean; readingOrder?: number };
      border?: {
        top?: { style: string; color: { rgb: string } };
        bottom?: { style: string; color: { rgb: string } };
        left?: { style: string; color: { rgb: string } };
        right?: { style: string; color: { rgb: string } };
      };
    };

    type Cell = { v: string | number; t: "s" | "n"; s: CellStyle };

    const COLOR = {
      headerBg:     "1A56DB",
      incomeGreen:  "057A55",
      expenseRed:   "C81E1E",
      transferBlue: "1E3A5F",
      subHeaderBg:  "D1D5DB",
      summaryBg:    "F0FDF4",
      aggBg:        "FEF9C3",
      aggSubBg:     "FFFDE7",
      transferBg:   "EFF6FF",
      totalIncome:  "DCFCE7",
      totalExpense: "FEE2E2",
      totalTransfer:"DBEAFE",
      closingBg:    "BFDBFE",
      white:        "FFFFFF",
      black:        "111827",
      muted:        "6B7280",
      green:        "166534",
      red:          "991B1B",
      purple:       "6D28D9",
      blue:         "1E40AF",
      amber:        "92400E",
    };

    const FONT = "Arial";
    const CENTER: CellStyle["alignment"] = { horizontal: "center", vertical: "center", readingOrder: 2 };
    const RIGHT: CellStyle["alignment"]  = { horizontal: "right",  vertical: "center", readingOrder: 2 };

    const thinBorder = (color = "D1D5DB") => ({
      top:    { style: "thin", color: { rgb: color } },
      bottom: { style: "thin", color: { rgb: color } },
      left:   { style: "thin", color: { rgb: color } },
      right:  { style: "thin", color: { rgb: color } },
    });

function cell(v: string | number | null, s: CellStyle = {}): Cell {
      const val = v === null ? "" : v;
      return {
        v: val,
        t: typeof val === "number" ? "n" : "s",
        s: {
          font: { name: FONT, sz: 10, ...s.font },
          alignment: { ...CENTER, ...s.alignment },
          border: s.border ?? thinBorder(),
          ...(s.fill ? { fill: { patternType: "solid", ...s.fill } } : {}),
          numFmt: typeof val === "number" ? '#,##0.00' : undefined,
        } as CellStyle,
      };
    }

    // خلية عنوان قسم
    function hCell(v: string, bgColor: string, cols = 7): Cell[] {
      const base: CellStyle = {
        font: { name: FONT, bold: true, sz: 12, color: { rgb: COLOR.white } },
        fill: { patternType: "solid", fgColor: { rgb: bgColor } },
        alignment: CENTER,
        border: thinBorder(bgColor),
      };
      return Array.from({ length: cols }, (_, i) => ({
        v: i === 0 ? v : "",
        t: "s" as const,
        s: base,
      }));
    }

    // خلية رأس جدول
    function thCell(v: string): Cell {
      return cell(v, {
        font: { name: FONT, bold: true, sz: 10, color: { rgb: COLOR.black } },
        fill: { fgColor: { rgb: COLOR.subHeaderBg } },
        border: thinBorder("9CA3AF"),
      });
    }

    // خلية بيانات عادية
    function td(v: string | number | null, color = COLOR.black, bg?: string, bold = false): Cell {
      return cell(v, {
        font: { name: FONT, sz: 10, color: { rgb: color }, bold },
        ...(bg ? { fill: { fgColor: { rgb: bg } } } : {}),
      });
    }

    // خلية إجمالي
    function totCell(v: string | number | null, color = COLOR.black, bg = COLOR.subHeaderBg): Cell {
      return cell(v, {
        font: { name: FONT, bold: true, sz: 10, color: { rgb: color } },
        fill: { fgColor: { rgb: bg } },
        border: thinBorder("9CA3AF"),
      });
    }

    // صف فارغ
    function emptyRow(cols = 7): Cell[] {
      return Array.from({ length: cols }, () => ({
        v: "", t: "s" as const,
        s: { font: { name: FONT }, border: {} },
      }));
    }

    const rows: Cell[][] = [];
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

    function addMerge(r: number, c1: number, c2: number) {
      merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });
    }

    // ========== عنوان التقرير ==========
    rows.push([
      cell(`التقرير الشهري — ${report.month}`, {
        font: { name: FONT, bold: true, sz: 16, color: { rgb: COLOR.headerBg } },
        alignment: RIGHT,
        border: {},
      }),
      ...Array(6).fill({ v: "", t: "s", s: { border: {} } }),
    ]);
    addMerge(rows.length - 1, 0, 6);

    if (entityId) {
      const en = entities.find(e => String(e.id) === entityId);
      if (en) {
        rows.push([
          cell(`الجهة: ${en.name}`, {
            font: { name: FONT, sz: 11, color: { rgb: COLOR.muted } },
            alignment: RIGHT, border: {},
          }),
          ...Array(6).fill({ v: "", t: "s", s: { border: {} } }),
        ]);
        addMerge(rows.length - 1, 0, 6);
      }
    }

    rows.push(emptyRow());

    // ========== الملخص ==========
    rows.push(hCell("الملخص", COLOR.headerBg, 3));
    addMerge(rows.length - 1, 0, 2);

    rows.push([thCell("البند"), thCell("بالدولار ($)"), thCell("بالشيكل (₪)")]);

    const summaryItems = [
      { label: "الرصيد المرحل",     usd: report.carriedBalance.USD,        ils: report.carriedBalance.ILS,        closing: false },
      { label: "إجمالي الواردات",   usd: report.income.totals.USD,         ils: report.income.totals.ILS,         closing: false },
      { label: "إجمالي المصروفات",  usd: report.expense.totals.USD,        ils: report.expense.totals.ILS,        closing: false },
      { label: "صافي التحويلات",    usd: report.transfers.netBalance.USD,  ils: report.transfers.netBalance.ILS,  closing: false },
      { label: "الرصيد الختامي",    usd: report.closingBalance.USD,        ils: report.closingBalance.ILS,        closing: true  },
    ];

    summaryItems.forEach(item => {
      const bg = item.closing ? COLOR.closingBg : COLOR.white;
      rows.push([
        td(item.label, COLOR.black, bg, item.closing),
        td(item.usd,   item.usd >= 0 ? COLOR.green  : COLOR.red, bg, item.closing),
        td(item.ils,   item.ils >= 0 ? COLOR.purple : COLOR.red, bg, item.closing),
      ]);
    });

    rows.push(emptyRow());

    // ========== الواردات (5 أعمدة) ==========
    rows.push(hCell("📥 الواردات", COLOR.incomeGreen, 5));
    addMerge(rows.length - 1, 0, 4);

    rows.push([
      thCell("التاريخ"), thCell("الجهة"),
      thCell("بالدولار ($)"), thCell("بالشيكل (₪)"), thCell("الوصف"),
    ]);

    if (report.income.transactions.length === 0) {
      rows.push([td("لا توجد واردات هذا الشهر", COLOR.muted), td(""), td(""), td(""), td("")]);
      addMerge(rows.length - 1, 0, 4);
    } else {
      report.income.transactions.forEach(t => {
        rows.push([
          td(t.date),
          td(t.entityName),
          t.currency === "USD" ? td(t.amount, COLOR.green)  : td("—", COLOR.muted),
          t.currency === "ILS" ? td(t.amount, COLOR.purple) : td("—", COLOR.muted),
          td(t.description ?? ""),
        ]);
      });

      const incTotalRow = rows.length;
      rows.push([
        totCell("الإجمالي",                                    COLOR.black,  COLOR.totalIncome),
        totCell("",                                             COLOR.black,  COLOR.totalIncome),
        totCell(report.income.totals.USD,  COLOR.green,  COLOR.totalIncome),
        totCell(report.income.totals.ILS,  COLOR.purple, COLOR.totalIncome),
        totCell("",                                             COLOR.black,  COLOR.totalIncome),
      ]);
      addMerge(incTotalRow, 0, 1);
    }

    rows.push(emptyRow());

    // ========== المصروفات (6 أعمدة) ==========
    rows.push(hCell("📤 المصروفات", COLOR.expenseRed, 6));
    addMerge(rows.length - 1, 0, 5);

    rows.push([
      thCell("التاريخ"), thCell("الجهة"), thCell("الفئة"),
      thCell("بالدولار ($)"), thCell("بالشيكل (₪)"), thCell("الوصف"),
    ]);

    // التفصيلية
    report.expense.nonAggregated.forEach(t => {
      rows.push([
        td(t.date),
        td(t.entityName),
        td(t.categoryName ?? ""),
        t.currency === "USD" ? td(t.amount, COLOR.red)  : td("—", COLOR.muted),
        t.currency === "ILS" ? td(t.amount, COLOR.red)  : td("—", COLOR.muted),
        td(t.description ?? ""),
      ]);
    });

    // المجمّعة
    report.expense.aggregated.forEach(a => {
 
      rows.push([
        td("مجمّعة",     COLOR.amber,  COLOR.aggBg, true),
        td("",           COLOR.black,  COLOR.aggBg),
        td(a.categoryName, COLOR.black, COLOR.aggBg, true),
        a.totalUSD > 0 ? td(a.totalUSD, COLOR.red, COLOR.aggBg, true) : td("—", COLOR.muted, COLOR.aggBg),
        a.totalILS > 0 ? td(a.totalILS, COLOR.red, COLOR.aggBg, true) : td("—", COLOR.muted, COLOR.aggBg),
        td("",           COLOR.black,  COLOR.aggBg),
      ]);
    });

    const expTotalRow = rows.length;
    rows.push([
      totCell("الإجمالي", COLOR.black, COLOR.totalExpense),
      totCell("",         COLOR.black, COLOR.totalExpense),
      totCell("",         COLOR.black, COLOR.totalExpense),
      totCell(report.expense.totals.USD, COLOR.red, COLOR.totalExpense),
      totCell(report.expense.totals.ILS, COLOR.red, COLOR.totalExpense),
      totCell("",         COLOR.black, COLOR.totalExpense),
    ]);
    addMerge(expTotalRow, 0, 2);

    rows.push(emptyRow());

    // ========== التحويلات (7 أعمدة) ==========
    if (report.transfers.details.length > 0) {
      rows.push(hCell("🔄 التحويلات", COLOR.transferBlue, 7));
      addMerge(rows.length - 1, 0, 6);

      rows.push([
        thCell("التاريخ"), thCell("من"),    thCell("المحول"),
        thCell("إلى"),     thCell("المستلم"), thCell("سعر الصرف"), thCell("الوصف"),
      ]);

      report.transfers.details.forEach(tr => {
        rows.push([
          td(tr.date,                                                          COLOR.black, COLOR.transferBg),
          td(tr.fromEntityName,                                                COLOR.black, COLOR.transferBg),
          td(`${tr.fromAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${SYMBOL[tr.fromCurrency]}`, COLOR.red, COLOR.transferBg, true),
          td(tr.toEntityName,                                                  COLOR.black, COLOR.transferBg),
          td(`${tr.toAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${SYMBOL[tr.toCurrency]}`, COLOR.green, COLOR.transferBg, true),
          td(tr.fromCurrency !== tr.toCurrency ? String(tr.exchangeRate) : "—", COLOR.blue, COLOR.transferBg),
          td(tr.description ?? "",                                             COLOR.black, COLOR.transferBg),
        ]);
      });

      const trTotalRow = rows.length;
      rows.push([
        totCell("صافي التحويلات", COLOR.black, COLOR.totalTransfer),
        totCell("",               COLOR.black, COLOR.totalTransfer),
        totCell(report.transfers.netBalance.USD, report.transfers.netBalance.USD >= 0 ? COLOR.green  : COLOR.red,   COLOR.totalTransfer),
        totCell("",               COLOR.black, COLOR.totalTransfer),
        totCell(report.transfers.netBalance.ILS, report.transfers.netBalance.ILS >= 0 ? COLOR.purple : COLOR.red,   COLOR.totalTransfer),
        totCell("",               COLOR.black, COLOR.totalTransfer),
        totCell("",               COLOR.black, COLOR.totalTransfer),
      ]);
      addMerge(trTotalRow, 0, 1);

      rows.push(emptyRow());
    }


    // ========== بناء الـ Worksheet ==========
    const ws: XLSX.WorkSheet = {};

    rows.forEach((row, r) => {
      row.forEach((c, col) => {
        if (!c) return;
        const addr = XLSX.utils.encode_cell({ r, c: col });
        ws[addr] = c;
      });
    });

    ws["!ref"]    = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: 6 } });
    ws["!merges"] = merges;
    ws["!cols"]   = [
      { wch: 14 }, { wch: 22 }, { wch: 20 },
      { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 30 },
    ];
    ws["!rows"] = rows.map(() => ({ hpt: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "التقرير");

    const fileName = `تقرير_${report.month}${entityId ? `_جهة${entityId}` : ""}.xlsx`;

    // كتابة الـ workbook كـ ArrayBuffer ثم تعديل XML لدعم RTL
    const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    import("jszip").then(({ default: JSZip }) => {
      JSZip.loadAsync(wbOut).then(zip => {
        const sheetFile = zip.file("xl/worksheets/sheet1.xml");
        if (sheetFile) {
          sheetFile.async("string").then(xml => {
            let updatedXml = xml;
            if (updatedXml.includes("<sheetView ")) {
              updatedXml = updatedXml.replace(/<sheetView /, '<sheetView rightToLeft="1" ');
            } else if (updatedXml.includes("<sheetViews>")) {
              updatedXml = updatedXml.replace(
                "<sheetViews>",
                '<sheetViews><sheetView rightToLeft="1" workbookViewId="0"/>'
              );
            } else {
              updatedXml = updatedXml.replace(
                "<sheetData>",
                '<sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews><sheetData>'
              );
            }
            zip.file("xl/worksheets/sheet1.xml", updatedXml);
            zip.generateAsync({
              type: "blob",
              mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }).then(blob => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = fileName;
              a.click();
              URL.revokeObjectURL(url);
            });
          });
        }
      });
    });
  }

  // ===== بناء صفوف المصروفات الموحدة =====
  function buildExpenseRows(report: Report) {
    type ExpenseRow = {
      key: string; date: string; entityName: string; categoryName: string;
      amount: number; currency: string; description: string | null;
      isAggregated: boolean; aggTotalUSD?: number; aggTotalILS?: number;
      aggTransactions?: TxRow[];
    };

    const rows: ExpenseRow[] = [];

    report.expense.nonAggregated.forEach(t => {
      rows.push({
        key: `tx-${t.id}`, date: t.date, entityName: t.entityName,
        categoryName: t.categoryName ?? "—", amount: t.amount,
        currency: t.currency, description: t.description, isAggregated: false,
      });
    });

    report.expense.aggregated.forEach(a => {
      rows.push({
        key: `agg-${a.categoryName}`, date: "—", entityName: "—",
        categoryName: a.categoryName, amount: 0, currency: "", description: null,
        isAggregated: true, aggTotalUSD: a.totalUSD, aggTotalILS: a.totalILS,
        aggTransactions: a.transactions,
      });
    });

    return rows;
  }

  const hasTransfers = report && report.transfers.details.length > 0;

  return (
    <div className="container">
      <h1 className="page-title">التقرير الشهري</h1>

      {/* فلاتر */}
      <div className="card">
        <div className="card-title">فلاتر التقرير</div>
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">الشهر *</label>
            <input type="month" className="form-control" value={month}
              onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">الجهة المالية (اختياري)</label>
            <select className="form-control" value={entityId}
              onChange={e => setEntityId(e.target.value)}>
              <option value="">كل الجهات</option>
              {entities.map(en => (
                <option key={en.id} value={en.id}>{en.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
            <button className="btn btn-primary" onClick={fetchReport}
              disabled={loading} style={{ flex: 1 }}>
              {loading ? "جاري التحميل..." : "📊 عرض التقرير"}
            </button>
            <button className="btn btn-outline" onClick={exportToExcel}
              disabled={!report || loading}
              title={!report ? "اعرض التقرير أولاً" : "تصدير إلى Excel"}
              style={{ whiteSpace: "nowrap" }}>
              📥 Excel
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {report && (
        <>
          {/* ===== الصناديق الخمسة ===== */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}>
            <CurrencyCard label="الرصيد المرحل"
              usd={report.carriedBalance.USD} ils={report.carriedBalance.ILS} />
            <CurrencyCard label="إجمالي الواردات" colorRule="positive"
              usd={report.income.totals.USD} ils={report.income.totals.ILS} />
            <CurrencyCard label="إجمالي المصروفات" colorRule="negative"
              usd={report.expense.totals.USD} ils={report.expense.totals.ILS} />
            <CurrencyCard label="صافي التحويلات"
              usd={report.transfers.netBalance.USD} ils={report.transfers.netBalance.ILS} />
            <CurrencyCard label="الرصيد الختامي" highlight
              usd={report.closingBalance.USD} ils={report.closingBalance.ILS} />
          </div>

          {/* ===== الواردات ===== */}
          <div className="card">
            <div className="card-title">
              📥 الواردات —{" "}
              <span style={{ color: "var(--success)" }}>{fmt(report.income.totals.USD)} $</span>
              {" | "}
              <span style={{ color: "#7c3aed" }}>{fmt(report.income.totals.ILS)} ₪</span>
            </div>
            {report.income.transactions.length === 0 ? (
              <div className="empty-state"><p>لا توجد واردات هذا الشهر</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th><th>الجهة</th>
                      <th>بالدولار</th><th>بالشيكل</th><th>الوصف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.income.transactions.map(t => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td>{t.entityName}</td>
                        <td>{t.currency === "USD"
                          ? <span style={{ color: "var(--success)", fontWeight: 600 }}>{fmt(t.amount)} $</span>
                          : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>
                        <td>{t.currency === "ILS"
                          ? <span style={{ color: "#7c3aed", fontWeight: 600 }}>{fmt(t.amount)} ₪</span>
                          : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>
                        <td>{t.description ?? "—"}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f0fdf4", fontWeight: 700 }}>
                      <td colSpan={2}>الإجمالي</td>
                      <td>{fmt(report.income.totals.USD)} $</td>
                      <td>{fmt(report.income.totals.ILS)} ₪</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ===== المصروفات (تفصيلية + مجمّعة في جدول واحد) ===== */}
          {(report.expense.nonAggregated.length > 0 || report.expense.aggregated.length > 0) && (
            <div className="card">
              <div className="card-title">
                📤 المصروفات —{" "}
                <span style={{ color: "var(--danger)" }}>{fmt(report.expense.totals.USD)} $</span>
                {" | "}
                <span style={{ color: "var(--danger)" }}>{fmt(report.expense.totals.ILS)} ₪</span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th><th>الجهة</th><th>الفئة</th>
                      <th>بالدولار</th><th>بالشيكل</th><th>الوصف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildExpenseRows(report).map(row => (
                      <Fragment key={row.key}>

                        <tr
                          key={row.key}
                          style={row.isAggregated ? { background: "#fffbeb", cursor: "pointer" } : {}}
                          onClick={row.isAggregated
                            ? () => setExpandedAgg(expandedAgg === row.key ? null : row.key)
                            : undefined}
                        >
                          <td>{row.date}</td>
                          <td>{row.entityName}</td>
                          <td>
                            {row.categoryName}
                            {row.isAggregated && (
                              <span style={{ marginRight: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {expandedAgg === row.key ? "▲" : "▼"}
                              </span>
                            )}
                          </td>
                          {row.isAggregated ? (
                            <>
                              <td>{(row.aggTotalUSD ?? 0) > 0
                                ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{fmt(row.aggTotalUSD!)} $</span>
                                : <span style={{ color: "var(--text-muted)" }}>—</span>}
                              </td>
                              <td>{(row.aggTotalILS ?? 0) > 0
                                ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{fmt(row.aggTotalILS!)} ₪</span>
                                : <span style={{ color: "var(--text-muted)" }}>—</span>}
                              </td>
                              <td>{row.description ?? "—"}</td>
                            </>
                          ) : (
                            <>
                              <td>{row.currency === "USD"
                                ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{fmt(row.amount)} $</span>
                                : <span style={{ color: "var(--text-muted)" }}>—</span>}
                              </td>
                              <td>{row.currency === "ILS"
                                ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{fmt(row.amount)} ₪</span>
                                : <span style={{ color: "var(--text-muted)" }}>—</span>}
                              </td>
                              <td>{row.description ?? "—"}</td>
                            </>
                          )}
                        </tr>

                        {/* سطور التفاصيل المنبثقة */}
                        {row.isAggregated && expandedAgg === row.key && (
                          row.aggTransactions && row.aggTransactions.length > 0
                            ? row.aggTransactions.map((sub, i) => (
                              <tr key={`${row.key}-sub-${i}`} style={{
                                background: "#fffdf0",
                                borderRight: "3px solid #f59e0b",
                                userSelect: "none",
                              }}>
                                <td style={{ paddingRight: "1.5rem", fontSize: "0.85rem" }}>{sub.date}</td>
                                <td style={{ fontSize: "0.85rem" }}>{sub.entityName}</td>
                                <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>↳ {sub.categoryName}</td>
                                <td style={{ fontSize: "0.85rem" }}>
                                  {sub.currency === "USD"
                                    ? <span style={{ color: "var(--danger)" }}>{fmt(sub.amount)} $</span>
                                    : "—"}
                                </td>
                                <td style={{ fontSize: "0.85rem" }}>
                                  {sub.currency === "ILS"
                                    ? <span style={{ color: "var(--danger)" }}>{fmt(sub.amount)} ₪</span>
                                    : "—"}
                                </td>
                                <td style={{ fontSize: "0.85rem" }}>{sub.description ?? "—"}</td>
                              </tr>
                            ))
                            : (
                              <tr style={{ background: "#fffdf0", userSelect: "none" }}>
                                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                  لا تتوفر تفاصيل إضافية
                                </td>
                              </tr>
                            )
                        )}
                      </Fragment>
                    ))}
                    <tr style={{ background: "#fef2f2", fontWeight: 700 }}>
                      <td colSpan={3}>الإجمالي</td>
                      <td>{fmt(report.expense.totals.USD)} $</td>
                      <td>{fmt(report.expense.totals.ILS)} ₪</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== التحويلات ===== */}
          {hasTransfers && (
            <div className="card">
              <div className="card-title">
                🔄 التحويلات —{" "}
                <span style={{ color: report.transfers.netBalance.USD >= 0 ? "var(--success)" : "var(--danger)" }}>
                  صافي دولار: {fmt(report.transfers.netBalance.USD)} $
                </span>
                {" | "}
                <span style={{ color: report.transfers.netBalance.ILS >= 0 ? "#7c3aed" : "var(--danger)" }}>
                  صافي شيكل: {fmt(report.transfers.netBalance.ILS)} ₪
                </span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>من</th><th>المحول</th>
                      <th>إلى</th><th>المستلم</th>
                      <th>سعر الصرف</th><th>الوصف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transfers.details.map(tr => (
                      <tr key={tr.id}>
                        <td>{tr.date}</td>
                        <td><strong>{tr.fromEntityName}</strong></td>
                        <td><span style={{ color: "var(--danger)", fontWeight: 600 }}>
                          − {fmt(tr.fromAmount)} {SYMBOL[tr.fromCurrency]}
                        </span></td>
                        <td><strong>{tr.toEntityName}</strong></td>
                        <td><span style={{ color: "var(--success)", fontWeight: 600 }}>
                          + {fmt(tr.toAmount)} {SYMBOL[tr.toCurrency]}
                        </span></td>
                        <td>{tr.fromCurrency !== tr.toCurrency
                          ? <span className="badge badge-neutral">{tr.exchangeRate}</span>
                          : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>
                        <td>{tr.description ?? "—"}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f8faff", fontWeight: 700 }}>
                      <td colSpan={2}>صافي التحويلات</td>
                      <td colSpan={2}>
                        <span style={{ color: report.transfers.netBalance.USD >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {report.transfers.netBalance.USD >= 0 ? "+" : ""}{fmt(report.transfers.netBalance.USD)} $
                        </span>
                      </td>
                      <td colSpan={3}>
                        <span style={{ color: report.transfers.netBalance.ILS >= 0 ? "#7c3aed" : "var(--danger)" }}>
                          {report.transfers.netBalance.ILS >= 0 ? "+" : ""}{fmt(report.transfers.netBalance.ILS)} ₪
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}