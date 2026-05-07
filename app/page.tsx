import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1 className="page-title">لوحة التحكم</h1>

      <div className="grid-3">
        <Link href="/entities" style={{ textDecoration: "none" }}>
          <div className="stat-card" style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}>
            <div className="stat-label">الجهات المالية</div>
            <div className="stat-value neutral">🏦</div>
            <div className="stat-label" style={{ marginTop: "0.5rem" }}>
              إدارة الصناديق والحسابات
            </div>
          </div>
        </Link>

        <Link href="/transactions/new" style={{ textDecoration: "none" }}>
          <div className="stat-card" style={{ cursor: "pointer" }}>
            <div className="stat-label">إضافة عملية</div>
            <div className="stat-value neutral">➕</div>
            <div className="stat-label" style={{ marginTop: "0.5rem" }}>
              تسجيل وارد أو مصروف
            </div>
          </div>
        </Link>

        <Link href="/report" style={{ textDecoration: "none" }}>
          <div className="stat-card" style={{ cursor: "pointer" }}>
            <div className="stat-label">التقرير الشهري</div>
            <div className="stat-value neutral">📊</div>
            <div className="stat-label" style={{ marginTop: "0.5rem" }}>
              عرض تقرير الشهر
            </div>
          </div>
        </Link>
      </div>

      <div className="card">
        <div className="card-title">روابط سريعة</div>
        <div className="flex gap-2">
          <Link href="/entities" className="btn btn-primary">الجهات المالية</Link>
          <Link href="/transactions" className="btn btn-outline">كل العمليات</Link>
          <Link href="/categories" className="btn btn-outline">الفئات</Link>
          <Link href="/report" className="btn btn-outline">التقرير</Link>
        </div>
      </div>
    </div>
  );
}