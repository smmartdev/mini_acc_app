"use client";

import { useEffect, useState } from "react";

interface Entity {
  id: number;
  name: string;
  currency: "USD" | "ILS";
  balance: number;
}

interface Transfer {
  id: number;
  fromEntityId: number;
  toEntityId: number;
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  date: string;
  description: string | null;
  fromEntity: { name: string; currency: string };
  toEntity: { name: string; currency: string };
  createdAt: string;
}

const CURRENCY_LABELS: Record<string, string> = { USD: "دولار", ILS: "شيكل" };
const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", ILS: "₪" };

function fmt(n: number) {
  return Number(n).toLocaleString("ar-SA", { minimumFractionDigits: 2 });
}

export default function TransfersPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // نموذج التحويل
  const [fromEntityId, setFromEntityId] = useState("");
  const [toEntityId, setToEntityId] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function fetchAll() {
    setLoading(true);
    const [entRes, trRes] = await Promise.all([
      fetch("/api/entities").then(r => r.json()),
      fetch("/api/transfers").then(r => r.json()),
    ]);
    if (entRes.success) setEntities(entRes.data);
    if (trRes.success) setTransfers(trRes.data);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  function showAlert(type: "success" | "error", msg: string) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  }

  const fromEntity = entities.find(e => String(e.id) === fromEntityId);
  const toEntity = entities.find(e => String(e.id) === toEntityId);
  const sameCurrency = fromEntity && toEntity && fromEntity.currency === toEntity.currency;
  const crossCurrency = fromEntity && toEntity && !sameCurrency;

  // حساب المبلغ المستلم
  const toAmount = crossCurrency && exchangeRate
    ? Math.round(Number(fromAmount) * Number(exchangeRate) * 100) / 100
    : Number(fromAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromEntityId: Number(fromEntityId),
          toEntityId: Number(toEntityId),
          fromAmount: Number(fromAmount),
          exchangeRate: crossCurrency ? Number(exchangeRate) : undefined,
          date,
          description,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showAlert("success", "تم تسجيل التحويل بنجاح ✓");
        setFromEntityId(""); setToEntityId("");
        setFromAmount(""); setExchangeRate("");
        setDescription("");
        fetchAll();
      } else {
        showAlert("error", json.message);
      }
    } catch {
      showAlert("error", "حدث خطأ في الاتصال");
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("هل أنت متأكد من حذف هذا التحويل؟")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/transfers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { showAlert("success", "تم حذف التحويل بنجاح ✓"); fetchAll(); }
      else showAlert("error", json.message);
    } catch { showAlert("error", "حدث خطأ في الحذف"); }
    setDeleting(null);
  }

  return (
    <div className="container">
      <h1 className="page-title">التحويل بين الجهات المالية</h1>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* نموذج التحويل */}
      <div className="card">
        <div className="card-title">➡️ تحويل جديد</div>
        <form onSubmit={handleSubmit}>

          {/* الجهة المصدر والهدف */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">التحويل من *</label>
              <select className="form-control" value={fromEntityId}
                onChange={e => { setFromEntityId(e.target.value); setExchangeRate(""); }}
                required>
                <option value="">-- اختر الجهة المصدر --</option>
                {entities.map(en => (
                  <option key={en.id} value={en.id}
                    disabled={String(en.id) === toEntityId}>
                    {en.name} ({CURRENCY_LABELS[en.currency]}) — رصيد: {fmt(en.balance)} {CURRENCY_SYMBOL[en.currency]}
                  </option>
                ))}
              </select>
              {fromEntity && (
                <div className="form-hint">
                  الرصيد الحالي:{" "}
                  <strong style={{ color: fromEntity.balance >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {fmt(fromEntity.balance)} {CURRENCY_SYMBOL[fromEntity.currency]}
                  </strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">التحويل إلى *</label>
              <select className="form-control" value={toEntityId}
                onChange={e => { setToEntityId(e.target.value); setExchangeRate(""); }}
                required>
                <option value="">-- اختر الجهة الهدف --</option>
                {entities.map(en => (
                  <option key={en.id} value={en.id}
                    disabled={String(en.id) === fromEntityId}>
                    {en.name} ({CURRENCY_LABELS[en.currency]}) — رصيد: {fmt(en.balance)} {CURRENCY_SYMBOL[en.currency]}
                  </option>
                ))}
              </select>
              {toEntity && (
                <div className="form-hint">
                  الرصيد الحالي:{" "}
                  <strong style={{ color: toEntity.balance >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {fmt(toEntity.balance)} {CURRENCY_SYMBOL[toEntity.currency]}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* تنبيه نوع التحويل */}
          {fromEntity && toEntity && (
            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              fontSize: "0.9rem",
              background: sameCurrency ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${sameCurrency ? "#bbf7d0" : "#fde68a"}`,
              color: sameCurrency ? "var(--success)" : "var(--warning)",
              fontWeight: 600,
            }}>
              {sameCurrency
                ? `✅ تحويل بنفس العملة (${CURRENCY_LABELS[fromEntity.currency]}) — لا حاجة لسعر الصرف`
                : `⚠️ تحويل بين عملتين مختلفتين — ${CURRENCY_LABELS[fromEntity.currency]} ← ${CURRENCY_LABELS[toEntity.currency]} — يجب إدخال سعر الصرف`}
            </div>
          )}

          <div className="grid-3">
            {/* المبلغ المحول */}
            <div className="form-group">
              <label className="form-label">
                المبلغ المحول {fromEntity ? `(${CURRENCY_LABELS[fromEntity.currency]})` : ""} *
              </label>
              <input type="number" className="form-control" value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
                placeholder="0.00" min="0.01" step="0.01"
                disabled={!fromEntityId || !toEntityId}
                required />
            </div>

            {/* سعر الصرف — فقط عند اختلاف العملة */}
            {crossCurrency && (
              <div className="form-group">
                <label className="form-label">
                  سعر الصرف *
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: "0.4rem" }}>
                    (1 {fromEntity?.currency} = ? {toEntity?.currency})
                  </span>
                </label>
                <input type="number" className="form-control" value={exchangeRate}
                  onChange={e => setExchangeRate(e.target.value)}
                  placeholder="0.000000" min="0.000001" step="0.000001"
                  required />
                {fromAmount && exchangeRate && (
                  <div className="form-hint">
                    المبلغ المستلم:{" "}
                    <strong style={{ color: "#7c3aed" }}>
                      {fmt(toAmount)} {toEntity ? CURRENCY_SYMBOL[toEntity.currency] : ""}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* التاريخ */}
            <div className="form-group">
              <label className="form-label">التاريخ *</label>
              <input type="date" className="form-control" value={date}
                onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          {/* الوصف */}
          <div className="form-group">
            <label className="form-label">الوصف</label>
            <textarea className="form-control" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="وصف اختياري للتحويل" rows={2} />
          </div>

          {/* ملخص التحويل */}
          {fromEntity && toEntity && fromAmount && Number(fromAmount) > 0 && (
            <div style={{
              padding: "1rem",
              background: "#f8faff",
              border: "1px solid #c7d7f9",
              borderRadius: "10px",
              marginBottom: "1rem",
            }}>
              <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--primary)" }}>
                📋 ملخص التحويل
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", fontSize: "0.95rem" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>من</div>
                  <div style={{ fontWeight: 700 }}>{fromEntity.name}</div>
                  <div style={{ color: "var(--danger)", fontWeight: 700 }}>
                    − {fmt(Number(fromAmount))} {CURRENCY_SYMBOL[fromEntity.currency]}
                  </div>
                </div>
                <div style={{ fontSize: "1.5rem", color: "var(--primary)" }}>➡️</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>إلى</div>
                  <div style={{ fontWeight: 700 }}>{toEntity.name}</div>
                  <div style={{ color: "var(--success)", fontWeight: 700 }}>
                    + {fmt(toAmount)} {CURRENCY_SYMBOL[toEntity.currency]}
                  </div>
                </div>
                {crossCurrency && exchangeRate && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginRight: "auto" }}>
                    سعر الصرف: 1 {fromEntity.currency} = {exchangeRate} {toEntity.currency}
                  </div>
                )}
              </div>
            </div>
          )}

          <hr className="divider" />
          <div className="flex-end">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "جاري الحفظ..." : "💾 تسجيل التحويل"}
            </button>
          </div>
        </form>
      </div>

      {/* سجل التحويلات */}
      <div className="card">
        <div className="card-title">📋 سجل التحويلات</div>
        {loading ? (
          <div className="empty-state"><p>جاري التحميل...</p></div>
        ) : transfers.length === 0 ? (
          <div className="empty-state"><p>لا توجد تحويلات بعد</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>التاريخ</th>
                  <th>من</th>
                  <th>المبلغ المحول</th>
                  <th>إلى</th>
                  <th>المبلغ المستلم</th>
                  <th>سعر الصرف</th>
                  <th>الوصف</th>
                  <th>حذف</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(tr => {
                  const isCross = tr.fromCurrency !== tr.toCurrency;
                  return (
                    <tr key={tr.id}>
                      <td>{tr.id}</td>
                      <td>{tr.date}</td>
                      <td>
                        <strong>{tr.fromEntity?.name}</strong>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {CURRENCY_LABELS[tr.fromCurrency]}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                          − {fmt(tr.fromAmount)} {CURRENCY_SYMBOL[tr.fromCurrency]}
                        </span>
                      </td>
                      <td>
                        <strong>{tr.toEntity?.name}</strong>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {CURRENCY_LABELS[tr.toCurrency]}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: "var(--success)", fontWeight: 600 }}>
                          + {fmt(tr.toAmount)} {CURRENCY_SYMBOL[tr.toCurrency]}
                        </span>
                      </td>
                      <td>
                        {isCross
                          ? <span className="badge badge-neutral">{tr.exchangeRate}</span>
                          : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tr.description ?? "—"}
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(tr.id)}
                          disabled={deleting === tr.id}>
                          {deleting === tr.id ? "..." : "🗑️"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}