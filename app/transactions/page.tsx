"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Transaction {
  id: number;
  type: "INCOME" | "EXPENSE";
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  entity: { id: number; name: string; currency: string };
  category: { id: number; name: string } | null;
}

interface Entity { id: number; name: string; currency: string; }
interface Category { id: number; name: string; }

const CURRENCY_LABELS: Record<string, string> = { USD: "دولار", ILS: "شيكل" };
const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", ILS: "₪" };

function fmt(n: number) {
  return Number(n).toLocaleString("ar-SA", { minimumFractionDigits: 2 });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [filterType, setFilterType] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function fetchAll() {
    setLoading(true);
    const [txRes, entRes, catRes] = await Promise.all([
      fetch("/api/transactions").then(r => r.json()),
      fetch("/api/entities").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]);
    if (txRes.success) setTransactions(txRes.data);
    if (entRes.success) setEntities(entRes.data);
    if (catRes.success) setCategories(catRes.data);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  function showAlert(type: "success" | "error", msg: string) {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  }

  async function handleDelete(id: number) {
    if (!confirm("هل أنت متأكد من حذف هذه العملية؟")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { showAlert("success", "تم حذف العملية بنجاح ✓"); fetchAll(); }
      else showAlert("error", json.message);
    } catch { showAlert("error", "حدث خطأ"); }
    setDeleting(null);
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx);
    setEditAmount(String(tx.amount));
    setEditDate(tx.date);
    setEditDesc(tx.description ?? "");
    setEditCategoryId(tx.category ? String(tx.category.id) : "");
  }

  function closeEdit() { setEditingTx(null); }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTx) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${editingTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(editAmount),
          date: editDate,
          description: editDesc,
          categoryId: editCategoryId ? Number(editCategoryId) : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showAlert("success", "تم تعديل العملية بنجاح ✓");
        closeEdit(); fetchAll();
      } else showAlert("error", json.message);
    } catch { showAlert("error", "حدث خطأ"); }
    setEditSubmitting(false);
  }

  const filtered = transactions.filter(t => {
    if (filterType && t.type !== filterType) return false;
    if (filterEntity && String(t.entity?.id) !== filterEntity) return false;
    if (filterCategory) {
      if (filterCategory === "__none__") { if (t.category !== null) return false; }
      else { if (String(t.category?.id) !== filterCategory) return false; }
    }
    return true;
  });

  const totalUSD = filtered.filter(t => t.currency === "USD" && t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0)
    - filtered.filter(t => t.currency === "USD" && t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  const totalILS = filtered.filter(t => t.currency === "ILS" && t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0)
    - filtered.filter(t => t.currency === "ILS" && t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  function resetFilters() { setFilterType(""); setFilterEntity(""); setFilterCategory(""); }
  const hasFilters = filterType || filterEntity || filterCategory;

  return (
    <div className="container">
      <div className="flex-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>العمليات المالية</h1>
        <Link href="/transactions/new" className="btn btn-primary">➕ إضافة عملية</Link>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {/* modal التعديل */}
      {editingTx && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "520px", margin: "1rem" }}>
            <div className="flex-between mb-1">
              <div className="card-title" style={{ marginBottom: 0 }}>
                ✏️ تعديل العملية #{editingTx.id}
              </div>
              <button className="btn btn-outline btn-sm" onClick={closeEdit}>✖</button>
            </div>

            <div style={{ marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "#f3f4f6", borderRadius: "6px", fontSize: "0.85rem" }}>
              <span className={`badge badge-${editingTx.type === "INCOME" ? "income" : "expense"}`} style={{ marginLeft: "0.5rem" }}>
                {editingTx.type === "INCOME" ? "📥 وارد" : "📤 مصروف"}
              </span>
              الجهة: <strong>{editingTx.entity?.name}</strong> |
              العملة: <strong>{CURRENCY_LABELS[editingTx.currency]}</strong>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    المبلغ ({CURRENCY_LABELS[editingTx.currency]}) *
                  </label>
                  <input type="number" className="form-control" value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    min="0.01" step="0.01" required />
                </div>
                <div className="form-group">
                  <label className="form-label">التاريخ *</label>
                  <input type="date" className="form-control" value={editDate}
                    onChange={e => setEditDate(e.target.value)} required />
                </div>
                {editingTx.type === "EXPENSE" && (
                  <div className="form-group">
                    <label className="form-label">الفئة</label>
                    <select className="form-control" value={editCategoryId}
                      onChange={e => setEditCategoryId(e.target.value)}>
                      <option value="">-- اختر الفئة --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">الوصف</label>
                <textarea className="form-control" value={editDesc}
                  onChange={e => setEditDesc(e.target.value)} rows={2} />
              </div>
              <div className="flex-end gap-2">
                <button type="button" className="btn btn-outline" onClick={closeEdit}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? "جاري الحفظ..." : "💾 حفظ التعديل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* الفلاتر */}
      <div className="card">
        <div className="flex-between mb-1">
          <div className="card-title" style={{ marginBottom: 0 }}>🔍 فلترة العمليات</div>
          {hasFilters && (
            <button className="btn btn-outline btn-sm" onClick={resetFilters}>✖ إلغاء</button>
          )}
        </div>
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">النوع</label>
            <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">الكل</option>
              <option value="INCOME">📥 واردات</option>
              <option value="EXPENSE">📤 مصروفات</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">الجهة المالية</label>
            <select className="form-control" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
              <option value="">كل الجهات</option>
              {entities.map(en => (
                <option key={en.id} value={en.id}>{en.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">الفئة</label>
            <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">كل الفئات</option>
              <option value="__none__">بدون فئة</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!loading && (
          <div style={{
            display: "flex", gap: "1.5rem", padding: "0.75rem 1rem",
            background: "#f9fafb", borderRadius: "8px", fontSize: "0.9rem", flexWrap: "wrap",
          }}>
            <span>📋 النتائج: <strong>{filtered.length}</strong></span>
            <span style={{ color: totalUSD >= 0 ? "var(--success)" : "var(--danger)" }}>
              💵 صافي دولار: <strong>{fmt(totalUSD)} $</strong>
            </span>
            <span style={{ color: totalILS >= 0 ? "#7c3aed" : "var(--danger)" }}>
              🪙 صافي شيكل: <strong>{fmt(totalILS)} ₪</strong>
            </span>
          </div>
        )}
      </div>

      {/* الجدول */}
      <div className="card">
        {loading ? (
          <div className="empty-state"><p>جاري التحميل...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>{hasFilters ? "لا توجد نتائج تطابق الفلاتر" : "لا توجد عمليات مالية بعد"}</p>
            {!hasFilters && (
              <Link href="/transactions/new" className="btn btn-primary mt-2">إضافة أول عملية</Link>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>النوع</th>
                  <th>التاريخ</th>
                  <th>الجهة</th>
                  <th>المبلغ بالدولار</th>
                  <th>المبلغ بالشيكل</th>
                  <th>الفئة</th>
                  <th>الوصف</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>
                      <span className={`badge badge-${t.type === "INCOME" ? "income" : "expense"}`}>
                        {t.type === "INCOME" ? "📥 وارد" : "📤 مصروف"}
                      </span>
                    </td>
                    <td>{t.date}</td>
                    <td>{t.entity?.name}</td>
                    <td>
                      {t.currency === "USD"
                        ? <span style={{ color: "var(--success)", fontWeight: 600 }}>{fmt(t.amount)} $</span>
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td>
                      {t.currency === "ILS"
                        ? <span style={{ color: "#7c3aed", fontWeight: 600 }}>{fmt(t.amount)} ₪</span>
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td>{t.category?.name ?? "—"}</td>
                    <td style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.description ?? "—"}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>✏️</button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(t.id)}
                          disabled={deleting === t.id}>
                          {deleting === t.id ? "..." : "🗑️"}
                        </button>
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