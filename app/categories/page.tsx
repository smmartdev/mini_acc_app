"use client";

import { useEffect, useState } from "react";

interface Category { id: number; name: string; isAggregated: boolean; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [isAggregated, setIsAggregated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch("/api/categories");
    const json = await res.json();
    if (json.success) setCategories(json.data);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isAggregated }),
      });
      const json = await res.json();
      if (json.success) {
        setAlert({ type: "success", msg: "تم إضافة الفئة بنجاح" });
        setName("");
        setIsAggregated(false);
        fetchCategories();
      } else {
        setAlert({ type: "error", msg: json.message });
      }
    } catch {
      setAlert({ type: "error", msg: "حدث خطأ في الاتصال" });
    }
    setSubmitting(false);
  }

  return (
    <div className="container">
      <h1 className="page-title">الفئات</h1>

      <div className="card">
        <div className="card-title">إضافة فئة جديدة</div>
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">اسم الفئة *</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: مواصلات، رواتب..."
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">نوع الفئة</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.6rem" }}>
                <input
                  type="checkbox"
                  id="isAggregated"
                  checked={isAggregated}
                  onChange={(e) => setIsAggregated(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="isAggregated" style={{ cursor: "pointer", fontSize: "0.9rem" }}>
                  فئة مجمّعة (تظهر كمجموع في التقرير)
                </label>
              </div>
            </div>
          </div>
          <div className="flex-end">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "جاري الحفظ..." : "إضافة الفئة"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">قائمة الفئات</div>
        {loading ? (
          <div className="empty-state"><p>جاري التحميل...</p></div>
        ) : categories.length === 0 ? (
          <div className="empty-state"><p>لا توجد فئات بعد</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الفئة</th>
                  <th>النوع</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td><strong>{cat.name}</strong></td>
                    <td>
                      <span className={`badge ${cat.isAggregated ? "badge-neutral" : "badge-income"}`}>
                        {cat.isAggregated ? "مجمّعة" : "تفصيلية"}
                      </span>
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