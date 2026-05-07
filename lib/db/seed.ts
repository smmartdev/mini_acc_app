// import "reflect-metadata";
// import { DataSource } from "typeorm";
// import { FinancialEntity } from "./entities/FinancialEntity";
// import { Category } from "./entities/Category";
// import { Transaction, TransactionType, Currency } from "./entities/Transaction";
// import * as dotenv from "dotenv";

// dotenv.config({ path: ".env.local" });

// const SeedDataSource = new DataSource({
//   type: "mysql",
//   host: process.env.DB_HOST || "localhost",
//   port: Number(process.env.DB_PORT) || 3306,
//   username: process.env.DB_USERNAME || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME || "mini_acc_db",
//   synchronize: true,
//   logging: false,
//   entities: [FinancialEntity, Category, Transaction],
//   charset: "utf8mb4",
// });

// async function seed() {
//   await SeedDataSource.initialize();
//   console.log("✅ اتصال بقاعدة البيانات ناجح");

//   // ===== 1. الجهات المالية =====
//   const entityRepo = SeedDataSource.getRepository(FinancialEntity);

//   const entities = entityRepo.create([
//     { name: "الصندوق الرئيسي", notes: "النقد الموجود في المكتب" },
//     { name: "البنك الأهلي", notes: "الحساب الجاري رقم 1234" },
//     { name: "المحفظة الإلكترونية", notes: "محفظة PayPal" },
//   ]);

//   const savedEntities = await entityRepo.save(entities);
//   console.log(`✅ تم إنشاء ${savedEntities.length} جهات مالية`);

//   const [صندوق, بنك, محفظة] = savedEntities;

//   // ===== 2. الفئات =====
//   const categoryRepo = SeedDataSource.getRepository(Category);

//   const categories = categoryRepo.create([
//     { name: "مواصلات", isAggregated: true },
//     { name: "اتصالات", isAggregated: true },
//     { name: "رواتب موظفين", isAggregated: false },
//     { name: "إيجار المكتب", isAggregated: false },
//     { name: "مستلزمات مكتبية", isAggregated: true },
//     { name: "صيانة", isAggregated: false },
//   ]);

//   const savedCategories = await categoryRepo.save(categories);
//   console.log(`✅ تم إنشاء ${savedCategories.length} فئات`);

//   const [مواصلات, اتصالات, رواتب, إيجار, مستلزمات, صيانة] = savedCategories;

//   // ===== 3. العمليات المالية =====
//   const txRepo = SeedDataSource.getRepository(Transaction);

//   const currentMonth = new Date().toISOString().slice(0, 7);
//   const prevMonth = getPrevMonth();

//   const transactions = txRepo.create([
//     // --- واردات الشهر الحالي ---
//     {
//       type: TransactionType.INCOME,
//       amount: 5000,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 5000,
//       date: `${currentMonth}-01`,
//       description: "إيرادات مبيعات الشهر",
//       entityId: صندوق.id,
//       categoryId: null,
//     },
//     {
//       type: TransactionType.INCOME,
//       amount: 2000,
//       currency: Currency.JOD,
//       exchangeRate: 1.41,
//       amountInUSD: 2820,
//       date: `${currentMonth}-05`,
//       description: "دفعة من عميل أردني",
//       entityId: بنك.id,
//       categoryId: null,
//     },
//     {
//       type: TransactionType.INCOME,
//       amount: 3700,
//       currency: Currency.ILS,
//       exchangeRate: 0.27,
//       amountInUSD: 999,
//       date: `${currentMonth}-10`,
//       description: "تحويل من شريك",
//       entityId: محفظة.id,
//       categoryId: null,
//     },

//     // --- مصروفات الشهر الحالي ---
//     {
//       type: TransactionType.EXPENSE,
//       amount: 1500,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 1500,
//       date: `${currentMonth}-02`,
//       description: "راتب موظف أول",
//       entityId: صندوق.id,
//       categoryId: رواتب.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 1200,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 1200,
//       date: `${currentMonth}-02`,
//       description: "راتب موظف ثاني",
//       entityId: صندوق.id,
//       categoryId: رواتب.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 500,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 500,
//       date: `${currentMonth}-03`,
//       description: "إيجار شهر الحالي",
//       entityId: بنك.id,
//       categoryId: إيجار.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 50,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 50,
//       date: `${currentMonth}-04`,
//       description: "تاكسي للاجتماع",
//       entityId: صندوق.id,
//       categoryId: مواصلات.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 30,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 30,
//       date: `${currentMonth}-06`,
//       description: "مواصلات يومية",
//       entityId: صندوق.id,
//       categoryId: مواصلات.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 80,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 80,
//       date: `${currentMonth}-07`,
//       description: "فاتورة الإنترنت",
//       entityId: بنك.id,
//       categoryId: اتصالات.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 40,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 40,
//       date: `${currentMonth}-08`,
//       description: "فاتورة الجوال",
//       entityId: محفظة.id,
//       categoryId: اتصالات.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 148,
//       currency: Currency.JOD,
//       exchangeRate: 1.41,
//       amountInUSD: 208.68,
//       date: `${currentMonth}-09`,
//       description: "صيانة أجهزة الكمبيوتر",
//       entityId: بنك.id,
//       categoryId: صيانة.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 200,
//       currency: Currency.ILS,
//       exchangeRate: 0.27,
//       amountInUSD: 54,
//       date: `${currentMonth}-11`,
//       description: "أقلام وأوراق",
//       entityId: صندوق.id,
//       categoryId: مستلزمات.id,
//     },

//     // --- واردات الشهر الماضي ---
//     {
//       type: TransactionType.INCOME,
//       amount: 4500,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 4500,
//       date: `${prevMonth}-15`,
//       description: "إيرادات الشهر الماضي",
//       entityId: صندوق.id,
//       categoryId: null,
//     },

//     // --- مصروفات الشهر الماضي ---
//     {
//       type: TransactionType.EXPENSE,
//       amount: 1500,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 1500,
//       date: `${prevMonth}-01`,
//       description: "رواتب الشهر الماضي",
//       entityId: صندوق.id,
//       categoryId: رواتب.id,
//     },
//     {
//       type: TransactionType.EXPENSE,
//       amount: 500,
//       currency: Currency.USD,
//       exchangeRate: 1,
//       amountInUSD: 500,
//       date: `${prevMonth}-02`,
//       description: "إيجار الشهر الماضي",
//       entityId: بنك.id,
//       categoryId: إيجار.id,
//     },
//   ]);

//   await txRepo.save(transactions);
//   console.log(`✅ تم إنشاء ${transactions.length} عملية مالية`);

//   // ===== ملخص =====
//   console.log("\n📊 ملخص البيانات التجريبية:");
//   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//   console.log(`🏦 الجهات المالية : ${savedEntities.length}`);
//   console.log(`🏷️  الفئات         : ${savedCategories.length}`);
//   console.log(`💸 العمليات       : ${transactions.length}`);
//   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//   console.log("✅ اكتملت البيانات التجريبية بنجاح!");

//   await SeedDataSource.destroy();
// }

// function getPrevMonth(): string {
//   const d = new Date();
//   d.setMonth(d.getMonth() - 1);
//   return d.toISOString().slice(0, 7);
// }

// seed().catch((err) => {
//   console.error("❌ خطأ في البيانات التجريبية:", err);
//   process.exit(1);
// });