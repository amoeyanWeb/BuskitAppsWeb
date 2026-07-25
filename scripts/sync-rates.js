/**
 * ====================================================================
 *  Buskit — همگام‌سازی نرخ ارز (دلار و لیر ترکیه) — نسخه GitHub Actions
 * ====================================================================
 * این اسکریپت هیچ وابستگی به Firebase Cloud Functions (و در نتیجه پلن
 * Blaze) ندارد. کاملاً مستقل اجرا می‌شود (روی سرورهای رایگان گیت‌هاب) و
 * فقط از firebase-admin برای نوشتن مستقیم در Firestore استفاده می‌کند —
 * که تحت پلن رایگان (Spark) هم کاملاً مجاز است.
 *
 * ورودی‌های لازم (از طریق Environment Variables / GitHub Secrets):
 *   FIREBASE_SERVICE_ACCOUNT   محتوای کامل فایل JSON کلید سرویس Firebase
 *   BRSAPI_KEY                 کلید رایگان BrsApi.ir
 */

const admin = require("firebase-admin");

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("متغیر FIREBASE_SERVICE_ACCOUNT تنظیم نشده است.");
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      "محتوای FIREBASE_SERVICE_ACCOUNT یک JSON معتبر نیست: " + err.message,
    );
  }
}

async function fetchRatesFromBrsApi(apiKey) {
  const url = `https://BrsApi.ir/Api/Market/Gold_Currency.php?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`BrsApi HTTP error: ${res.status}`);
  }
  const json = await res.json();

  // ساختار خروجی BrsApi را اینجا پارس می‌کنیم. اگر فیلدها با نمونهٔ زیر
  // فرق داشت، کافیست همین بخش را با خروجی واقعی BrsApi تطبیق دهید:
  // { "currency": [ { "symbol": "USD", "price": "118500", ... }, ... ] }
  const currencyList = json.currency || json.Currency || [];
  const wanted = ["USD", "TRY"];
  const result = {};

  for (const item of currencyList) {
    const symbol = (item.symbol || item.name_en || "").toUpperCase();
    if (wanted.includes(symbol) && item.price) {
      result[symbol] = Number(String(item.price).replace(/,/g, ""));
    }
  }

  for (const sym of wanted) {
    if (!result[sym]) {
      throw new Error(
        `نرخ ${sym} در پاسخ BrsApi پیدا نشد. پاسخ خام: ${JSON.stringify(json).slice(0, 500)}`,
      );
    }
  }

  return result; // { USD: 118500, TRY: 4005 } به تومان
}

async function main() {
  const brsapiKey = process.env.BRSAPI_KEY;
  if (!brsapiKey) {
    throw new Error("متغیر BRSAPI_KEY تنظیم نشده است.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  });
  const db = admin.firestore();

  const tomanRates = await fetchRatesFromBrsApi(brsapiKey);
  const usdToman = tomanRates.USD;
  const tryToman = tomanRates.TRY;

  const tryToRial = tryToman * 10; // ۱ تومان = ۱۰ ریال
  const usdToRial = usdToman * 10;
  const tryToUsd = usdToman > 0 ? tryToman / usdToman : null;

  const payload = {
    tryToman,
    usdToman,
    tryToRial,
    usdToRial,
    tryToUsd,
    source: "brsapi.ir",
    updatedAt: new Date().toISOString(),
  };

  await db.collection("rates").doc("latest").set(payload, { merge: true });
  console.log("نرخ ارز با موفقیت به‌روزرسانی شد:", payload);
}

main().catch((err) => {
  console.error("خطا در اجرای اسکریپت همگام‌سازی نرخ:", err);
  process.exit(1);
});
