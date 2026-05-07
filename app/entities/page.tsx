"use client";

import { useEffect, useState } from "react";

interface Entity {
  id: number;
  name: string;
  currency: "USD" | "ILS";
  notes: string | null;
  createdAt: string;
  balance: number;
  hasTransactions: boolean;
}

interface Movement {
  id: string;
  date: string;
  type: "income" | "expense" | "transfer-in" | "transfer-out";
  label: string;
  amount: number;
  currency: string;
  category: string | null;
  counterpart: string | null;
  description: string | null;
}

interface EntityMovements {
  movements: Movement[];
  totalIn: number;
  totalOut: number;
  net: number;
}

const CURRENCY_LABELS: Record<string, string> = { USD: "دولار", ILS: "شيكل" };
const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", ILS: "₪" };

function fmt(n: number) {
  return Number(n).toLocaleString("ar-SA", { minimumFractionDigits: 2 });
}

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  income:       { bg: "#f0fdf4", color: "#166534" },
  expense:      { bg: "#fef2f2", color: "#991b1b" },
  "transfer-in":  { bg: "#eff6ff", color: "#1e40af" },
  "transfer-out": { bg: "#fff7ed", color: "#9a3412" },
};

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  // نموذج الإضافة
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ILS">("USD");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // نموذج التعديل
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // عرض الحركات
  const [viewingEntity, setViewingEntity] = useState<Entity | null>(null);
  const [movements, setMovements] = useState<EntityMovements | null>(null);
  const [movLoading, setMovLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchEntities() {
    setLoading(true);
    const res = await fetch("/api/entities");
    const json = await res.json();
    if (json.success) setEntities(json.data);
    setLoading(false);
  }

  useEffect(() => { fetchEntities(); }, []);

  function showAlert(type: "success" | "error", msg: string) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  }

  // ===== جلب الحركات =====
  async function fetchMovements(entity: Entity, from = fromDate, to = toDate) {
    setMovLoading(true);
    setMovements(null);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/entities/${entity.id}/transactions?${params}`);
    const json = await res.json();
    if (json.success) setMovements(json.data);
    setMovLoading(false);
  }

  function openMovements(entity: Entity) {
    setViewingEntity(entity);
    setFromDate("");
    setToDate("");
    setMovements(null);
    fetchMovements(entity, "", "");
  }

  function closeMovements() {
    setViewingEntity(null);
    setMovements(null);
  }

  // ===== إضافة =====
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency, notes }),
      });
      const json = await res.json();
      if (json.success) {
        showAlert("success", "تم إضافة الجهة المالية بنجاح ✓");
        setName(""); setCurrency("USD"); setNotes("");
        fetchEntities();
      } else showAlert("error", json.message);
    } catch { showAlert("error", "حدث خطأ في الاتصال"); }
    setSubmitting(false);
  }

  // ===== تعديل =====
  function openEdit(entity: Entity) {
    setEditingEntity(entity);
    setEditName(entity.name);
    setEditNotes(entity.notes ?? "");
  }

  function closeEdit() { setEditingEntity(null); }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEntity || !editName.trim()) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/entities/${editingEntity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, currency: editingEntity.currency, notes: editNotes }),
      });
      const json = await res.json();
      if (json.success) {
        showAlert("success", "تم تعديل الجهة المالية بنجاح ✓");
        closeEdit(); fetchEntities();
      } else showAlert("error", json.message);
    } catch { showAlert("error", "حدث خطأ في الاتصال"); }
    setEditSubmitting(false);
  }

  // ===== حذف =====
  async function handleDelete(entity: Entity) {
    if (!confirm(`هل أنت متأكد من حذف "${entity.name}"؟`)) return;
    setDeletingId(entity.id);
    try {
      const res = await fetch(`/api/entities/${entity.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showAlert("success", "تم حذف الجهة المالية بنجاح ✓");
        fetchEntities();
      } else showAlert("error", json.message);
    } catch { showAlert("error", "حدث خطأ في الاتصال"); }
    setDeletingId(null);
  }

  return (
    <div className="container">
      <h1 className="page-title">الجهات المالية</h1>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* ===== modal عرض الحركات ===== */}
      {viewingEntity && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 1000, display: "flex", alignItems: "flex-start",
          justifyContent: "center", padding: "2rem 1rem", overflowY: "auto",
        }}>
          <div style={{
            background: "white", borderRadius: "14px", width: "100%",
            maxWidth: "860px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}>
            {/* header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>
                  📋 حركات: {viewingEntity.name}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  العملة: {CURRENCY_LABELS[viewingEntity.currency]} |
                  الرصيد: <strong style={{ color: viewingEntity.balance >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {fmt(viewingEntity.balance)} {CURRENCY_SYMBOL[viewingEntity.currency]}
                  </strong>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={closeMovements}>✖ إغلاق</button>
            </div>

            {/* فلتر التاريخ */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", background: "#f9fafb" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "160px" }}>
                  <label className="form-label">من تاريخ</label>
                  <input type="date" className="form-control" value={fromDate}
                    onChange={e => setFromDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "160px" }}>
                  <label className="form-label">إلى تاريخ</label>
                  <input type="date" className="form-control" value={toDate}
                    onChange={e => setToDate(e.target.value)} />
                </div>
                <button className="btn btn-primary"
                  onClick={() => fetchMovements(viewingEntity, fromDate, toDate)}
                  disabled={movLoading}>
                  {movLoading ? "جاري..." : "🔍 تطبيق"}
                </button>
                <button className="btn btn-outline"
                  onClick={() => { setFromDate(""); setToDate(""); fetchMovements(viewingEntity, "", ""); }}>
                  إعادة تعيين
                </button>
              </div>
            </div>

            {/* الإجماليات */}
            {movements && (
              <div style={{
                padding: "0.75rem 1.5rem",
                borderBottom: "1px solid var(--border)",
                display: "flex", gap: "1.5rem", flexWrap: "wrap",
                fontSize: "0.9rem", background: "#f0f9ff",
              }}>
                <span>📋 عدد الحركات: <strong>{movements.movements.length}</strong></span>
                <span style={{ color: "var(--success)" }}>
                  📥 إجمالي الداخل: <strong>{fmt(movements.totalIn)} {CURRENCY_SYMBOL[viewingEntity.currency]}</strong>
                </span>
                <span style={{ color: "var(--danger)" }}>
                  📤 إجمالي الخارج: <strong>{fmt(movements.totalOut)} {CURRENCY_SYMBOL[viewingEntity.currency]}</strong>
                </span>
                <span style={{ color: movements.net >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>
                  💰 الصافي: <strong>{fmt(movements.net)} {CURRENCY_SYMBOL[viewingEntity.currency]}</strong>
                </span>
              </div>
            )}

            {/* الجدول */}
            <div style={{ padding: "1rem 1.5rem" }}>
              {movLoading ? (
                <div className="empty-state"><p>جاري التحميل...</p></div>
              ) : !movements || movements.movements.length === 0 ? (
                <div className="empty-state"><p>لا توجد حركات في هذه الفترة</p></div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>الفئة / الجهة الأخرى</th>
                        <th>الوصف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.movements.map(m => {
                        const style = TYPE_STYLE[m.type] ?? {};
                        const isOut = m.type === "expense" || m.type === "transfer-out";
                        return (
                          <tr key={m.id}>
                            <td>{m.date}</td>
                            <td>
                              <span style={{
                                padding: "0.2rem 0.6rem", borderRadius: "12px",
                                fontSize: "0.8rem", fontWeight: 600,
                                background: style.bg, color: style.color,
                              }}>
                                {m.type === "income" && "📥 وارد"}
                                {m.type === "expense" && "📤 مصروف"}
                                {m.type === "transfer-in" && "🔄 تحويل وارد"}
                                {m.type === "transfer-out" && "🔄 تحويل صادر"}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: isOut ? "var(--danger)" : "var(--success)" }}>
                                {isOut ? "−" : "+"} {fmt(m.amount)} {CURRENCY_SYMBOL[m.currency] ?? m.currency}
                              </span>
                            </td>
                            <td>
                              {m.category && (
                                <span className="badge badge-neutral" style={{ marginBottom: "0.2rem" }}>
                                  {m.category}
                                </span>
                              )}
                              {m.counterpart && (
                                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                  {m.type === "transfer-in" ? "من: " : "إلى: "}{m.counterpart}
                                </span>
                              )}
                              {!m.category && !m.counterpart && "—"}
                            </td>
                            <td style={{
                              maxWidth: "180px", overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {m.description ?? "—"}
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
        </div>
      )}

      {/* نموذج الإضافة */}
      <div className="card">
        <div className="card-title">إضافة جهة مالية جديدة</div>
        <form onSubmit={handleSubmit}>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">اسم الجهة *</label>
              <input className="form-control" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: الصندوق الرئيسي" required />
            </div>
            <div className="form-group">
              <label className="form-label">عملة الجهة *</label>
              <select className="form-control" value={currency}
                onChange={e => setCurrency(e.target.value as "USD" | "ILS")}>
                <option value="USD">دولار (USD)</option>
                <option value="ILS">شيكل (ILS)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ملاحظات</label>
              <input className="form-control" value={notes}
                onChange={e => setNotes(e.target.value)} placeholder="اختياري" />
            </div>
          </div>
          <div className="flex-end">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "جاري الحفظ..." : "➕ إضافة الجهة"}
            </button>
          </div>
        </form>
      </div>

      {/* نموذج التعديل */}
      {editingEntity && (
        <div className="card" style={{ border: "2px solid var(--primary)" }}>
          <div className="flex-between mb-1">
            <div className="card-title" style={{ marginBottom: 0 }}>
              ✏️ تعديل: {editingEntity.name}
            </div>
            <button className="btn btn-outline btn-sm" onClick={closeEdit}>إلغاء</button>
          </div>
          <form onSubmit={handleEdit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">اسم الجهة *</label>
                <input className="form-control" value={editName}
                  onChange={e => setEditName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <input className="form-control" value={editNotes}
                  onChange={e => setEditNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex-end">
              <button className="btn btn-primary" type="submit" disabled={editSubmitting}>
                {editSubmitting ? "جاري الحفظ..." : "💾 حفظ التعديل"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* الجدول */}
      <div className="card">
        <div className="card-title">قائمة الجهات المالية</div>
        {loading ? (
          <div className="empty-state"><p>جاري التحميل...</p></div>
        ) : entities.length === 0 ? (
          <div className="empty-state"><p>لا توجد جهات مالية بعد</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الجهة</th>
                  <th>العملة</th>
                  <th>الرصيد</th>
                  <th>ملاحظات</th>
                  <th>تاريخ الإنشاء</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {entities.map(entity => (
                  <tr key={entity.id}>
                    <td>{entity.id}</td>
                    <td><strong>{entity.name}</strong></td>
                    <td>
                      <span className="badge badge-neutral">
                        {CURRENCY_LABELS[entity.currency]}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: entity.balance >= 0 ? "var(--success)" : "var(--danger)",
                      }}>
                        {fmt(entity.balance)} {CURRENCY_SYMBOL[entity.currency]}
                      </span>
                    </td>
                    <td>{entity.notes ?? "—"}</td>
                    <td>{new Date(entity.createdAt).toLocaleDateString("ar-SA")}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-outline btn-sm"
                          onClick={() => openMovements(entity)}>
                          📋 الحركات
                        </button>
                        {entity.hasTransactions ? (
                          <span className="badge badge-neutral" title="توجد حركات مسجلة">
                            🔒 مقيّدة
                          </span>
                        ) : (
                          <>
                            <button className="btn btn-outline btn-sm"
                              onClick={() => openEdit(entity)}>
                              ✏️
                            </button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(entity)}
                              disabled={deletingId === entity.id}>
                              {deletingId === entity.id ? "..." : "🗑️"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}