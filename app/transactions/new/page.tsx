"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Entity { id: number; name: string; currency: "USD" | "ILS"; }
interface Category { id: number; name: string; isAggregated: boolean; }

const CURRENCY_LABELS: Record<string, string> = { USD: "دولار", ILS: "شيكل" };
const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", ILS: "₪" };

export default function NewTransactionPage() {
  const router = useRouter();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ILS">("USD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [entityId, setEntityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/entities").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([entRes, catRes]) => {
      if (entRes.success) setEntities(entRes.data);
      if (catRes.success) setCategories(catRes.data);
    });
  }, []);

  function handleEntityChange(val: string) {
    setEntityId(val);
    const selected = entities.find(e => String(e.id) === val);
    if (selected) setCurrency(selected.currency);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          currency,
          date,
          description,
          entityId: Number(entityId),
          categoryId: categoryId ? Number(categoryId) : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAlert({ type: "success", msg: "تم حفظ العملية بنجاح ✓" });
        setTimeout(() => router.push("/transactions"), 1200);
      } else {
        setAlert({ type: "error", msg: json.message });
      }
    } catch {
      setAlert({ type: "error", msg: "حدث خطأ في الاتصال" });
    }
    setSubmitting(false);
  }

  const selectedEntity = entities.find(e => String(e.id) === entityId);

  return (
    <div className="container">
      <h1 className="page-title">إضافة عملية مالية</h1>
      <div className="card">
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
        <form onSubmit={handleSubmit}>

          {/* نوع العملية */}
          <div className="form-group">
            <label className="form-label">نوع العملية *</label>
            <div className="type-toggle">
              <button type="button"
                className={type === "INCOME" ? "active-income" : ""}
                onClick={() => { setType("INCOME"); setCategoryId(""); }}>
                📥 واردات
              </button>
              <button type="button"
                className={type === "EXPENSE" ? "active-expense" : ""}
                onClick={() => setType("EXPENSE")}>
                📤 مصروفات
              </button>
            </div>
          </div>

          <div className="grid-2">
            {/* الجهة المالية */}
            <div className="form-group">
              <label className="form-label">الجهة المالية *</label>
              <select className="form-control" value={entityId}
                onChange={e => handleEntityChange(e.target.value)} required>
                <option value="">-- اختر الجهة --</option>
                {entities.map(en => (
                  <option key={en.id} value={en.id}>
                    {en.name} ({CURRENCY_LABELS[en.currency]})
                  </option>
                ))}
              </select>
              {selectedEntity && (
                <div className="form-hint">
                  عملة الجهة: <strong>{CURRENCY_LABELS[selectedEntity.currency]}</strong>
                </div>
              )}
            </div>

            {/* الفئة للمصروفات */}
            {type === "EXPENSE" && (
              <div className="form-group">
                <label className="form-label">الفئة *</label>
                <select className="form-control" value={categoryId}
                  onChange={e => setCategoryId(e.target.value)} required>
                  <option value="">-- اختر الفئة --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {cat.isAggregated ? "(مجمّعة)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* التاريخ */}
            <div className="form-group">
              <label className="form-label">التاريخ *</label>
              <input type="date" className="form-control" value={date}
                onChange={e => setDate(e.target.value)} required />
            </div>

            {/* المبلغ */}
            <div className="form-group">
              <label className="form-label">
                المبلغ ({selectedEntity ? CURRENCY_LABELS[selectedEntity.currency] : "—"}) *
              </label>
              <div style={{ position: "relative" }}>
                <input type="number" className="form-control" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" min="0.01" step="0.01"
                  disabled={!entityId}
                  required />
                {selectedEntity && (
                  <span style={{
                    position: "absolute", left: "0.75rem", top: "50%",
                    transform: "translateY(-50%)", color: "var(--text-muted)",
                    fontWeight: 700, pointerEvents: "none",
                  }}>
                    {CURRENCY_SYMBOL[selectedEntity.currency]}
                  </span>
                )}
              </div>
              {!entityId && (
                <div className="form-hint">اختر الجهة المالية أولاً</div>
              )}
            </div>
          </div>

          {/* الوصف */}
          <div className="form-group">
            <label className="form-label">الوصف</label>
            <textarea className="form-control" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="وصف اختياري" rows={2} />
          </div>

          {/* ملخص */}
          {amount && entityId && (
            <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
              <strong>ملخص:</strong>{" "}
              {type === "INCOME" ? "📥 وارد" : "📤 مصروف"}{" "}
              <strong>
                {Number(amount).toLocaleString("ar-SA", { minimumFractionDigits: 2 })}
                {" "}{CURRENCY_LABELS[currency]}
              </strong>
              {" "}من جهة <strong>{selectedEntity?.name}</strong>
            </div>
          )}

          <hr className="divider" />
          <div className="flex-end gap-2">
            <button type="button" className="btn btn-outline"
              onClick={() => router.push("/transactions")}>إلغاء</button>
            <button type="submit"
              className={`btn ${type === "INCOME" ? "btn-success" : "btn-danger"}`}
              disabled={submitting}>
              {submitting ? "جاري الحفظ..." : type === "INCOME" ? "💾 حفظ الوارد" : "💾 حفظ المصروف"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}