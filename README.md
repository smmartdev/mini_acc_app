# mini_acc_app

نظام محاسبة عربي بسيط لإدارة:

- الواردات
- المصروفات
- الجهات المالية
- التقارير الشهرية

تم بناء المشروع باستخدام:

- Next.js (App Router)
- TypeScript
- MariaDB
- TypeORM

---

# المميزات الرئيسية

- واجهة عربية كاملة RTL
- نظام محاسبي بسيط بدون تعقيدات محاسبية
- دعم العملات:
  - الدولار USD
  - الشيكل ILS
- احتساب الرصيد بشكل ديناميكي
- تقارير شهرية ذكية
- دعم تجميع الفئات
- Clean Architecture
- Backend باستخدام Route Handlers فقط
- قابل للتوسعة والإنتاج Production Ready
- امكانية التصدير الى اكسل

---

# متطلبات التشغيل (Windows)

## نظام التشغيل

- Windows 10 أو Windows 11
- يفضل Windows 11 64-bit

---

## Node.js

### الإصدار المطلوب

```bash
Node.js v20.11.1 LTS
```

### التحقق من الإصدار

```bash
node -v
```

### التحميل

```txt
https://nodejs.org
```

---

## npm

يأتي تلقائياً مع Node.js

### الإصدار المقترح

```bash
npm 10+
```

### التحقق من الإصدار

```bash
npm -v
```

---

## MariaDB Server

### الإصدار المطلوب

```bash
MariaDB 11.4+
```

### التحميل

```txt
https://mariadb.org/download/
```

### أثناء التثبيت

قم بتفعيل:

- MariaDB Server
- Command Line Client

### معلومات مهمة أثناء التثبيت

احفظ:

- اسم المستخدم
- كلمة المرور
- المنفذ

المنفذ الافتراضي:

```txt
3306
```

### التحقق من التثبيت

```bash
mysql --version
```

---

## Git

### الإصدار المقترح

```bash
Git 2.45+
```

### التحميل

```txt
https://git-scm.com/download/win
```

### التحقق من الإصدار

```bash
git --version
```

---

# إنشاء قاعدة البيانات

افتح MariaDB Command Line أو أي أداة إدارة قواعد بيانات ثم نفذ:
اذا كانت mysql مضافة الى المسار اكتب الأمر مباشرة
اذا لم تكن مضافة افتج مجلد ماريا دي بي وادخل الى مجلد bin ثم اكتب الأمر التالي
```bash
mysql -u root -p
```
ادخل كلمة المرور واضغط Enter

```sql
CREATE DATABASE mini_acc_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

# إنشاء المشروع

## استنساخ المشروع

```bash
git clone https://github.com/smmartdev/mini_acc_app
```

---

## الدخول إلى المشروع

```bash
cd mini_acc_app
```

---

# تثبيت الحزم

```bash
npm install
```

---

# الحزم الأساسية المستخدمة

## Backend

```txt
next
react
react-dom
typescript
typeorm
mysql2
reflect-metadata
class-validator
class-transformer
```

---

## Frontend

```txt
tailwindcss
postcss
autoprefixer
```

---

# إعداد ملف البيئة

أنشئ ملف:

```txt
.env
```

ثم أضف:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=mini_acc_db

NEXT_PUBLIC_APP_NAME=mini_acc_app
```

---

# تشغيل المشروع

## وضع التطوير

```bash
npm run dev
```

ثم افتح:

```txt
http://localhost:3000
```

---

# بناء المشروع للإنتاج

```bash
npm run build
```

---

# تشغيل نسخة الإنتاج

```bash
npm start
```

---



# API Endpoints

## Transactions

```http
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/transactions
```

---

## Entities

```http
POST /api/entities
GET  /api/entities
```

---

## Categories

```http
GET /api/categories
```

---

## Reports

```http
GET /api/report?month=YYYY-MM&entityId=optional
```

---

# الترخيص

```txt
MIT License
```