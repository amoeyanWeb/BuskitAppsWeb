/**
 * ====================================================================
 *  Buskit — همگام‌سازی خودکار نرخ ارز (دلار و لیر ترکیه به تومان/ریال)
 * ====================================================================
 *
 * این Cloud Function هر روز دو بار (ساعت ۱۱:۰۰ صبح و ۲۳:۰۰ شب به وقت تهران)
 * اجرا می‌شود، نرخ لحظه‌ای دلار آمریکا (USD) و لیر ترکیه (TRY) را نسبت به
 * تومان از سرویس رایگان BrsApi.ir می‌گیرد و در Firestore ذخیره می‌کند.
 *
 * سپس در script.js (سمت کاربر)، به‌جای فراخوانی مستقیم یک API خارجی،
 * فقط همین سند Firestore خوانده می‌شود — سریع‌تر، پایدارتر و بدون
 * وابستگی به CORS/پراکسی برای هر بازدیدکننده.
 *
 * ------------------------------------------------------------------
 * راه‌اندازی (یک‌بار):
 * 1) از https://brsapi.ir ثبت‌نام کنید و یک "کلید رایگان" (Free API Key) بگیرید.
 * 2) آن کلید را به‌صورت زیر در پروژه‌ی Firebase تنظیم کنید (از ترمینال):
 *      firebase functions:config:set brsapi.key="YOUR_FREE_KEY"
 *    یا (در نسخه‌های جدیدتر functions v2 با dotenv/.env):
 *      در فایل functions/.env بنویسید:  BRSAPI_KEY=YOUR_FREE_KEY
 * 3) پروژه باید روی پلن Blaze باشد (برای دسترسی شبکه به بیرون)، اما چون
 *    این تابع فقط دو بار در روز اجرا می‌شود، عملاً هزینه‌ی آن تقریباً صفر است.
 * 4) دیپلوی:  firebase deploy --only functions
 * ------------------------------------------------------------------
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();

// کلید BrsApi از طریق Environment Parameter خوانده می‌شود (امن‌تر از هاردکد کردن در کد)
const BRSAPI_KEY = defineString("BRSAPI_KEY");

// نمادهایی که نیاز داریم: دلار آمریکا و لیر ترکیه (نسبت به تومان)
const SYMBOLS = ["USD", "TRY"];

/**
 * یک درخواست به BrsApi می‌زند و قیمت (به تومان) هر نماد را برمی‌گرداند.
 * مستندات: https://brsapi.ir/free-api-gold-currency-webservice/
 */
async function fetchRatesFromBrsApi(apiKey) {
  const url = `https://BrsApi.ir/Api/Market/Gold_Currency.php?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`BrsApi HTTP error: ${res.status}`);
  }
  const json = await res.json();

  // ساختار خروجی BrsApi معمولاً شامل یک آرایه currency است؛ هر آیتم دارای
  // symbol و price (به تومان) است. اگر ساختار واقعی کمی متفاوت بود،
  // فقط همین بخش پارس‌کردن را با نمونه‌ی واقعی خروجی تطبیق دهید.
  const currencyList = json.currency || json.Currency || [];
  const result = {};

  for (const item of currencyList) {
    const symbol = (item.symbol || item.name_en || "").toUpperCase();
    if (SYMBOLS.includes(symbol) && item.price) {
      result[symbol] = Number(String(item.price).replace(/,/g, ""));
    }
  }

  for (const sym of SYMBOLS) {
    if (!result[sym]) {
      throw new Error(`نرخ ${sym} در پاسخ BrsApi پیدا نشد`);
    }
  }

  return result; // مثال: { USD: 118500, TRY: 4005 }  (واحد: تومان)
}

/**
 * منطق اصلی: گرفتن نرخ‌ها، محاسبه و ذخیره در Firestore
 */
async function syncRates() {
  const apiKey = BRSAPI_KEY.value();
  if (!apiKey) {
    throw new Error(
      "کلید BRSAPI_KEY تنظیم نشده. با firebase functions:config:set یا .env مقداردهی کنید.",
    );
  }

  const tomanRates = await fetchRatesFromBrsApi(apiKey);

  const usdToman = tomanRates.USD; // ۱ دلار = چند تومان
  const tryToman = tomanRates.TRY; // ۱ لیر = چند تومان

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
  logger.info("نرخ ارز با موفقیت به‌روزرسانی شد:", payload);
  return payload;
}

/**
 * تابع زمان‌بندی‌شده: هر روز ساعت ۱۱:۰۰ و ۲۳:۰۰ به وقت تهران
 * (Cron: دقیقه ۰، ساعت ۱۱ و ۲۳، هر روز ماه، هر ماه، هر روز هفته)
 */
exports.syncExchangeRates = onSchedule(
  {
    schedule: "0 11,23 * * *",
    timeZone: "Asia/Tehran",
    retryCount: 2, // اگر یک‌بار به هر دلیلی (مثلاً قطعی موقت BrsApi) شکست خورد، دوباره تلاش کند
  },
  async () => {
    await syncRates();
  },
);

/**
 * (اختیاری ولی توصیه‌شده) یک تابع HTTP دستی برای تست فوری بدون نیاز به
 * صبر کردن تا ساعت زمان‌بندی‌شده. بعد از دیپلوی، فقط آدرس تابع را در
 * مرورگر باز کنید تا فوراً یک بار به‌روزرسانی انجام شود.
 * توجه: برای جلوگیری از سوءاستفاده، بعد از تست، این تابع را حذف یا
 * محدود به توکن مخفی کنید.
 */
const { onRequest } = require("firebase-functions/v2/https");
exports.syncExchangeRatesNow = onRequest(async (req, res) => {
  try {
    const data = await syncRates();
    res.status(200).json({ ok: true, data });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
