// ====================================================================
//  💰 قیمت‌گذاری — تنها جایی که باید برای تغییر قیمت هر محصول ویرایش شود
// ====================================================================
// برای تغییر قیمت هر آیتم فقط همین چند عدد رو عوض کن؛ همه‌جای سایت
// (کارت‌های فروشگاه، فرم خرید، محاسبه‌ی جمع کل) خودکار از همین می‌خونن.
const prices = {
  BZ: { M1: 150, Y1: 600, LT: 900 }, // لایسنس برنز (LiveFX): ماهانه / سالانه / دائم
  SV: { M1: 250, Y1: 950, LT: 1350 }, // لایسنس نقره‌ای (Live Music Tools): ماهانه / سالانه / دائم
  GL: { M1: 300, Y1: 1100, LT: 50 }, // لایسنس طلایی (Live Music Tools Pro): ماهانه / سالانه / دائم
  packi: 18, // پک کامل سخت‌افزاری i
  packb: 16, // پک کامل سخت‌افزاری B
  irig: 10, // دستگاه irig (تکی)
  brig: 8, // دستگاه Brig (تکی)
  wire: 5, // کابل استریو 3.5 میلیمتری
  mic: 6, // میکروفون گیره‌ای پیزو
  free: 0, // لایسنس رایگان 5 روزه
};
// ضریب تعدیل تبدیل لیر به تومان — روی نرخ خام لیر→ریال/تومان (که هر روز از
// سرور خونده میشه) ضرب میشه. مثلاً اگر نرخ خام میگه ۱۰۰ لیر = ۴۰۰ هزار تومان
// ولی می‌خوای معادل نمایش‌داده‌شده ۲۴۰ هزار تومان باشه، این عدد رو 0.6 بذار
// (400,000 × 0.6 = 240,000). فقط همین یک عدد رو تغییر بده، جای دیگه‌ای لازم
// نیست دستکاری بشه. عدد 1 یعنی بدون هیچ تعدیلی، دقیقاً همون نرخ خام.
const TOMAN_RATE_ADJUSTMENT = 0.6;
// نگاشت هر کارت فروشگاه (بر اساس آیدی p1..p16 که در index.html استفاده شده)
// به مقدار درست از آبجکت prices بالا — این همون ترتیبی هست که در متن اصلی
// index.html به‌صورت ${prices.XX.YY} مشخص شده بود.
const GRID_PRICE_MAP = {
  p1: prices.BZ.LT,
  p2: prices.SV.M1,
  p3: prices.BZ.Y1,
  p4: prices.BZ.M1,
  p5: prices.free,
  p6: prices.SV.Y1,
  p7: prices.GL.Y1,
  p8: prices.GL.LT,
  p9: prices.packi,
  p10: prices.SV.LT,
  p11: prices.irig,
  p12: prices.brig,
  p13: prices.wire,
  p14: prices.mic,
  p15: prices.packb,
  p16: prices.GL.M1,
};

// نگاشت pid کارت فروشگاه ← pid واقعیِ همان محصول در فرم خرید (مودال/PURCHASE_ITEMS)
// این نگاشت یک باگ قدیمی رو رفع می‌کنه: قبلاً با کلیک روی «خرید» بعضی کارت‌ها،
// چک‌باکس یک محصول کاملاً متفاوت در فرم خرید تیک می‌خورد (چون از یک شماره pid
// برای دو محصول متفاوت در دو بخش مختلف سایت استفاده شده بود).
const GRID_TO_MODAL_PID = {
  p1: "p1",
  p2: "p10",
  p3: "p3",
  p4: "p4",
  p6: "p9",
  p7: "p6",
  p8: "p2",
  p9: "p5",
  p10: "p8",
  p11: "p12",
  p12: "p13",
  p13: "p14",
  p14: "p15",
  p15: "p11",
  p16: "p7",
  // p5 لایسنس رایگان ۵ روزه است و در فرم خرید فروخته نمی‌شود (دکمه‌ی خرید ندارد)
};

// ====================================================================
//  🌐 ترجمه‌ها
// ====================================================================
// متن همه‌ی زبان‌ها دیگر اینجا نیست؛ هر زبان در فایل خودش است:
//   lang/fa.js ، lang/en.js ، lang/tr.js ، lang/de.js
// فهرست زبان‌ها در lang/languages.js و منطق بارگذاری در lang/i18n.js است.
// برای اضافه کردن زبان جدید فقط یک فایل به پوشه‌ی lang اضافه کنید
// (راهنما: lang/README.md) — به این فایل لازم نیست دست بزنید.
// این آبجکت با زبان‌های بارگذاری‌شده پر می‌شود: translations.fa / .en / ...
const translations = BuskitI18n.translations;
let currentLang = BuskitI18n.startLang;

// همگام‌سازی خودکار قیمت‌های نمایش داده‌شده روی کارت‌های فروشگاه (برای همه‌ی
// زبان‌ها) با GRID_PRICE_MAP — به‌جای این‌که مقدار هر قیمت به‌صورت جداگانه و
// دستی در متن ترجمه‌ی هر زبان نوشته شده باشه. یعنی فقط کافیه آبجکت prices در
// بالای فایل رو تغییر بدی؛ همه‌جا (همه‌ی زبان‌ها، کارت‌های فروشگاه، و فرم
// خرید) خودکار به‌روز میشه. این تابع برای هر زبانی که لود بشه اجرا می‌شود.
BuskitI18n.onRegister((code, data) => {
  Object.keys(GRID_PRICE_MAP).forEach((pid) => {
    data[pid + "PriceVal"] = String(GRID_PRICE_MAP[pid]);
  });
});

// ====== نرخ لیر ترکیه به ریال/دلار (خوانده‌شده از سرور Firestore) ======
// نرخ واقعی دیگر در مرورگر کاربر از یک API خارجی خوانده نمی‌شود.
// در عوض، خودِ سرور لایسنس (Render، index.js) هر روز به وقت استانبول
// ساعت ۱۳:۰۰ نرخ دلار/لیر (doviz.com و در صورت شکست Frankfurter) و ساعت
// ۱۵:۰۰ نرخ دلار/ریال بازار آزاد (bonbast و در صورت شکست brsapi) را می‌گیرد
// و در سند Firestore به آدرس rates/latest ذخیره می‌کند (نگاه کنید به بخش
// «نرخ ارز» در ابتدای index.js). اگر منبعی جواب ندهد هر ۳۰ دقیقه دوباره
// تلاش می‌شود و تا آن زمان آخرین نرخ معتبر (حتی مال روز قبل) همچنان همینجا
// خوانده می‌شود. اینجا فقط همان سند خوانده می‌شود — سریع، بدون CORS و بدون
// فشار به API بیرونی.
let tryToIrrRate = null; // ۱ لیر معادل چند ریال است
let tryToUsdRate = null; // ۱ لیر معادل چند دلار است
let ratesUpdatedAt = null; // تاریخ به‌روزرسانی نرخ (از فیرستور در صورت وجود، وگرنه لحظه‌ی دریافت در مرورگر)

async function fetchTryToIrrRate() {
  try {
    const doc = await db.collection("rates").doc("latest").get();
    if (!doc.exists) {
      console.warn("سند نرخ ارز هنوز در Firestore ساخته نشده است.");
      return;
    }
    const data = doc.data();
    if (data && data.tryToRial) {
      tryToIrrRate = data.tryToRial;
      tryToUsdRate = data.tryToUsd || null;
      // اگر سند فیرستور یک فیلد زمانی معتبر داشته باشد از همان استفاده می‌شود،
      // در غیر این صورت لحظه‌ی همین دریافت در مرورگر به عنوان تاریخ به‌روزرسانی در نظر گرفته می‌شود
      const tsField = data.updatedAt || data.lastUpdated || data.date || null;
      if (tsField && typeof tsField.toDate === "function") {
        ratesUpdatedAt = tsField.toDate();
      } else if (tsField) {
        ratesUpdatedAt = new Date(tsField);
      } else {
        ratesUpdatedAt = new Date();
      }
      updateRialPrices();
      if (typeof updateLicenseModalRatesUI === "function") {
        updateLicenseModalRatesUI();
      }
    } else {
      console.error("داده نرخ ارز در Firestore ناقص است:", data);
    }
  } catch (err) {
    console.error("خطا در خواندن نرخ ارز از Firestore:", err);
  }
}

// معادل ریالی هر قیمت رو کنار همون قیمت (لیر) می‌نویسه
// مبلغ ریالی رو به «میلیون» رند می‌کنه (برای اعداد کوچیک‌تر از ۱۰ میلیون، یک رقم اعشار نگه می‌داره)
// (این تابع برای سازگاری با کدهای قدیمی نگه داشته شده؛ نمایش فعلی کارت‌ها
// و فرم خرید از formatTomanUsdAmount استفاده می‌کنند)
function formatRialAmount(rialAmount, data) {
  const rialLabel = (data && data.rialLabel) || "ریال";
  const millionLabel = (data && data.millionLabel) || "میلیون";
  const millions = rialAmount / 1000000;
  const rounded =
    millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
  return `≈ ${rounded.toLocaleString("en-US")} ${millionLabel} ${rialLabel}`;
}

// معادل «تومان» و «دلار» یک مبلغ لیر رو با هم برمی‌گردونه، مثلاً:
// "≈ 24 میلیون تومان (~$28)"
// از tryToIrrRate (لیر->ریال) و tryToUsdRate (لیر->دلار) که در Firestore
// ذخیره شده استفاده می‌کنه. اگه نرخ دلار در دسترس نبود، فقط تومان نشون داده میشه.
function formatTomanUsdAmount(liraAmount, data) {
  const tomanLabel = (data && data.tomanLabel) || "تومان";
  const millionLabel = (data && data.millionLabel) || "میلیون";

  const rialAmount = liraAmount * tryToIrrRate * TOMAN_RATE_ADJUSTMENT;
  const tomanAmount = rialAmount / 10;
  const tomanMillions = tomanAmount / 1000000;
  const roundedToman =
    tomanMillions >= 10
      ? Math.round(tomanMillions)
      : Math.round(tomanMillions * 10) / 10;

  let usdPart = "";
  if (tryToUsdRate) {
    const usdAmount = liraAmount * tryToUsdRate;
    const roundedUsd =
      usdAmount >= 100
        ? Math.round(usdAmount)
        : Math.round(usdAmount * 100) / 100;
    usdPart = ` (~$${roundedUsd.toLocaleString("en-US")})`;
  }

  return `≈ ${roundedToman.toLocaleString("en-US")} ${millionLabel} ${tomanLabel}${usdPart}`;
}

// همان بروزرسانی، برای تمام محصولات (نه فقط p1..p5) روی هر PriceVal/RialVal
// موجود در صفحه اجرا می‌شود؛ اگر عنصر RialVal برای یک محصول وجود نداشته باشد
// به‌سادگی نادیده گرفته می‌شود، پس اضافه/کم‌کردن محصولات نیازی به تغییر این تابع ندارد.
function updateRialPrices() {
  if (!tryToIrrRate) return;
  const data = translations[currentLang] || {};
  const allPriceValEls = document.querySelectorAll('[id$="PriceVal"]');
  allPriceValEls.forEach((valEl) => {
    const pid = valEl.id.replace(/PriceVal$/, "");
    const rialEl = document.getElementById(pid + "RialVal");
    if (!rialEl) return;
    const liraPrice = parseFloat(valEl.innerText);
    if (!liraPrice || isNaN(liraPrice) || liraPrice <= 0) {
      rialEl.innerText = "";
      return;
    }
    rialEl.innerText = formatTomanUsdAmount(liraPrice, data);
  });
  if (typeof recalcPurchaseTotals === "function") {
    recalcPurchaseTotals();
  }
}

// دریافت اولیه‌ی نرخ از Firestore، و بازخوانی دوره‌ای آن هر یک ساعت
// (نرخ خودش فقط دو بار در روز توسط سرور به‌روز می‌شود؛ این تایمر صرفاً
// باعث می‌شود اگر کاربر صفحه را برای مدت طولانی باز نگه داشت، آخرین
// مقدار به‌روزشده روی سرور را هم بدون رفرش صفحه ببیند)
fetchTryToIrrRate();
setInterval(fetchTryToIrrRate, 60 * 60 * 1000);

// تغییر زبان: اگر فایل آن زبان هنوز لود نشده باشد اول از lang/<code>.js
// خوانده می‌شود و بعد متن‌ها روی صفحه اعمال می‌شوند.
let langRequestId = 0;
function changeLanguage(lang) {
  const reqId = ++langRequestId;
  if (translations[lang]) {
    applyLanguage(lang);
    return Promise.resolve();
  }
  return BuskitI18n.load(lang)
    .then(() => {
      // اگر کاربر در این فاصله زبان دیگری انتخاب کرد، این درخواست قدیمی است
      if (reqId === langRequestId) applyLanguage(lang);
    })
    .catch((err) => {
      console.error("خطا در بارگذاری فایل زبان:", err);
      if (reqId === langRequestId) {
        syncLangDropdown(currentLang);
        // اگر هیچ زبانی هنوز اعمال نشده، به زبان پیش‌فرض برگرد
        if (!translations[currentLang] && lang !== window.BUSKIT_DEFAULT_LANG) {
          return changeLanguage(window.BUSKIT_DEFAULT_LANG);
        }
      }
    });
}

function applyLanguage(lang) {
  currentLang = lang;
  try {
    localStorage.setItem("buskitLang", lang);
  } catch (e) {}
  const data = translations[lang];

  // تنظیم راست‌چین یا چپ‌چین بودن المان‌ها کل صفحه
  document.documentElement.lang = lang;
  document.documentElement.dir = data.dir;

  const body = document.body;
  body.className = "bg-darkBg text-slate-200 antialiased";
  body.classList.add("lang-" + lang);
  body.classList.add("dir-" + (data.dir === "rtl" ? "rtl" : "ltr"));

  // بروزرسانی عنوان تب مرورگر
  document.getElementById("siteTitle").innerText = data.title;

  // منوی هدر
  document.getElementById("navHome").innerText = data.navHome;
  document.getElementById("navAboutme").innerText = data.navAboutme;
  document.getElementById("navLiveFX").innerText = data.navLiveFX;
  const navBuskitFeaturesEl = document.getElementById("navBuskitToolsFeatures");
  if (navBuskitFeaturesEl)
    navBuskitFeaturesEl.innerText = data.navBuskitFeatures;
  const navHowtoUseEl = document.getElementById("navHowtoUse");
  if (navHowtoUseEl) navHowtoUseEl.innerText = data.navHowtoUse;
  document.getElementById("navFeatures").innerText = data.navFeatures;
  document.getElementById("navUsersReview").innerText = data.navUsersReview;
  document.getElementById("navVideos").innerText = data.navVideos;
  document.getElementById("navMessageme").innerText = data.navMessageme;
  document.getElementById("navContacts").innerText = data.navContacts;

  // منوی موبایل (همبرگری)
  document.getElementById("navHomeMobile").innerText = data.navHome;
  document.getElementById("navAboutmeMobile").innerText = data.navAboutme;
  document.getElementById("navLiveFXMobile").innerText = data.navLiveFX;
  const navBuskitFeaturesMobileEl = document.getElementById(
    "navBuskitToolsFeaturesMobile",
  );
  if (navBuskitFeaturesMobileEl)
    navBuskitFeaturesMobileEl.innerText = data.navBuskitFeatures;
  const navHowtoUseMobileEl = document.getElementById(
    "navLiveMusicToolsMobile",
  );
  if (navHowtoUseMobileEl) navHowtoUseMobileEl.innerText = data.navHowtoUse;
  document.getElementById("navFeaturesMobile").innerText = data.navFeatures;
  document.getElementById("navUsersReviewMobile").innerText =
    data.navUsersReview;
  document.getElementById("navVideosMobile").innerText = data.navVideos;
  document.getElementById("navMessagemeMobile").innerText = data.navMessageme;
  document.getElementById("navContactsMobile").innerText = data.navContacts;
  const headerCTAEl = document.getElementById("headerCTA");
  if (headerCTAEl) headerCTAEl.innerText = data.headerCTA;

  // بخش هیرو
  const heroBadgeEl = document.getElementById("heroBadge");
  if (heroBadgeEl) heroBadgeEl.innerText = data.heroBadge;
  document.getElementById("heroAppLabel").innerText = data.heroAppLabel;
  document.getElementById("heroTagline").innerText = data.heroTagline;
  document.getElementById("heroDesc").innerText = data.heroDesc;
  const heroVersionsEl = document.getElementById("heroVersions");
  if (heroVersionsEl) heroVersionsEl.innerText = data.heroVersions;
  const heroDownloadBtnEl = document.getElementById("heroDownloadBtn");
  if (heroDownloadBtnEl) heroDownloadBtnEl.innerText = data.heroDownloadBtn;
  const heroShopBtnEl = document.getElementById("heroShopBtn");
  if (heroShopBtnEl) heroShopBtnEl.innerText = data.heroShopBtn;

  const heroDownloadBtnToolsEl = document.getElementById(
    "heroDownloadBtnTools",
  );
  if (heroDownloadBtnToolsEl && data.heroDownloadBtnTools) {
    const toolsLines = data.heroDownloadBtnTools
      .split("\n")
      .map((line) => line.trim());
    const line1El = document.getElementById("heroDownloadBtnToolsLine1");
    if (line1El) line1El.innerText = toolsLines[0] || "";
  }
  const heroMyketTextEl = document.getElementById("heroDownloadBtnMyketText");
  if (heroMyketTextEl && data.heroDownloadBtnMyket)
    heroMyketTextEl.innerText = data.heroDownloadBtnMyket;
  const heroBazaarTextEl = document.getElementById("heroDownloadBtnBazaarText");
  if (heroBazaarTextEl && data.heroDownloadBtnBazaar)
    heroBazaarTextEl.innerText = data.heroDownloadBtnBazaar;
  const line2El = document.getElementById("heroDownloadBtnToolsLine2");
  if (line2El) line2El.innerText = data.heroDownloadBtnToolsLine2 || "";

  // تولتیپ‌های سه دکمه دانلود در بخش هیرو
  [
    "heroTipLiveFX1",
    "heroTipLiveFX2",
    "heroTipLiveFX3",
    "heroTipLiveFX4",
    "heroTipLMT1",
    "heroTipLMT2",
    "heroTipLMT3",
    "heroTipLMT4",
    "heroTipLMT5",
    "heroTipLMT6",
    "heroTipLMT7",
    "heroTipPro1",
    "heroTipPro2",
    "heroTipPro3",
    "heroTipPro4",
    "heroTipPro5",
    "heroTipPro6",
    "heroTipPro7",
  ].forEach((tipId) => {
    const tipEl = document.getElementById(tipId);
    if (tipEl && data[tipId]) tipEl.innerText = data[tipId];
  });

  // بخش درباره من
  document.getElementById("aboutTitle").innerText = data.aboutTitle;
  document.getElementById("aboutP1").innerHTML = data.aboutP1;
  document.getElementById("aboutP2").innerHTML = data.aboutP2;
  document.getElementById("aboutP3").innerText = data.aboutP3;
  document.getElementById("aboutP4").innerText = data.aboutP4;
  document.getElementById("aboutImg").alt = data.aboutImgAlt;

  // بخش LiveFX چیست
  document.getElementById("liveFXTitle").innerText = data.liveFXTitle;
  document.getElementById("liveFXSubtitle").innerText = data.liveFXSubtitle;
  document.getElementById("liveFXP1").innerText = data.liveFXP1;
  document.getElementById("liveFXP2").innerText = data.liveFXP2;
  document.getElementById("liveFXTag1").innerText = data.liveFXTag1;
  document.getElementById("liveFXTag2").innerText = data.liveFXTag2;
  document.getElementById("liveFXTag3").innerText = data.liveFXTag3;
  document.getElementById("liveFXTag4").innerText = data.liveFXTag4;
  document.getElementById("liveFXTag5").innerText = data.liveFXTag5;
  document.getElementById("liveFXTag6").innerText = data.liveFXTag6;
  document.getElementById("liveFXTag7").innerText = data.liveFXTag7;
  document.getElementById("liveFXTag8").innerText = data.liveFXTag8;
  document.getElementById("liveFXTag9").innerText = data.liveFXTag9;
  document.getElementById("liveFXTag10").innerText = data.liveFXTag10;
  document.getElementById("liveFXTag11").innerText = data.liveFXTag11;
  document.getElementById("liveFXTag12").innerText = data.liveFXTag12;
  document.getElementById("liveFXTag13").innerText = data.liveFXTag13;
  document.getElementById("liveFXTag14").innerText = data.liveFXTag14;
  document.getElementById("liveFXTag15").innerText = data.liveFXTag15;
  document.getElementById("liveFXTag16").innerText = data.liveFXTag16;
  document.getElementById("liveFXChainLabel").innerText = data.liveFXChainLabel;
  document.getElementById("liveFXChainText").innerText = data.liveFXChainText;
  document.getElementById("liveFXChainNote").innerText = data.liveFXChainNote;
  document.getElementById("liveFXP3").innerText = data.liveFXP3;
  document.getElementById("liveFXP4").innerText = data.liveFXP4;
  document.getElementById("liveFXP5").innerText = data.liveFXP5;
  //  document.getElementById("liveFXP6").innerText = data.liveFXP6;
  document.getElementById("liveFXP7").innerText = data.liveFXP7;
  document.getElementById("liveFXP8").innerText = data.liveFXP8;

  // بخش انواع نسخه‌های اپلیکیشن (برنزی، نقره‌ای، طلایی)
  const buskitFeaturesTitleEl = document.getElementById("buskitFeaturesTitle");
  if (buskitFeaturesTitleEl)
    buskitFeaturesTitleEl.innerText = data.buskitFeaturesTitle;
  [
    ["buskitBronze", 5],
    ["buskitSilver", 6],
    ["buskitGold", 8],
  ].forEach(([prefix, count]) => {
    const titleEl = document.getElementById(prefix + "Title");
    if (titleEl && data[prefix + "Title"])
      titleEl.innerText = data[prefix + "Title"];
    for (let i = 1; i <= count; i++) {
      const itemTextEl = document.querySelector(`#${prefix}${i} span:last-child`);
      if (itemTextEl && data[prefix + i]) itemTextEl.innerText = data[prefix + i];
    }
  });

  const bronzeGalleryTitleEl = document.getElementById("bronzeGalleryTitle");
  if (bronzeGalleryTitleEl && data.bronzeGalleryTitle)
    bronzeGalleryTitleEl.innerText = data.bronzeGalleryTitle;
  for (let n = 1; n <= 8; n++) {
    const bronzeImgEl = document.getElementById("bronzeGalleryImg" + n);
    if (bronzeImgEl && data.bronzeGalleryAlt)
      bronzeImgEl.alt = data.bronzeGalleryAlt + " " + n;
  }

  const silverGalleryTitleEl = document.getElementById("silverGalleryTitle");
  if (silverGalleryTitleEl && data.silverGalleryTitle)
    silverGalleryTitleEl.innerText = data.silverGalleryTitle;
  for (let n = 1; n <= 11; n++) {
    const silverImgEl = document.getElementById("silverGalleryImg" + n);
    if (silverImgEl && data.silverGalleryAlt)
      silverImgEl.alt = data.silverGalleryAlt + " " + n;
  }

  const goldGalleryTitleEl = document.getElementById("goldGalleryTitle");
  if (goldGalleryTitleEl && data.goldGalleryTitle)
    goldGalleryTitleEl.innerText = data.goldGalleryTitle;
  for (let n = 1; n <= 12; n++) {
    const goldImgEl = document.getElementById("goldGalleryImg" + n);
    if (goldImgEl && data.goldGalleryAlt)
      goldImgEl.alt = data.goldGalleryAlt + " " + n;
  }

  // بخش نحوه استفاده
  const liveMusicToolsTitleEl = document.getElementById("liveMusicToolsTitle");
  if (liveMusicToolsTitleEl)
    liveMusicToolsTitleEl.innerText = data.liveMusicToolsTitle;
  const liveMusicToolsSubtitleEl = document.getElementById(
    "liveMusicToolsSubtitle",
  );
  if (liveMusicToolsSubtitleEl)
    liveMusicToolsSubtitleEl.innerHTML = data.liveMusicToolsSubtitle;

  // بخش ویدیوها
  document.getElementById("videosTitle").innerText = data.videosTitle;
  document.getElementById("videosDesc").innerText = data.videosDesc;
  document.getElementById("v1Title").innerText = data.v1Title;
  document.getElementById("v2Title").innerText = data.v2Title;
  document.getElementById("v3Title").innerText = data.v3Title;
  document.getElementById("v4Title").innerText = data.v4Title;
  document.getElementById("v5Title").innerText = data.v5Title;
  document.getElementById("v6Title").innerText = data.v6Title;
  document.getElementById("v7Title").innerText = data.v7Title;
  document.getElementById("v8Title").innerText = data.v8Title;
  document.getElementById("v9Title").innerText = data.v9Title;

  // بخش ویژگی‌ها
  document.getElementById("featuresTitle").innerText = data.featuresTitle;
  document.getElementById("featuresDesc").innerText = data.featuresDesc;
  document.getElementById("f1Title").innerText = data.f1Title;
  document.getElementById("f1Desc").innerText = data.f1Desc;
  document.getElementById("f2Title").innerText = data.f2Title;
  document.getElementById("f2Desc").innerText = data.f2Desc;
  document.getElementById("f3Title").innerText = data.f3Title;
  document.getElementById("f3Desc").innerHTML = data.f3Desc;
  document.getElementById("f4Title").innerText = data.f4Title;
  document.getElementById("f4Desc").innerText = data.f4Desc;
  document.getElementById("f5Title").innerText = data.f5Title;
  document.getElementById("f5Desc").innerText = data.f5Desc;
  document.getElementById("f6Title").innerText = data.f6Title;
  document.getElementById("f6Desc").innerText = data.f6Desc;

  // بخش محصولات (هر 16 کارت محصول، نه فقط اولی)
  // document.getElementById("shopDescPayment").innerText = data.shopDescPayment;
  // document.getElementById("shopDescHardware").innerText = data.shopDescHardware;

  [
    "p1",
    "p2",
    "p3",
    "p4",
    "p5",
    "p6",
    "p7",
    "p8",
    "p9",
    "p10",
    "p11",
    "p12",
    "p13",
    "p14",
    "p15",
    "p16",
  ].forEach((pid) => {
    const badgeEl = document.getElementById(pid + "Badge");
    if (badgeEl) badgeEl.innerText = data[pid + "Badge"];

    const descEl = document.getElementById(pid + "Desc");
    if (descEl) descEl.innerText = data.shopProductNameLabel;

    const titleEl = document.getElementById(pid + "Title");
    if (titleEl) titleEl.innerText = data[pid + "Title"];

    ["B1", "B2", "B3", "B4", "B5"].forEach((bKey) => {
      const bEl = document.getElementById(pid + bKey);
      if (bEl && data[pid + bKey]) bEl.innerText = data[pid + bKey];
    });

    const priceLabelEl = document.getElementById(pid + "PriceLabel");
    if (priceLabelEl) priceLabelEl.innerText = data.shopPriceLabel;

    const priceValEl = document.getElementById(pid + "PriceVal");
    if (priceValEl) priceValEl.innerText = data[pid + "PriceVal"];

    const currencyEl = document.getElementById(pid + "Currency");
    if (currencyEl) currencyEl.innerText = data.shopCurrency;

    const btnEl = document.getElementById(pid + "Btn");
    if (btnEl) btnEl.innerText = data.shopBuyBtn;
  });

  document
    .querySelectorAll('button[onclick^="triggerModalPurchase("]')
    .forEach((btn) => (btn.innerText = data.shopBuyBtn));

  const p5LicenseLabelEl = document.getElementById("p5LicenseLabel");
  if (p5LicenseLabelEl) p5LicenseLabelEl.innerText = data.p5LicenseLabel;

  const disabledButtons = document.querySelectorAll(".btn-disabled-txt");
  disabledButtons.forEach((btn) => (btn.innerText = data.disabledTxt));

  // پاپ آپ خرید (فرم چند آیتمی)
  const modalProductNameEl = document.getElementById("modalProductName");
  if (modalProductNameEl)
    modalProductNameEl.innerText = data.purchaseModalTitle;

  // مرحله ۱: نام و ایمیل
  const purchaseStepContactDescEl = document.getElementById(
    "purchaseStepContactDesc",
  );
  if (purchaseStepContactDescEl)
    purchaseStepContactDescEl.innerText = data.purchaseStepContactDesc;
  const purchaseNameLabelEl = document.getElementById("purchaseNameLabel");
  if (purchaseNameLabelEl)
    purchaseNameLabelEl.innerText = data.purchaseNameLabel;
  const purchaseEmailLabelEl = document.getElementById("purchaseEmailLabel");
  if (purchaseEmailLabelEl)
    purchaseEmailLabelEl.innerText = data.purchaseEmailLabel;
  const purchaseCustomerNameEl = document.getElementById(
    "purchaseCustomerName",
  );
  if (purchaseCustomerNameEl && data.purchaseNamePlaceholder)
    purchaseCustomerNameEl.placeholder = data.purchaseNamePlaceholder;
  const btnPurchaseNextFromContactEl = document.getElementById(
    "btnPurchaseNextFromContact",
  );
  if (btnPurchaseNextFromContactEl)
    btnPurchaseNextFromContactEl.innerText = data.btnPurchaseNextFromContact;

  // مرحله ۲: کد تخفیف
  const purchaseStepDiscountDescEl = document.getElementById(
    "purchaseStepDiscountDesc",
  );
  if (purchaseStepDiscountDescEl)
    purchaseStepDiscountDescEl.innerText = data.purchaseStepDiscountDesc;
  const purchaseDiscountLabelEl = document.getElementById(
    "purchaseDiscountLabel",
  );
  if (purchaseDiscountLabelEl)
    purchaseDiscountLabelEl.innerText = data.purchaseDiscountLabel;
  const purchaseDiscountCodeInputEl = document.getElementById(
    "purchaseDiscountCodeInput",
  );
  if (purchaseDiscountCodeInputEl && data.purchaseDiscountPlaceholder)
    purchaseDiscountCodeInputEl.placeholder = data.purchaseDiscountPlaceholder;
  const btnApplyDiscountEl = document.getElementById("btnApplyDiscount");
  if (btnApplyDiscountEl) btnApplyDiscountEl.innerText = data.btnApplyDiscount;
  const btnSkipDiscountEl = document.getElementById("btnSkipDiscount");
  if (btnSkipDiscountEl) btnSkipDiscountEl.innerText = data.btnSkipDiscount;
  const btnBackToContactEl = document.getElementById("btnBackToContact");
  if (btnBackToContactEl) btnBackToContactEl.innerText = data.btnBackToContact;
  const purchaseDiscountRowLabelEl = document.getElementById(
    "purchaseDiscountRowLabel",
  );
  if (purchaseDiscountRowLabelEl)
    purchaseDiscountRowLabelEl.innerText = data.purchaseDiscountRowLabel;

  Object.keys(PURCHASE_ITEMS).forEach((pid) => {
    const nameEl = document.getElementById("chk_" + pid + "_name");
    if (nameEl && data.purchaseItemNames && data.purchaseItemNames[pid])
      nameEl.innerText = data.purchaseItemNames[pid];

    const priceEl = document.getElementById("chk_" + pid + "_price");
    if (priceEl)
      priceEl.innerText = PURCHASE_ITEMS[pid].price + " " + data.shopCurrency;
  });

  const purchaseSubtotalLabelEl = document.getElementById(
    "purchaseSubtotalLabel",
  );
  if (purchaseSubtotalLabelEl)
    purchaseSubtotalLabelEl.innerText = data.purchaseSubtotalLabel;
  const purchaseSubtotalRialLabelEl = document.getElementById(
    "purchaseSubtotalRialLabel",
  );
  if (purchaseSubtotalRialLabelEl)
    purchaseSubtotalRialLabelEl.innerText = data.purchaseSubtotalRialLabel;
  const purchaseShippingLabelEl = document.getElementById(
    "purchaseShippingLabel",
  );
  if (purchaseShippingLabelEl)
    purchaseShippingLabelEl.innerText = data.purchaseShippingLabel;
  const purchaseTotalLabelEl = document.getElementById("purchaseTotalLabel");
  if (purchaseTotalLabelEl)
    purchaseTotalLabelEl.innerText = data.purchaseTotalLabel;
  const purchaseTotalRialLabelEl = document.getElementById(
    "purchaseTotalRialLabel",
  );
  if (purchaseTotalRialLabelEl)
    purchaseTotalRialLabelEl.innerText = data.purchaseTotalRialLabel;

  const btnBackFormEl = document.getElementById("btnBackForm");
  if (btnBackFormEl) btnBackFormEl.innerText = data.btnBackForm;
  const btnFinalizeOrderEl = document.getElementById("btnFinalizeOrder");
  if (btnFinalizeOrderEl) btnFinalizeOrderEl.innerText = data.btnFinalizeOrder;

  // فوتر
  document.getElementById("footerTxt").innerText = data.footerTxt;

  // لینک صفحه‌ی حریم خصوصی در فوتر (privacy.html) — متن و زبان صفحه‌ی مقصد
  const footerPrivacyEl = document.getElementById("footerPrivacy");
  if (footerPrivacyEl) {
    footerPrivacyEl.innerText =
      data.privacyLabel || (translations.en && translations.en.privacyLabel) || "Privacy Policy";
    footerPrivacyEl.href = "privacy.html?lang=" + lang;
  }

  // پاپ آپ ثبت فیش
  const mContainer = document.getElementById("modalContainer");
  if (data.dir === "rtl") {
    mContainer.classList.remove("text-left");
    mContainer.classList.add("text-right");
  } else {
    mContainer.classList.remove("text-right");
    mContainer.classList.add("text-left");
  }

  document.getElementById("mBankHeading").innerText = data.mBankHeading;
  document.getElementById("mBankIranLabel").innerText = data.mBankIranLabel;
  document.getElementById("mBankIranOwner").innerText = data.mBankIranOwner;
  document.getElementById("mBankTrLabel").innerText = data.mBankTrLabel;

  const copyButtons = document.querySelectorAll(".copy-btn-txt");
  copyButtons.forEach((btn, idx) => {
    btn.innerText = idx === 0 ? data.copyBtnTxt : data.copyIbanTxt;
  });

  const lblFullNameEl = document.getElementById("lblFullName");
  if (lblFullNameEl) lblFullNameEl.innerText = data.lblFullName;
  const lblContactEl = document.getElementById("lblContact");
  if (lblContactEl) lblContactEl.innerText = data.lblContact;
  const lblReceiptFileEl = document.getElementById("lblReceiptFile");
  if (lblReceiptFileEl) lblReceiptFileEl.innerText = data.lblReceiptFile;
  const fileLabelTextEl = document.getElementById("fileLabelText");
  if (fileLabelTextEl) fileLabelTextEl.innerText = data.fileLabelText;
  const btnSubmitFormEl = document.getElementById("btnSubmitForm");
  if (btnSubmitFormEl) btnSubmitFormEl.innerText = data.btnSubmitForm;

  const fullNameEl = document.getElementById("fullName");
  if (fullNameEl) fullNameEl.placeholder = data.placeholderName;
  const userContactEl = document.getElementById("userContact");
  if (userContactEl) userContactEl.placeholder = data.placeholderContact;

  // بخش تماس با من
  document.getElementById("contactTitle").innerText = data.contactTitle;
  document.getElementById("contactDesc").innerText = data.contactDesc;
  document.getElementById("contactWhatsappLabel").innerText =
    data.contactWhatsappLabel;
  document.getElementById("contactInstagramLabel").innerText =
    data.contactInstagramLabel;
  document.getElementById("contactTiktokLabel").innerText =
    data.contactTiktokLabel;
  document.getElementById("contactEmailLabel").innerText =
    data.contactEmailLabel;
  document.getElementById("contactWhatsappLabel2").innerText =
    data.contactWhatsappLabel;
  document.getElementById("contactSocialTitle").innerText =
    data.contactSocialTitle;

  // بخش نظر کاربران
  document.getElementById("reviewsTitle").innerText = data.reviewsTitle;
  document.getElementById("reviewsDesc").innerText = data.reviewsDesc;
  document.getElementById("reviewNameLabel").innerText = data.reviewNameLabel;
  document.getElementById("reviewEmailLabel").innerText = data.reviewEmailLabel;
  document.getElementById("reviewRatingLabel").innerText =
    data.reviewRatingLabel;
  document.getElementById("reviewQuestionsLabel").innerText =
    data.reviewQuestionsLabel;
  document.getElementById("reviewSubmitBtn").innerText = data.reviewSubmitBtn;
  document.getElementById("reviewsSummaryTitle").innerText =
    data.reviewsSummaryTitle;
  const reviewsLoadingEl = document.getElementById("reviewsLoading");
  if (reviewsLoadingEl) reviewsLoadingEl.innerText = data.reviewsLoading;

  // بخش مدال معرفی اپلیکیشن
  document.getElementById("text1").innerText = data.text1;
  document.getElementById("text2").innerText = data.text2;
  document.getElementById("text3").innerText = data.text3;
  //  document.getElementById("appModalDownloadBtn").innerText =
  //   data.appModalDownloadBtn;
  // بخش پرسش و پاسخ
  document.getElementById("qaTitle").innerText = data.qaTitle;
  document.getElementById("qaDesc").innerText = data.qaDesc;
  document.getElementById("qaNameLabel").innerText = data.qaNameLabel;
  document.getElementById("qaMessageLabel").innerText = data.qaMessageLabel;
  document.getElementById("questionSubmitBtn").innerText = data.qaSubmitBtn;
  const questionsLoadingEl = document.getElementById("questionsLoading");
  if (questionsLoadingEl) questionsLoadingEl.innerText = data.qaLoading;

  // بازسازی محتوای دینامیک (سوالات ارزیابی، نظرات و پیام‌های ثبت‌شده) با زبان جدید
  if (typeof renderQuestionsPicker === "function") {
    renderQuestionsPicker();
  }
  if (typeof renderReviews === "function" && lastReviewsSnapshot) {
    renderReviews(lastReviewsSnapshot);
  }
  if (typeof renderQuestions === "function" && lastQuestionsSnapshot) {
    renderQuestions(lastQuestionsSnapshot);
  }

  // به‌روزرسانی معادل ریالی قیمت‌ها با زبان جدید (از نرخ کش‌شده استفاده می‌کند)
  if (typeof updateRialPrices === "function") {
    updateRialPrices();
  }

  const licenseModalTitleEl = document.getElementById("licenseModalTitle");
  if (licenseModalTitleEl && typeof updateLicenseModalTitle === "function") {
    updateLicenseModalTitle();
  } else if (licenseModalTitleEl) {
    licenseModalTitleEl.innerText = data.licenseModalTitle;
  }
  const licensePayableLabelEl = document.getElementById("licensePayableLabel");
  if (licensePayableLabelEl)
    licensePayableLabelEl.innerText = data.licensePayableLabel;
  const licenseTryLabelEl = document.getElementById("licenseTryLabel");
  if (licenseTryLabelEl) licenseTryLabelEl.innerText = data.licenseTryLabel;
  const licenseIrrLabelEl = document.getElementById("licenseIrrLabel");
  if (licenseIrrLabelEl) licenseIrrLabelEl.innerText = data.licenseIrrLabel;
  const licenseDiscountLabelEl = document.getElementById("licenseDiscountLabel");
  if (licenseDiscountLabelEl)
    licenseDiscountLabelEl.innerText = data.licenseDiscountLabel;
  const licenseDiscountIrrLabelEl = document.getElementById(
    "licenseDiscountIrrLabel",
  );
  if (licenseDiscountIrrLabelEl)
    licenseDiscountIrrLabelEl.innerText = data.licenseDiscountIrrLabel;
  const licenseBankHeadingEl = document.getElementById("licenseBankHeading");
  if (licenseBankHeadingEl)
    licenseBankHeadingEl.innerText = data.licenseBankHeading;
  const licenseBankIranLabelEl = document.getElementById("licenseBankIranLabel");
  if (licenseBankIranLabelEl)
    licenseBankIranLabelEl.innerText = data.licenseBankIranLabel;
  const licenseBankIranOwnerEl = document.getElementById("licenseBankIranOwner");
  if (licenseBankIranOwnerEl)
    licenseBankIranOwnerEl.innerText = data.licenseBankIranOwner;
  const licenseBankTrLabelEl = document.getElementById("licenseBankTrLabel");
  if (licenseBankTrLabelEl)
    licenseBankTrLabelEl.innerText = data.licenseBankTrLabel;
  const licenseBankTrOwnerEl = document.getElementById("licenseBankTrOwner");
  if (licenseBankTrOwnerEl)
    licenseBankTrOwnerEl.innerText = data.licenseBankTrOwner;
  const licenseDoneBankHeadingEl = document.getElementById(
    "licenseDoneBankHeading",
  );
  if (licenseDoneBankHeadingEl)
    licenseDoneBankHeadingEl.innerText = data.licenseDoneBankHeading;
  const licenseDoneBankIranLabelEl = document.getElementById(
    "licenseDoneBankIranLabel",
  );
  if (licenseDoneBankIranLabelEl)
    licenseDoneBankIranLabelEl.innerText = data.licenseDoneBankIranLabel;
  const licenseDoneBankIranOwnerEl = document.getElementById(
    "licenseDoneBankIranOwner",
  );
  if (licenseDoneBankIranOwnerEl)
    licenseDoneBankIranOwnerEl.innerText = data.licenseDoneBankIranOwner;
  const licenseDoneBankTrLabelEl = document.getElementById(
    "licenseDoneBankTrLabel",
  );
  if (licenseDoneBankTrLabelEl)
    licenseDoneBankTrLabelEl.innerText = data.licenseDoneBankTrLabel;
  const licenseDoneBankTrOwnerEl = document.getElementById(
    "licenseDoneBankTrOwner",
  );
  if (licenseDoneBankTrOwnerEl)
    licenseDoneBankTrOwnerEl.innerText = data.licenseDoneBankTrOwner;
  const btnLicenseReserveEl = document.getElementById("btnLicenseReserve");
  if (btnLicenseReserveEl) btnLicenseReserveEl.innerText = data.btnLicenseReserve;
  const btnLicenseBackFromInfoEl = document.getElementById(
    "btnLicenseBackFromInfo",
  );
  if (btnLicenseBackFromInfoEl)
    btnLicenseBackFromInfoEl.innerText = data.btnLicenseBack;
  const licenseFormDescEl = document.getElementById("licenseFormDesc");
  if (licenseFormDescEl) licenseFormDescEl.innerText = data.licenseFormDesc;
  const licenseNameLabelEl = document.getElementById("licenseNameLabel");
  if (licenseNameLabelEl) licenseNameLabelEl.innerText = data.licenseNameLabel;
  const licenseEmailLabelEl = document.getElementById("licenseEmailLabel");
  if (licenseEmailLabelEl) {
    // برچسب ایمیل شامل یک span متنی (توضیح داخل پرانتز) است؛ فقط گره متنیِ
    // ابتدای لیبل عوض می‌شود تا span داخلش دست‌نخورده بماند و جداگانه ترجمه شود
    for (const node of licenseEmailLabelEl.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = data.licenseEmailLabel + " ";
        break;
      }
    }
  }
  const licenseEmailHintEl = document.getElementById("licenseEmailHint");
  if (licenseEmailHintEl) licenseEmailHintEl.innerText = data.licenseEmailHint;
  const licenseWhatsappLabelEl = document.getElementById(
    "licenseWhatsappLabel",
  );
  if (licenseWhatsappLabelEl)
    licenseWhatsappLabelEl.innerText = data.licenseWhatsappLabel;
  const licenseCustomerWhatsappEl = document.getElementById(
    "licenseCustomerWhatsapp",
  );
  if (licenseCustomerWhatsappEl)
    licenseCustomerWhatsappEl.placeholder = data.licenseWhatsappPlaceholder;
  const licenseCustomerNameEl = document.getElementById("licenseCustomerName");
  if (licenseCustomerNameEl)
    licenseCustomerNameEl.placeholder = data.licenseNamePlaceholder;
  const btnLicenseSubmitFormEl = document.getElementById(
    "btnLicenseSubmitForm",
  );
  if (btnLicenseSubmitFormEl)
    btnLicenseSubmitFormEl.innerText = data.btnLicenseSubmitForm;
  const btnLicenseBackFromFormEl = document.getElementById(
    "btnLicenseBackFromForm",
  );
  if (btnLicenseBackFromFormEl)
    btnLicenseBackFromFormEl.innerText = data.btnLicenseBackToInfo;
  const licenseDoneMsgEl = document.getElementById("licenseDoneMsg");
  if (licenseDoneMsgEl) {
    licenseDoneMsgEl.innerText = buildLicenseDoneMsg(lang);
    // متن مرحله‌ی پایانی (اعلام موفقیت رزرو) در فارسی راست‌چین و در
    // انگلیسی/ترکی چپ‌چین نمایش داده می‌شود
    licenseDoneMsgEl.dir = data.dir === "rtl" ? "rtl" : "ltr";
    if (data.dir === "rtl") {
      licenseDoneMsgEl.classList.remove("text-left");
      licenseDoneMsgEl.classList.add("text-right");
    } else {
      licenseDoneMsgEl.classList.remove("text-right");
      licenseDoneMsgEl.classList.add("text-left");
    }
  }
  const btnLicenseBackFromDoneEl = document.getElementById(
    "btnLicenseBackFromDone",
  );
  if (btnLicenseBackFromDoneEl)
    btnLicenseBackFromDoneEl.innerText = data.btnLicenseBack;

  if (typeof updateLicenseModalRatesUI === "function") {
    updateLicenseModalRatesUI();
  }
}

// ====== سبد خرید چند آیتمی (لایسنس‌ها + سخت‌افزار) ======
// نگاشت هر شناسه محصول به قیمت (لیر) و اینکه آیا سخت‌افزار است (مشمول هزینه پست)
const PURCHASE_ITEMS = {
  p4: { price: prices.BZ.M1, hardware: false }, // لایسنس برنز - یک ماهه
  p3: { price: prices.BZ.Y1, hardware: false }, // لایسنس برنز - یک ساله
  p1: { price: prices.BZ.LT, hardware: false }, // لایسنس برنز - دائم
  p10: { price: prices.SV.M1, hardware: false }, // لایسنس نقره‌ای - یک ماهه
  p9: { price: prices.SV.Y1, hardware: false }, // لایسنس نقره‌ای - یک ساله
  p8: { price: prices.SV.LT, hardware: false }, // لایسنس نقره‌ای - دائم
  p7: { price: prices.GL.M1, hardware: false }, // لایسنس طلایی - یک ماهه
  p6: { price: prices.GL.Y1, hardware: false }, // لایسنس طلایی - یک ساله
  p2: { price: prices.GL.LT, hardware: false }, // لایسنس طلایی - دائم
  p5: { price: prices.packi, hardware: true }, // پک سخت‌افزاری i
  p11: { price: prices.packb, hardware: true }, // پک سخت‌افزاری B
  p12: { price: prices.irig, hardware: true }, // دستگاه irig
  p13: { price: prices.brig, hardware: true }, // دستگاه Brig
  p15: { price: prices.mic, hardware: true }, // میکروفون پیزو
  p14: { price: prices.wire, hardware: true }, // کابل 3.5 میلیمتری
};
const PURCHASE_SHIPPING_COST = 220; // لیر

function triggerModalPurchase(productKey) {
  const modalPid = GRID_TO_MODAL_PID[productKey] || productKey;
  // فروش قطعات سخت‌افزاری غیرفعال است؛ اگر محصول کلیک‌شده سخت‌افزار باشد
  // (چه از روی PURCHASE_ITEMS چه از روی خود دکمه)، مودال باز نمی‌شود.
  if (
    (PURCHASE_ITEMS[modalPid] && PURCHASE_ITEMS[modalPid].hardware) ||
    document.getElementById(productKey + "Btn")?.disabled
  ) {
    return;
  }
  openPurchaseModal();
  // productKey همون pid کارت فروشگاهه؛ چون pidهای فرم خرید با pidهای کارت‌های
  // فروشگاه یکی نیستن، اول به pid واقعی محصول در فرم خرید ترجمه‌اش می‌کنیم
  // (نگاه کن به GRID_TO_MODAL_PID در بالای فایل)
  // قبل از هرچیز همه چک‌باکس‌ها را خالی می‌کنیم و فقط محصول کلیک‌شده را انتخاب می‌کنیم
  Object.keys(PURCHASE_ITEMS).forEach((pid) => {
    const cb = document.getElementById("chk_" + pid);
    if (cb) cb.checked = pid === modalPid;
  });
  recalcPurchaseTotals();
}

function openPurchaseModal() {
  const modal = document.getElementById("purchaseModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  resetPurchaseWizard();
  recalcPurchaseTotals();
}

function closePurchaseModal() {
  const modal = document.getElementById("purchaseModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  Object.keys(PURCHASE_ITEMS).forEach((pid) => {
    const cb = document.getElementById("chk_" + pid);
    if (cb) cb.checked = false;
  });
  resetPurchaseWizard();
  recalcPurchaseTotals();
}

// ====== ویزارد چند مرحله‌ای فرم خرید: ۱) نام و ایمیل  ۲) کد تخفیف (اختیاری)  ۳) محصولات و ثبت سفارش ======
// طرف قبل از دیدن قیمت باید نام و ایمیلش را وارد کند. کد تخفیف در مرحله‌ی ۲
// فقط پیش‌نمایش می‌شود (بدون مصرف کردنش). مصرف واقعی کد و رزرو لایسنس(های)
// واقعی روی سرور لایسنس (buskitapps-license-server) فقط در انتهای مرحله‌ی ۳،
// وقتی کاربر محصولات را انتخاب کرد و روی «ثبت سفارش» زد، اتفاق می‌افتد —
// چون تازه آنجا معلوم می‌شود کدام تیر/مدت لایسنس باید ساخته شود.
//
// همه‌ی این عملیات از طریق دو مسیر HTTP روی همان سرور لایسنسی که اپ اندروید
// هم استفاده می‌کند انجام می‌شود (نه نوشتن مستقیم در Firestore از مرورگر)،
// چون کالکشن licenses همان کالکشنی است که /activate برای فعال‌سازی واقعی
// لایسنس استفاده می‌کند و اجازه‌ی نوشتن مستقیم در آن از سمت کلاینت یک حفره‌ی
// امنیتی جدی است.
const LICENSE_SERVER_URL = "https://buskitapps-license-server.onrender.com";

let purchaseCustomer = { name: "", email: "" };
let purchaseDiscount = null; // { code, percent, amount } — فقط پیش‌نمایش، هنوز مصرف نشده
let purchaseOrderFinalized = false;

// شناسه‌ی محصولاتی که واقعاً لایسنس تولید می‌کنند (برای همین‌ها است که
// می‌توان جداگانه تصمیم گرفت آیا کد تخفیف روی آن‌ها ثبت شود یا نه)
const PURCHASE_LICENSE_PIDS = [
  "p4",
  "p3",
  "p1",
  "p10",
  "p9",
  "p8",
  "p7",
  "p6",
  "p2",
];

// وقتی یک کد تخفیف در مرحله‌ی ۲ اعمال می‌شود، برای هر آیتم لایسنس‌داری که
// در مرحله‌ی ۳ انتخاب شده یک تیکِ کوچکِ «تخفیف» نشان می‌دهیم تا کاربر
// بتواند مشخص کند این کد فقط برای کدام لایسنس‌ها حساب شود (نه لزوماً همه‌ی
// آیتم‌های سفارش) — دقیقاً همان چیزی که آمار فروش هر نماینده را در پنل
// ادمین درست نگه می‌دارد.
function syncDiscountToggles() {
  PURCHASE_LICENSE_PIDS.forEach((pid) => {
    const wrap = document.querySelector(
      `.purchase-item-discount-toggle[data-pid="${pid}"]`,
    );
    if (!wrap) return;
    const itemChk = document.getElementById("chk_" + pid);
    const discountChk = document.getElementById("chk_" + pid + "_discount");
    const show = !!purchaseDiscount && !!(itemChk && itemChk.checked);
    wrap.classList.toggle("hidden", !show);
    // هر بار که تاگل تازه نمایان می‌شود، پیش‌فرض تیک‌خورده باشد
    if (show && discountChk && discountChk.dataset.touched !== "1") {
      discountChk.checked = true;
    }
  });
}

function hidePurchaseEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}
function showPurchaseEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function resetPurchaseWizard() {
  purchaseCustomer = { name: "", email: "" };
  purchaseDiscount = null;
  purchaseOrderFinalized = false;

  const nameInput = document.getElementById("purchaseCustomerName");
  const emailInput = document.getElementById("purchaseCustomerEmail");
  const codeInput = document.getElementById("purchaseDiscountCodeInput");
  if (nameInput) nameInput.value = "";
  if (emailInput) emailInput.value = "";
  if (codeInput) codeInput.value = "";

  // تاگل‌های «تخفیف» کنار هر آیتم را برای سفارش بعدی به حالت اولیه برگردان
  PURCHASE_LICENSE_PIDS.forEach((pid) => {
    const discountChk = document.getElementById("chk_" + pid + "_discount");
    if (discountChk) {
      discountChk.checked = true;
      delete discountChk.dataset.touched;
    }
  });
  syncDiscountToggles();

  hidePurchaseEl("purchaseContactError");
  hidePurchaseEl("purchaseDiscountMsg");
  hidePurchaseEl("purchaseDiscountRow");
  hidePurchaseEl("purchaseDiscountAppliedBanner");
  hidePurchaseEl("purchaseFinalizeMsg");

  const finalizeBtn = document.getElementById("btnFinalizeOrder");
  if (finalizeBtn) {
    finalizeBtn.disabled = false;
    finalizeBtn.classList.remove("hidden");
  }

  goToPurchaseStep("contact");
}

function goToPurchaseStep(step) {
  const steps = {
    contact: "purchaseStepContact",
    discount: "purchaseStepDiscount",
    products: "purchaseStepProducts",
  };
  Object.values(steps).forEach((id) => hidePurchaseEl(id));
  showPurchaseEl(steps[step]);
}

// حذف کاراکترهای نامرئی/کنترلی رایج (نیم‌فاصله، zero-width، RTL/LTR mark و...)
// که ممکنه با کیبورد فارسی موقع تایپ ایمیل به‌اشتباه وارد بشن و باعث بشن
// مرورگر دامنه رو به Punycode (مثلاً xn--gmail-nza.com) تبدیل کنه.
function sanitizeEmailInput(value) {
  return (value || "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .trim();
}

function isValidPurchaseEmail(email) {
  // فقط کاراکترهای استاندارد ASCII مجاز برای ایمیل رو قبول می‌کنیم
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

function handleContactStepNext() {
  const data = translations[currentLang] || {};
  const nameInput = document.getElementById("purchaseCustomerName");
  const emailInput = document.getElementById("purchaseCustomerEmail");
  const errorEl = document.getElementById("purchaseContactError");
  const name = (nameInput ? nameInput.value : "").trim();
  const email = sanitizeEmailInput(emailInput ? emailInput.value : "");
  if (emailInput) emailInput.value = email;

  if (!name || !email || !isValidPurchaseEmail(email)) {
    if (errorEl) {
      errorEl.innerText =
        data.purchaseContactError || "لطفاً نام و یک ایمیل معتبر وارد کنید.";
      errorEl.classList.remove("hidden");
    }
    return;
  }
  if (errorEl) errorEl.classList.add("hidden");

  purchaseCustomer = { name, email };
  goToPurchaseStep("discount");
}

function skipDiscountStep() {
  purchaseDiscount = null;
  hidePurchaseEl("purchaseDiscountRow");
  hidePurchaseEl("purchaseDiscountAppliedBanner");
  goToPurchaseStep("products");
  recalcPurchaseTotals();
  syncDiscountToggles();
}

// فقط یک پیش‌نمایش: از سرور لایسنس می‌پرسیم این کد اصلاً وجود دارد یا نه،
// بدون این‌که چیزی را تغییر بدهیم. کد تخفیف یک‌بارمصرف نیست و هر بار
// (در finalizePurchaseOrder، انتهای مرحله‌ی محصولات) فقط آمار فروشش
// یک واحد زیاد می‌شود؛ خودِ کد همیشه معتبر و قابل استفاده‌ی مجدد می‌ماند.
async function applyDiscountCode() {
  const data = translations[currentLang] || {};
  const codeInput = document.getElementById("purchaseDiscountCodeInput");
  const msgEl = document.getElementById("purchaseDiscountMsg");
  const applyBtn = document.getElementById("btnApplyDiscount");
  const rawCode = (codeInput ? codeInput.value : "").trim();

  if (!rawCode) {
    // فیلد خالی رها شده: مثل زدن دکمه‌ی «ادامه بدون کد تخفیف» رفتار می‌کنیم
    skipDiscountStep();
    return;
  }
  const code = rawCode.toUpperCase();

  if (msgEl) {
    msgEl.className = "text-xs text-slate-400";
    msgEl.innerText =
      data.purchaseDiscountChecking || "در حال بررسی کد تخفیف...";
    msgEl.classList.remove("hidden");
  }
  if (applyBtn) applyBtn.disabled = true;

  try {
    const resp = await fetch(
      `${LICENSE_SERVER_URL}/check-discount/${encodeURIComponent(code)}`,
    );
    const result = await resp.json();

    if (!resp.ok || !result.valid) {
      let text;
      if (result.error === "used") {
        text =
          data.purchaseDiscountUsed || "این کد تخفیف قبلاً استفاده شده است.";
      } else if (result.error === "not-found") {
        text = data.purchaseDiscountInvalid || "کد تخفیف نامعتبر است.";
      } else {
        text =
          data.purchaseDiscountError ||
          "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.";
      }
      if (msgEl) {
        msgEl.className = "text-xs text-red-400";
        msgEl.innerText = text;
        msgEl.classList.remove("hidden");
      }
      return;
    }

    purchaseDiscount = {
      code,
      percent: Number(result.percent) || 0,
      amount: Number(result.amount) || 0,
    };

    if (msgEl) {
      msgEl.className = "text-xs text-emerald-400";
      msgEl.innerText =
        data.purchaseDiscountSuccess ||
        "کد تخفیف تایید شد و لایسنس شما رزرو گردید ✅";
      msgEl.classList.remove("hidden");
    }

    const bannerEl = document.getElementById("purchaseDiscountAppliedBanner");
    if (bannerEl) {
      const template =
        data.purchaseDiscountAppliedBannerText ||
        "کد تخفیف {code} برای شما اعمال شد.";
      bannerEl.innerText = template.replace("{code}", code);
      bannerEl.classList.remove("hidden");
    }

    recalcPurchaseTotals();
    syncDiscountToggles();
    setTimeout(() => {
      goToPurchaseStep("products");
    }, 900);
  } catch (err) {
    console.error("خطا در بررسی کد تخفیف:", err);
    if (msgEl) {
      msgEl.className = "text-xs text-red-400";
      msgEl.innerText =
        data.purchaseDiscountError ||
        "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.";
      msgEl.classList.remove("hidden");
    }
  } finally {
    if (applyBtn) applyBtn.disabled = false;
  }
}

// ── ثبت نهایی سفارش (دکمه‌ی «ثبت سفارش» در مرحله‌ی محصولات) ────────────
// چه کد تخفیف اعمال شده باشد چه نه، همین‌جا (که محصولات مشخص‌اند) روی سرور
// لایسنس یک لایسنسِ واقعی و آماده (is_used:false) برای هر محصول نرم‌افزاریِ
// انتخاب‌شده رزرو می‌شود؛ دیگر نیازی نیست خودتان دستی لایسنس بسازید — فقط
// بعد از تایید واریزی از تب «لایسنس‌ها»ی پنل ادمین، کد رزروشده را کپی و برای
// مشتری ارسال می‌کنید.
async function finalizePurchaseOrder() {
  const data = translations[currentLang] || {};
  const msgEl = document.getElementById("purchaseFinalizeMsg");
  const finalizeBtn = document.getElementById("btnFinalizeOrder");

  const selectedItems = Object.keys(PURCHASE_ITEMS)
    .filter((pid) => {
      const cb = document.getElementById("chk_" + pid);
      return cb && cb.checked;
    })
    .map((pid) => {
      const nameEl = document.getElementById("chk_" + pid + "_name");
      const discountChk = document.getElementById("chk_" + pid + "_discount");
      // اگر کد تخفیفی فعال بود و این آیتم لایسنس‌دار است، وضعیت تیکِ
      // «تخفیف» کنارش تعیین می‌کند که آیا همین لایسنس با کد نماینده
      // حساب شود یا نه؛ برای آیتم‌هایی که تاگل ندارند (مثلاً سخت‌افزار)
      // یا وقتی اصلاً کدی اعمال نشده، discountApplied پیش‌فرض false است.
      const discountApplied =
        !!purchaseDiscount && !!(discountChk && discountChk.checked);
      return {
        productKey: pid,
        name: nameEl ? nameEl.innerText : pid,
        price: PURCHASE_ITEMS[pid].price,
        hardware: !!PURCHASE_ITEMS[pid].hardware,
        discountApplied,
      };
    });

  if (selectedItems.length === 0) {
    if (msgEl) {
      msgEl.className = "text-xs text-red-400";
      msgEl.innerText = "لطفاً حداقل یک محصول را انتخاب کنید.";
      msgEl.classList.remove("hidden");
    }
    return;
  }

  const hasLicenseItem = selectedItems.some((it) => !it.hardware);

  // فقط سخت‌افزار، بدون هیچ محصول نرم‌افزاری/لایسنس‌داری: چیزی برای رزرو
  // لایسنس نیست، پس نیازی به تماس با سرور نداریم — فقط تایید محلی نشان می‌دهیم.
  if (!hasLicenseItem) {
    purchaseOrderFinalized = true;
    if (msgEl) {
      msgEl.className = "text-xs text-emerald-400";
      msgEl.innerText = data.purchaseFinalizeMsg;
      msgEl.classList.remove("hidden");
    }
    if (finalizeBtn) finalizeBtn.classList.add("hidden");
    return;
  }

  if (finalizeBtn) finalizeBtn.disabled = true;
  if (msgEl) {
    msgEl.className = "text-xs text-slate-400";
    msgEl.innerText = "در حال ثبت سفارش...";
    msgEl.classList.remove("hidden");
  }

  try {
    const resp = await fetch(`${LICENSE_SERVER_URL}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discountCode: purchaseDiscount ? purchaseDiscount.code : null,
        name: purchaseCustomer.name,
        email: purchaseCustomer.email,
        items: selectedItems,
      }),
    });
    const result = await resp.json();

    if (!resp.ok || !result.success) {
      let text;
      if (result.error === "used") {
        text =
          data.purchaseDiscountUsed ||
          "این کد تخفیف در همین حین توسط شخص دیگری استفاده شد. لطفاً با پشتیبانی تماس بگیرید.";
      } else if (result.error === "not-found") {
        text = data.purchaseDiscountInvalid || "کد تخفیف نامعتبر است.";
      } else {
        text =
          data.purchaseDiscountError ||
          "خطا در ثبت سفارش. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.";
      }
      if (msgEl) {
        msgEl.className = "text-xs text-red-400";
        msgEl.innerText = text;
        msgEl.classList.remove("hidden");
      }
      if (finalizeBtn) finalizeBtn.disabled = false;
      return;
    }

    purchaseOrderFinalized = true;
    if (msgEl) {
      msgEl.className = "text-xs text-emerald-400";
      msgEl.innerText = data.purchaseFinalizeMsg;
      msgEl.classList.remove("hidden");
    }
    if (finalizeBtn) finalizeBtn.classList.add("hidden");
  } catch (err) {
    console.error("خطا در ثبت سفارش:", err);
    if (msgEl) {
      msgEl.className = "text-xs text-red-400";
      msgEl.innerText =
        data.purchaseDiscountError ||
        "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.";
      msgEl.classList.remove("hidden");
    }
    if (finalizeBtn) finalizeBtn.disabled = false;
  }
}

function formatLiraAmount(amount) {
  const data = translations[currentLang] || {};
  const currency = data.shopCurrency || "لیر";
  return amount.toLocaleString("en-US") + " " + currency;
}

// محاسبه مبلغ کل، هزینه پست و قیمت نهایی بر اساس آیتم‌های انتخاب‌شده
function recalcPurchaseTotals() {
  syncDiscountToggles();
  const data = translations[currentLang] || {};
  let subtotal = 0;
  let hardwareSelected = false;

  Object.keys(PURCHASE_ITEMS).forEach((pid) => {
    const cb = document.getElementById("chk_" + pid);
    if (cb && cb.checked) {
      subtotal += PURCHASE_ITEMS[pid].price;
      if (PURCHASE_ITEMS[pid].hardware) hardwareSelected = true;
    }
  });

  const shipping = hardwareSelected ? PURCHASE_SHIPPING_COST : 0;

  // اعمال کد تخفیف (در صورت وجود) روی مبلغ کل قبل از افزودن هزینه پست
  let discountAmount = 0;
  if (purchaseDiscount) {
    discountAmount =
      subtotal * ((purchaseDiscount.percent || 0) / 100) +
      (purchaseDiscount.amount || 0);
    discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
  }

  const total = subtotal - discountAmount + shipping;

  const subtotalLiraEl = document.getElementById("purchaseSubtotalLira");
  const shippingLiraEl = document.getElementById("purchaseShippingLira");
  const totalLiraEl = document.getElementById("purchaseTotalLira");
  const subtotalRialEl = document.getElementById("purchaseSubtotalRial");
  const totalRialEl = document.getElementById("purchaseTotalRial");
  const discountRowEl = document.getElementById("purchaseDiscountRow");
  const discountRowAmountEl = document.getElementById(
    "purchaseDiscountRowAmount",
  );

  if (subtotalLiraEl) subtotalLiraEl.innerText = formatLiraAmount(subtotal);
  if (shippingLiraEl) shippingLiraEl.innerText = formatLiraAmount(shipping);
  if (totalLiraEl) totalLiraEl.innerText = formatLiraAmount(total);

  if (discountRowEl && discountRowAmountEl) {
    if (discountAmount > 0) {
      discountRowAmountEl.innerText = "-" + formatLiraAmount(discountAmount);
      discountRowEl.classList.remove("hidden");
    } else {
      discountRowEl.classList.add("hidden");
    }
  }

  if (tryToIrrRate) {
    if (subtotalRialEl)
      subtotalRialEl.innerText =
        subtotal > 0 ? formatTomanUsdAmount(subtotal, data) : "—";
    if (totalRialEl)
      totalRialEl.innerText =
        total > 0 ? formatTomanUsdAmount(total, data) : "—";
  } else {
    if (subtotalRialEl) subtotalRialEl.innerText = "—";
    if (totalRialEl) totalRialEl.innerText = "—";
  }

  // نمایش/الزامی کردن فیلد آدرس پستی فقط در صورت انتخاب کالای سخت‌افزاری
  const addressField = document.getElementById("userAddress");
  const addressWrap = document.getElementById("addressFieldWrap");
  if (addressField && addressWrap) {
    if (hardwareSelected) {
      addressWrap.classList.remove("hidden");
      addressField.required = true;
    } else {
      addressWrap.classList.remove("hidden");
      addressField.required = false;
    }
  }
}

// ====== مودال معرفی اپ (امکانات + دانلود + راهنمای استفاده) ======
// متن‌های این پنجره برای هر زبان در فایل خودش است: lang/<code>.js ← کلید appModals
// (نمونه‌ها: lang/fa.js ، lang/en.js ، lang/tr.js)

// ====== ثبت آمار دانلود هر اپ در Firestore ======
// source: "site" یعنی دانلود از طریق دکمه‌ی داخل همین سایت (index.html)،
// "page" یعنی دانلود از طریق صفحه‌ی مستقل دانلود (download.html).
// جدا از شمارنده‌ی کل (count، برای سازگاری با قبل)، به تفکیک منبع هم یک
// شمارنده (siteCount/pageCount) و تاریخ آخرین دانلود (siteLastDownloadAt/
// pageLastDownloadAt) در همون سند ذخیره می‌شه تا در پنل ادمین قابل دیدن باشه.
function trackAppDownload(appKey, source) {
  console.log("[trackAppDownload] فراخوانی شد برای:", appKey, "منبع:", source);
  if (typeof db === "undefined" || !db) {
    console.warn("[trackAppDownload] متغیر db تعریف نشده — آمار ثبت نمی‌شود.");
    return;
  }
  const countField = source === "page" ? "pageCount" : "siteCount";
  const dateField = source === "page" ? "pageLastDownloadAt" : "siteLastDownloadAt";
  db.collection("downloads")
    .doc(appKey)
    .set(
      {
        count: firebase.firestore.FieldValue.increment(1),
        [countField]: firebase.firestore.FieldValue.increment(1),
        [dateField]: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    .then(() => console.log("[trackAppDownload] با موفقیت ثبت شد:", appKey, source))
    .catch((err) => console.error("خطا در ثبت آمار دانلود اپ:", err));
}

// ====== دانلود مستقیم اپلیکیشن Buskit-Tools (از داخل خود سایت) ======
function downloadBuskitTools() {
  trackAppDownload("buskit-tools", "site");
  const link = document.createElement("a");
  link.href = "./downloads/BuskitTools_v1.apk";
  link.download = "BuskitTools_v1.apk";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// لینک اپلیکیشن در مایکت و کافه‌بازار را اینجا قرار دهید.
// تا وقتی خالی باشد، دکمه‌ها صفحه‌ی اصلی همان فروشگاه را باز می‌کنند.
const STORE_LINKS = {
  myket: "", // مثال: "https://myket.ir/app/your.package.name"
  bazaar: "", // مثال: "https://cafebazaar.ir/app/your.package.name"
};

function openStoreLink(appKey, link, fallback) {
  trackAppDownload(appKey, "site");
  window.open(link || fallback, "_blank", "noopener");
}

function downloadBuskitMyket() {
  openStoreLink("buskit-tools-myket", STORE_LINKS.myket, "https://myket.ir");
}

function downloadBuskitBazaar() {
  openStoreLink(
    "buskit-tools-bazaar",
    STORE_LINKS.bazaar,
    "https://cafebazaar.ir",
  );
}

function openAppModal(appKey) {
  // متن پنجره‌ی هر اپ از فایل زبان فعلی (appModals) خوانده می‌شود؛
  // اگر آن زبان این بخش را نداشت، نسخه‌ی انگلیسی نشان داده می‌شود.
  const langData = translations[currentLang] || {};
  const fallbackData = translations.en || {};
  const data =
    (langData.appModals && langData.appModals[appKey]) ||
    (fallbackData.appModals && fallbackData.appModals[appKey]);

  if (!data) return;

  document.getElementById("appModalTitle").innerText = data.title;
  document.getElementById("appModalSubtitle").innerText = data.subtitle;

  const featuresList = document.getElementById("appModalFeatures");
  featuresList.innerHTML = "";
  data.features.forEach((feature) => {
    const li = document.createElement("li");
    li.className =
      "bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-100 text-sm cursor-default hover:scale-105 hover:bg-white/10 hover:border-accentNeon/40 transition-transform duration-300";
    li.innerHTML = `<span class="text-accentNeon text-lg">●</span> ${feature}`;
    featuresList.appendChild(li);
  });

  document.getElementById("appModalDescription").innerText = data.description;

  // تصاویر نمونه از اپلیکیشن در این پنجره حذف شده و دیگر نمایش داده نمی‌شوند
  const shotsWrapper = document.getElementById("appModalScreenshotsWrapper");
  const shotsContainer = document.getElementById("appModalScreenshots");
  shotsContainer.innerHTML = "";
  shotsWrapper.classList.add("hidden");

  // const downloadBtn = document.getElementById("appModalDownloadBtn");
  // downloadBtn.onclick = () => {
  //   trackAppDownload(appKey);
  //   const link = document.createElement("a");
  //   link.href = data.downloadUrl;
  //   link.download = data.fileName || "";
  //   document.body.appendChild(link);
  ////   link.click();
  //   document.body.removeChild(link);
  // };

  const modal = document.getElementById("appInfoModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeAppModal() {
  const modal = document.getElementById("appInfoModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function openScreenshotLightbox(src) {
  document.getElementById("screenshotLightboxImg").src = src;
  document.getElementById("screenshotLightbox").style.display = "flex";
}

function closeScreenshotLightbox() {
  document.getElementById("screenshotLightbox").style.display = "none";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeScreenshotLightbox();
    closeAppModal();
  }
});

function copyToClipboard(text, button) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = button.innerText;
      const copiedData = translations[currentLang] || translations.en || {};
      button.innerText = copiedData.copiedLabel || "Copied!";
      button.style.color = "#10b981";
      setTimeout(() => {
        button.innerText = originalText;
        button.style.color = "";
      }, 2000);
    })
    .catch((err) => {
      console.error("Error copying text: ", err);
    });
}

// ====================================================================
//  💵 مودال خرید لایسنس با قیمت دلاری (دکمه‌ی «خرید لایسنس» زیر دکمه دانلود)
// ====================================================================
// این مودال مستقل از فرم چند مرحله‌ای فروشگاه (purchaseModal) است: یک مبلغ
// ثابت ۵۰ دلاری را با نرخ لحظه‌ای لیر/ریال (همان نرخی که از Firestore خونده
// میشه، در بالای فایل: tryToIrrRate و tryToUsdRate) به لیر و ریال تبدیل
// می‌کند و برای پرداخت از حساب ایران، تخفیف ۴۰٪ ویژه ایرانیان را نیز محاسبه
// و نمایش می‌دهد. در پایان فقط نام و ایمیل کاربر پرسیده می‌شود (بدون تماس با
// سرور لایسنس) و به او گفته می‌شود رسید واریزی را به ایمیل ما ارسال کند.
const LICENSE_USD_AMOUNT = 50; // مبلغ پایه لایسنس به دلار
const LICENSE_IRAN_DISCOUNT = 0.4; // ۴۰٪ تخفیف ویژه واریز به حساب ایران
// ضریب تعدیل معادل ریالی قیمت لایسنس — هر جا معادل ریال/تومان مبلغ ۵۰ دلاری
// لایسنس از روی نرخ لحظه‌ای دلار→ریال محاسبه می‌شود (هم متن پایانی مودال خرید
// لایسنس، هم مبلغ و تخفیف نمایش داده‌شده داخل خود مودال)، همین یک عدد در نرخ
// دلار→ریال ضرب می‌شود تا مبلغ نمایشی ارزان‌تر شود. مثلاً 0.6 یعنی معادل
// ریالیِ نمایش‌داده‌شده ۶۰٪ نرخ واقعی است. فقط همین عدد رو تغییر بده؛ روی
// معادل لیر یا خود مبلغ دلاری تأثیری ندارد. عدد 1 یعنی بدون هیچ تعدیلی.
const LICENSE_IRR_RATE_ADJUSTMENT = 0.6;

// مبلغ ریالیِ لایسنس، فیکس و مستقل از نرخ ارز: ۴,۶۰۰,۰۰۰ تومان (= ۴۶,۰۰۰,۰۰۰ ریال)
// این عدد دیگر در نرخ لیر/دلار ضرب نمی‌شود؛ فقط معادل لیری همچنان از نرخ لحظه‌ای محاسبه می‌شود.
const LICENSE_FIXED_TOMAN_AMOUNT = 4600000;
const LICENSE_FIXED_IRR_AMOUNT = LICENSE_FIXED_TOMAN_AMOUNT * 10;

function formatLicenseNumber(amount, maxFractionDigits) {
  const opts = { maximumFractionDigits: maxFractionDigits || 0 };
  return Number(amount).toLocaleString("en-US", opts);
}

// محاسبه معادل ریالی (فیکس، ضرب‌نشده در نرخ ارز) و لیری (بر اساس نرخ لحظه‌ای)
// مبلغ لایسنس. اگر نرخ لیر هنوز از Firestore دریافت نشده باشد null برمی‌گرداند.
function computeLicenseUsdAmounts() {
  if (!tryToUsdRate || !tryToIrrRate) return null;
  const usdToTry = 1 / tryToUsdRate;
  return {
    liraAmount: LICENSE_USD_AMOUNT * usdToTry,
    irrAmount: LICENSE_FIXED_IRR_AMOUNT,
  };
}

// متن پرانتزیِ «۵۰ دلار یا تتر، معادل ... ریال، همچنین معادل ... لیر ترکیه»
// که داخل پیام مرحله‌ی پایانی (Step C) جای توکن {{USD_PAREN}} می‌نشیند؛
// به هر چهار زبان سایت. اگر نرخ لحظه‌ای هنوز آمده نباشد، فقط «۵۰ دلار یا
// تتر» بدون معادل نمایش داده می‌شود.
function buildLicenseUsdParenText(lang) {
  const amounts = computeLicenseUsdAmounts();
  const data = translations[lang] || translations.en || {};
  if (!amounts) return data.licenseUsdParenNoRates || "(50 USD)";
  const irrText = formatLicenseNumber(amounts.irrAmount, 0);
  const tryText = formatLicenseNumber(amounts.liraAmount, 0);
  return (data.licenseUsdParen || "")
    .replace("{IRR}", irrText)
    .replace("{TRY}", tryText);
}

// متن کامل مرحله‌ی پایانی مودال خرید لایسنس، با جایگزینی توکن {{USD_PAREN}}
// داخل رشته‌ی ترجمه‌شده با معادل لحظه‌ای ریال/لیر.
function buildLicenseDoneMsg(lang) {
  const data = translations[lang] || {};
  const template = data.licenseDoneMsg || "";
  return template.replace("{{USD_PAREN}}", buildLicenseUsdParenText(lang));
}

// محاسبه و نمایش نرخ‌ها و مبالغ داخل مودال خرید لایسنس، بر اساس نرخ کش‌شده
// (tryToIrrRate / tryToUsdRate) و زبان فعلی؛ هم بعد از دریافت نرخ از سرور و
// هم بعد از تغییر زبان صدا زده می‌شود.
function updateLicenseModalRatesUI() {
  const data = translations[currentLang] || {};

  // با هر بار به‌روزرسانی نرخ (یا تغییر زبان)، معادل ریال/لیر داخل پیام
  // مرحله‌ی پایانی (Step C) هم دوباره محاسبه و جایگزین می‌شود
  const licenseDoneMsgEl = document.getElementById("licenseDoneMsg");
  if (licenseDoneMsgEl)
    licenseDoneMsgEl.innerText = buildLicenseDoneMsg(currentLang);

  const rateUsdTryEl = document.getElementById("licenseRateUsdTry");
  const rateUsdIrrEl = document.getElementById("licenseRateUsdIrr");
  const rateUpdatedEl = document.getElementById("licenseRateUpdatedValue");
  const payableUsdEl = document.getElementById("licensePayableUsd");
  const tryAmountEl = document.getElementById("licenseTryAmount");
  const irrAmountEl = document.getElementById("licenseIrrAmount");
  const irrDiscountedEl = document.getElementById("licenseDiscountIrrAmount");

  if (payableUsdEl) {
    payableUsdEl.innerText = "$" + LICENSE_USD_AMOUNT;
  }

  const currencyTry = data.shopCurrency || "لیر";
  const currencyIrr = data.rialLabel || "ریال";
  const dateLocale = BuskitI18n.locale(currentLang);

  if (!tryToUsdRate || !tryToIrrRate) {
    if (rateUsdTryEl)
      rateUsdTryEl.innerText =
        (data.licenseRateUsdTryLabel || "") + " " + (data.licenseRateLoading || "...");
    if (rateUsdIrrEl)
      rateUsdIrrEl.innerText =
        (data.licenseRateUsdIrrLabel || "") + " " + (data.licenseRateLoading || "...");
    if (rateUpdatedEl) rateUpdatedEl.innerText = "";
    if (tryAmountEl) tryAmountEl.innerText = "—";
    if (irrAmountEl) irrAmountEl.innerText = "—";
    if (irrDiscountedEl) irrDiscountedEl.innerText = "—";
    return;
  }

  // ۱ لیر = tryToUsdRate دلار  ⇐  ۱ دلار = 1/tryToUsdRate لیر
  const usdToTry = 1 / tryToUsdRate;
  // ۱ لیر = tryToIrrRate ریال و ۱ لیر = tryToUsdRate دلار ⇐ ۱ دلار = tryToIrrRate/tryToUsdRate ریال
  // (ضرب‌شده در LICENSE_IRR_RATE_ADJUSTMENT تا معادل ریالی نمایشی ارزان‌تر شود)
  const usdToIrr =
    (tryToIrrRate / tryToUsdRate) * LICENSE_IRR_RATE_ADJUSTMENT;

  const liraAmount = LICENSE_USD_AMOUNT * usdToTry;
  const irrAmount = LICENSE_USD_AMOUNT * usdToIrr;
  const irrDiscounted = irrAmount * (1 - LICENSE_IRAN_DISCOUNT);

  if (rateUsdTryEl)
    rateUsdTryEl.innerText =
      (data.licenseRateUsdTryLabel || "") +
      " " +
      formatLicenseNumber(usdToTry, 2) +
      " " +
      currencyTry;
  if (rateUsdIrrEl)
    rateUsdIrrEl.innerText =
      (data.licenseRateUsdIrrLabel || "") +
      " " +
      formatLicenseNumber(usdToIrr, 0) +
      " " +
      currencyIrr;
  if (rateUpdatedEl) {
    const updatedDate = ratesUpdatedAt || new Date();
    rateUpdatedEl.innerText =
      (data.licenseRateUpdatedLabel || "") +
      " " +
      updatedDate.toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  }
  if (tryAmountEl)
    tryAmountEl.innerText = formatLicenseNumber(liraAmount, 0) + " " + currencyTry;
  if (irrAmountEl)
    irrAmountEl.innerText = formatLicenseNumber(irrAmount, 0) + " " + currencyIrr;
  if (irrDiscountedEl)
    irrDiscountedEl.innerText =
      formatLicenseNumber(irrDiscounted, 0) + " " + currencyIrr;
}

// عنوان بالای مودال خرید لایسنس بسته به مرحله‌ی فعلی (اطلاعات/فرم یا پیام
// موفقیت پس از رزرو) عوض می‌شود؛ در مرحله موفقیت با کلاس چشمک‌زن سبز رنگ
// نمایش داده می‌شود (نگاه کن به .license-success-blink در استایل صفحه)
function updateLicenseModalTitle() {
  const data = translations[currentLang] || {};
  const titleEl = document.getElementById("licenseModalTitle");
  if (!titleEl) return;
  const doneStepEl = document.getElementById("licenseStepDone");
  const isDone = doneStepEl && !doneStepEl.classList.contains("hidden");
  const formStepEl = document.getElementById("licenseStepForm");
  const isForm = formStepEl && !formStepEl.classList.contains("hidden");
  if (isDone) {
    titleEl.innerText = data.licenseDoneTitle || "";
    titleEl.classList.add("license-success-blink");
    titleEl.classList.remove("text-white");
  } else {
    titleEl.innerText = isForm
      ? data.licenseFormTitle || data.licenseModalTitle || ""
      : data.licenseModalTitle || "";
    titleEl.classList.remove("license-success-blink");
    titleEl.classList.add("text-white");
  }
}

function goToLicenseStep(step) {
  const steps = {
    info: "licenseStepInfo",
    form: "licenseStepForm",
    done: "licenseStepDone",
  };
  Object.values(steps).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const target = document.getElementById(steps[step]);
  if (target) target.classList.remove("hidden");
  updateLicenseModalTitle();
}

function resetLicenseModal() {
  // با کلیک روی دکمه «دریافت لایسنس» در صفحه اصلی، مستقیماً فرم دریافت
  // مشخصات خریدار (نام/ایمیل/واتساپ) نمایش داده می‌شود و پنجره‌ی میانی
  // (اطلاعات حساب‌های بانکی و دکمه «رزرو لایسنس») حذف شده است. کاربر در
  // صورت نیاز می‌تواند از طریق دکمه «بازگشت به مرحله قبل» در همان فرم به آن
  // مرحله برگردد.
  goToLicenseStep("form");
  const nameInput = document.getElementById("licenseCustomerName");
  const emailInput = document.getElementById("licenseCustomerEmail");
  const whatsappInput = document.getElementById("licenseCustomerWhatsapp");
  const errorEl = document.getElementById("licenseFormError");
  if (nameInput) nameInput.value = "";
  if (emailInput) emailInput.value = "";
  if (whatsappInput) whatsappInput.value = "";
  if (errorEl) errorEl.classList.add("hidden");
}

function openLicensePurchaseModal() {
  const modal = document.getElementById("licensePurchaseModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  resetLicenseModal();
  updateLicenseModalRatesUI();
}

function closeLicensePurchaseModal() {
  const modal = document.getElementById("licensePurchaseModal");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  resetLicenseModal();
}

function showLicenseReserveForm() {
  goToLicenseStep("form");
}

async function submitLicenseReservation() {
  const data = translations[currentLang] || {};
  const nameInput = document.getElementById("licenseCustomerName");
  const emailInput = document.getElementById("licenseCustomerEmail");
  const whatsappInput = document.getElementById("licenseCustomerWhatsapp");
  const errorEl = document.getElementById("licenseFormError");
  const submitBtn = document.getElementById("btnLicenseSubmitForm");

  const name = (nameInput ? nameInput.value : "").trim();
  const email = sanitizeEmailInput(emailInput ? emailInput.value : "");
  const whatsapp = sanitizeEmailInput(whatsappInput ? whatsappInput.value : "");
  if (emailInput) emailInput.value = email;
  if (whatsappInput) whatsappInput.value = whatsapp;

  if (!name || !email || !isValidPurchaseEmail(email) || !whatsapp) {
    if (errorEl) {
      errorEl.innerText =
        data.licenseFormError ||
        "لطفاً نام، یک ایمیل معتبر و شماره واتس آپ خود را وارد کنید.";
      errorEl.classList.remove("hidden");
    }
    return;
  }
  if (errorEl) errorEl.classList.add("hidden");

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText =
      data.licenseSubmittingTxt || "در حال ثبت درخواست...";
  }

  // ── صدور فوری لایسنس ─────────────────────────────────────────────────
  // سرور یک لایسنس از نوع probation (۲ روزه، پیش از دریافت وجه) می‌سازد،
  // در Firestore ثبتش می‌کند و کد را همان لحظه با ایمیل — به زبانی که
  // کاربر در سایت انتخاب کرده — برای او می‌فرستد. ثبت سند licenseRequests
  // هم سمت سرور انجام می‌شود، پس دیگر لازم نیست سایت خودش چیزی در
  // Firestore بنویسد.
  try {
    const resp = await fetch(`${LICENSE_SERVER_URL}/request-probation-license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, whatsapp, lang: currentLang }),
    });
    const result = await resp.json().catch(() => ({}));

    if (resp.ok && result.success) {
      goToLicenseStep("done");
    } else if (result.error === "already-issued") {
      if (errorEl) {
        errorEl.innerText =
          data.licenseAlreadyIssued ||
          "برای این آدرس ایمیل قبلاً یک لایسنس صادر شده است.";
        errorEl.classList.remove("hidden");
      }
    } else if (result.error === "email-failed") {
      if (errorEl) {
        errorEl.innerText =
          data.licenseEmailFailed ||
          "لایسنس ساخته شد اما ارسال ایمیل با مشکل مواجه شد. لطفاً با پشتیبانی تماس بگیرید.";
        errorEl.classList.remove("hidden");
      }
    } else {
      throw new Error(result.error || "server-error");
    }
  } catch (err) {
    console.error("خطا در صدور لایسنس:", err);
    if (errorEl) {
      errorEl.innerText =
        data.licenseSubmitError ||
        "خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.";
      errorEl.classList.remove("hidden");
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = data.btnLicenseSubmitForm || "ثبت و دریافت لایسنس";
    }
  }
}

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    document.getElementById("licensePurchaseModal") &&
    !document.getElementById("licensePurchaseModal").classList.contains("hidden")
  ) {
    closeLicensePurchaseModal();
  }
});

// ====== غیرفعال‌سازی فروش قطعات سخت‌افزاری ======
// همه‌ی دکمه‌های «خرید» کارت‌های سخت‌افزاری (data-hardware="1") و همچنین
// چک‌باکس‌های مربوط به سخت‌افزار در فرم خرید (مودال صفحه‌ی دوم) را غیرفعال
// می‌کند. فقط کافیست فروش سخت‌افزار دوباره فعال شود، تابع زیر را حذف/کامنت کنید.
function disableHardwarePurchasing() {
  document.querySelectorAll('[data-hardware="1"]').forEach((el) => {
    el.disabled = true;
    if (el.checked) el.checked = false;
  });
}

// بارگذاری اولیه با زبان پیش‌فرض (فارسی)
window.addEventListener("DOMContentLoaded", () => {
  buildLangMenu();
  // زبان شروع (ذخیره‌شده یا پیش‌فرض) از فایل lang/<code>.js خوانده می‌شود.
  // selectLanguage علاوه بر changeLanguage، پرچم/برچسب دراپ‌داون را هم همگام می‌کند
  selectLanguage(BuskitI18n.startLang).finally(() => {
    disableHardwarePurchasing();
    if (typeof recalcPurchaseTotals === "function") {
      recalcPurchaseTotals();
    }
  });
});

// ====== بخش نظر کاربران (ذخیره در Firebase Firestore) ======

let selectedRating = 0;
const MAX_REVIEW_WORDS = 50;

// کلیدهای ثابت (زبان‌مستقل) سوالات ارزیابی و گزینه‌های پاسخ.
// برچسب نمایشی هرکدام از آبجکت translations[currentLang] خوانده می‌شود.
const REVIEW_QUESTION_KEYS = [0, 1, 2, 3, 4];
const ANSWER_KEYS = ["excellent", "good", "bad", "dontknow"];

function getReviewQuestions() {
  return (translations[currentLang] || {}).reviewQuestions || [];
}

function getAnswerLabel(key) {
  const data = translations[currentLang] || {};
  const map = {
    excellent: data.answerExcellent,
    good: data.answerGood,
    bad: data.answerBad,
    dontknow: data.answerDontKnow,
  };
  return map[key] || key;
}

// پاسخ فعلی هر سوال (index -> کلید پاسخ یا null)
let questionAnswers = new Array(REVIEW_QUESTION_KEYS.length).fill(null);

// نگاشت امتیاز ستاره‌ای به کلیدهای پاسخ پیش‌فرض ۵ سوال، وقتی کاربر سوالات را پر نکرده
const RATING_TO_DEFAULT_ANSWERS = {
  5: ["excellent", "excellent", "excellent", "excellent", "excellent"],
  4: ["excellent", "excellent", "excellent", "excellent", "good"],
  3: ["excellent", "excellent", "good", "good", "bad"],
  2: ["excellent", "good", "good", "bad", "bad"],
  1: ["good", "good", "bad", "bad", "bad"],
};

// رندر ۵ ستاره‌ی قابل کلیک
function renderStarPicker() {
  const container = document.getElementById("starPicker");
  container.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("button");
    star.type = "button";
    star.dataset.value = i;
    star.className =
      "star-btn text-5xl leading-none transition-colors duration-150 text-slate-300";
    star.innerText = "★";
    star.addEventListener("click", () => setRating(i));
    star.addEventListener("mouseenter", () => previewRating(i));
    container.appendChild(star);
  }
  container.addEventListener("mouseleave", () => paintStars(selectedRating));
}

// رنگ‌آمیزی ستاره‌ها تا مقدار مشخص شده (هم برای کلیک، هم برای پیش‌نمایش هاور)
function paintStars(value) {
  const stars = document.querySelectorAll("#starPicker .star-btn");
  stars.forEach((star, idx) => {
    if (idx < value) {
      star.classList.remove("text-slate-300");
      star.classList.add("text-accentNeon");
    } else {
      star.classList.remove("text-accentNeon");
      star.classList.add("text-slate-300");
    }
  });
}

function previewRating(value) {
  paintStars(value);
}

function setRating(value) {
  selectedRating = value;
  document.getElementById("reviewRating").value = value;
  paintStars(value);
}

// رندر ۵ سوال، هرکدام با ۴ گزینه‌ی قابل کلیک
function renderQuestionsPicker() {
  const container = document.getElementById("questionsPicker");
  container.innerHTML = "";
  const questions = getReviewQuestions();

  questions.forEach((q, qIndex) => {
    const row = document.createElement("div");
    row.className =
      "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-darkBg/60 border border-slate-800 rounded-xl px-4 py-3";

    const qLabel = document.createElement("span");
    qLabel.className = "text-slate-300 text-sm";
    qLabel.innerText = q.label;
    row.appendChild(qLabel);

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "flex items-center gap-2 flex-wrap";

    ANSWER_KEYS.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerText = getAnswerLabel(key);
      btn.dataset.key = key;
      const isSelected = questionAnswers[qIndex] === key;
      btn.className =
        "answer-opt text-xs px-3 py-1.5 rounded-full border transition-colors " +
        (isSelected
          ? "border-accentNeon text-accentNeon bg-accentNeon/10"
          : "border-slate-700 text-slate-400 hover:border-accentNeon");
      btn.addEventListener("click", () => setQuestionAnswer(qIndex, key));
      optionsWrap.appendChild(btn);
    });

    row.appendChild(optionsWrap);
    container.appendChild(row);
  });
}

function setQuestionAnswer(qIndex, key) {
  questionAnswers[qIndex] = key;
  const rows = document.querySelectorAll("#questionsPicker > div");
  const buttons = rows[qIndex].querySelectorAll(".answer-opt");
  buttons.forEach((btn) => {
    if (btn.dataset.key === key) {
      btn.classList.remove("border-slate-700", "text-slate-400");
      btn.classList.add(
        "border-accentNeon",
        "text-accentNeon",
        "bg-accentNeon/10",
      );
    } else {
      btn.classList.add("border-slate-700", "text-slate-400");
      btn.classList.remove(
        "border-accentNeon",
        "text-accentNeon",
        "bg-accentNeon/10",
      );
    }
  });
}

function resetQuestionAnswers() {
  questionAnswers = new Array(REVIEW_QUESTION_KEYS.length).fill(null);
  document.querySelectorAll("#questionsPicker .answer-opt").forEach((btn) => {
    btn.classList.add("border-slate-700", "text-slate-400");
    btn.classList.remove(
      "border-accentNeon",
      "text-accentNeon",
      "bg-accentNeon/10",
    );
  });
}

function showReviewError(msg) {
  const el = document.getElementById("reviewErrorMsg");
  el.innerText = msg;
  el.classList.remove("hidden");
}

function hideReviewError() {
  document.getElementById("reviewErrorMsg").classList.add("hidden");
}

async function submitReview(event) {
  event.preventDefault();
  hideReviewError();
  const data = translations[currentLang] || {};

  const name = document.getElementById("reviewName").value.trim();
  const email = document.getElementById("reviewEmail").value.trim();
  const rating = Number(document.getElementById("reviewRating").value);

  if (!name) {
    showReviewError(data.reviewErrName);
    return;
  }
  if (!rating || rating < 1 || rating > 5) {
    showReviewError(data.reviewErrRating);
    return;
  }

  const answeredCount = questionAnswers.filter((a) => a).length;
  // اگر کاربر به هیچ سوالی جواب نداده، بر اساس امتیاز ستاره‌ای تخمین می‌زنیم.
  // اگر حتی به یک سوال هم جواب داده، فقط همون جواب‌های واقعی رو ملاک قرار
  // می‌دیم و امتیاز ستاره‌ای دیگه در تعیین جواب سوالات نقشی نداره.
  const finalAnswers =
    answeredCount === 0 ? RATING_TO_DEFAULT_ANSWERS[rating] : questionAnswers;

  const submitBtn = document.getElementById("reviewSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = data.reviewSubmittingTxt;

  try {
    await db.collection("reviews").add({
      name,
      email: email || null,
      rating,
      answers: finalAnswers,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    document.getElementById("reviewForm").reset();
    setRating(0);
    resetQuestionAnswers();
  } catch (err) {
    console.error("خطا در ثبت نظر:", err);
    showReviewError(data.reviewErrSubmit);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = data.reviewSubmitBtn;
  }
}

function starsToHtml(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="${
      i <= rating ? "text-accentNeon" : "text-slate-500"
    }">★</span>`;
  }
  return html;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.innerText = str;
  return div.innerHTML;
}

function answersLineHtml(answers) {
  const questions = getReviewQuestions();
  return questions
    .map((q, idx) => {
      const key = answers && answers[idx] ? answers[idx] : null;
      const answerTxt = key ? getAnswerLabel(key) : "—";
      return `<span class="whitespace-nowrap">${escapeHtml(
        q.short,
      )}: <span class="text-slate-200">${escapeHtml(answerTxt)}</span></span>`;
    })
    .join('<span class="text-slate-700 mx-1">·</span>');
}

function updateSummary(snapshot) {
  const questions = getReviewQuestions();
  // شمارش عالی/خوب/بد به تفکیک هر سوال (بر اساس ایندکس)
  const counts = questions.map(() => ({
    excellent: 0,
    good: 0,
    bad: 0,
  }));

  snapshot.forEach((doc) => {
    const docData = doc.data();
    let answers = docData.answers || [];

    // اگه این نظر (مثلاً نظرات قدیمی‌تر از اضافه شدن ۵ سوال) هیچ پاسخ
    // معتبری نداره، از روی همون امتیاز ستاره‌ای تخمین می‌زنیم تا توی
    // خلاصه‌ی درصدها هم لحاظ بشه (این کار مستقل از زبان فعلی سایته).
    const hasValidAnswers = answers.some(
      (a) => a === "excellent" || a === "good" || a === "bad",
    );
    if (!hasValidAnswers) {
      const rating = Number(docData.rating) || 0;
      answers = RATING_TO_DEFAULT_ANSWERS[rating] || [];
    }

    answers.forEach((a, idx) => {
      if (!counts[idx]) return;
      if (a === "excellent") counts[idx].excellent++;
      else if (a === "good") counts[idx].good++;
      else if (a === "bad") counts[idx].bad++;
    });
  });

  const rowsContainer = document.getElementById("summaryRows");
  rowsContainer.innerHTML = "";

  questions.forEach((q, idx) => {
    const c = counts[idx];
    const total = c.excellent + c.good + c.bad;
    const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));

    const row = document.createElement("div");
    row.className =
      "flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm border-b border-slate-800/60 pb-3 last:border-0 last:pb-0";
    row.innerHTML = `
            <span class="text-slate-300">${escapeHtml(q.short)}</span>
            <span class="flex items-center gap-3 font-semibold">
              <span class="text-emerald-400">${escapeHtml(
                getAnswerLabel("excellent"),
              )}: ${pct(c.excellent)}%</span>
              <span class="text-sky-400">${escapeHtml(
                getAnswerLabel("good"),
              )}: ${pct(c.good)}%</span>
              <span class="text-rose-400">${escapeHtml(
                getAnswerLabel("bad"),
              )}: ${pct(c.bad)}%</span>
            </span>
          `;
    rowsContainer.appendChild(row);
  });
}

function renderReviews(snapshot) {
  const list = document.getElementById("reviewsList");

  updateSummary(snapshot);

  if (snapshot.empty) {
    list.innerHTML = `<p class="text-slate-500 text-sm text-center py-6">${(translations[currentLang] || {}).reviewsEmptyTxt}</p>`;
    return;
  }

  list.innerHTML = "";
  snapshot.forEach((doc) => {
    const r = doc.data();
    const item = document.createElement("div");
    item.className = "py-6 flex items-center justify-between flex-wrap gap-2";
    item.innerHTML = `
            <span class="text-white font-semibold">${escapeHtml(r.name)}</span>
            <span class="text-lg tracking-wider" dir="ltr">${starsToHtml(
              r.rating,
            )}</span>
          `;
    list.appendChild(item);
  });
}

let lastReviewsSnapshot = null;

function loadReviews() {
  db.collection("reviews")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        lastReviewsSnapshot = snapshot;
        renderReviews(snapshot);
      },
      (err) => {
        console.error("خطا در بارگذاری نظرات:", err);
        document.getElementById("reviewsList").innerHTML =
          `<p class="text-rose-400 text-sm text-center py-6">${(translations[currentLang] || {}).reviewsLoadErrorTxt}</p>`;
      },
    );
}

// ====== بخش پرسش و پاسخ ======

function showQuestionError(msg) {
  const el = document.getElementById("questionErrorMsg");
  el.innerText = msg;
  el.classList.remove("hidden");
}

function hideQuestionError() {
  document.getElementById("questionErrorMsg").classList.add("hidden");
}

async function submitQuestion(event) {
  event.preventDefault();
  hideQuestionError();
  const data = translations[currentLang] || {};

  const name = document.getElementById("questionName").value.trim();
  const message = document.getElementById("questionMessage").value.trim();

  if (!name) {
    showQuestionError(data.qaErrName);
    return;
  }
  if (!message) {
    showQuestionError(data.qaErrMessage);
    return;
  }

  const submitBtn = document.getElementById("questionSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = data.qaSubmittingTxt;

  try {
    await db.collection("questions").add({
      name,
      message,
      reply: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      repliedAt: null,
    });

    document.getElementById("questionForm").reset();
  } catch (err) {
    console.error("خطا در ثبت پیام:", err);
    showQuestionError(data.qaErrSubmit);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = data.qaSubmitBtn;
  }
}

function formatQuestionDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";
  return timestamp
    .toDate()
    .toLocaleDateString(BuskitI18n.locale(currentLang), {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
}

function renderQuestions(snapshot) {
  const list = document.getElementById("questionsList");
  const data = translations[currentLang] || {};

  if (snapshot.empty) {
    list.innerHTML = `<p class="text-slate-500 text-sm text-center py-6">${data.qaEmptyTxt}</p>`;
    return;
  }

  list.innerHTML = "";
  snapshot.forEach((doc) => {
    const q = doc.data();
    const item = document.createElement("div");
    item.className =
      "p-5 bg-darkCard/40 backdrop-blur-xl border border-white/10 rounded-2xl";
    item.innerHTML = `
            <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <span class="text-white font-semibold">${escapeHtml(
                q.name,
              )}</span>
              <span class="text-slate-500 text-xs">${formatQuestionDate(
                q.createdAt,
              )}</span>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">${escapeHtml(
              q.message,
            )}</p>
            ${
              q.reply
                ? `<div class="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                    <span class="text-accentNeon text-xs font-bold shrink-0">${escapeHtml(
                      data.qaReplyLabel,
                    )}</span>
                    <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">${escapeHtml(
                      q.reply,
                    )}</p>
                  </div>`
                : `<p class="mt-3 text-slate-500 text-xs">${escapeHtml(
                    data.qaAwaitingReplyTxt,
                  )}</p>`
            }
          `;
    list.appendChild(item);
  });
}

let lastQuestionsSnapshot = null;

function loadQuestions() {
  db.collection("questions")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        lastQuestionsSnapshot = snapshot;
        renderQuestions(snapshot);
      },
      (err) => {
        console.error("خطا در بارگذاری پیام‌ها:", err);
        document.getElementById("questionsList").innerHTML =
          `<p class="text-rose-400 text-sm text-center py-6">${(translations[currentLang] || {}).qaLoadErrorTxt}</p>`;
      },
    );
}

// ====== انتخابگر زبان کاستوم (با پرچم واقعی) ======
// فهرست زبان‌ها (اسم، پرچم، locale) از lang/languages.js می‌آید و آیتم‌های منو
// خودکار از روی آن ساخته می‌شوند؛ برای زبان جدید اینجا کاری لازم نیست.
function buildLangMenu() {
  const list = document.getElementById("langDropdownList");
  if (!list) return;
  list.innerHTML = "";
  list.classList.add("max-h-80", "overflow-y-auto");
  BuskitI18n.languages.forEach((l) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.dataset.lang = l.code;
    li.className =
      "flex items-center gap-2 px-3 py-2.5 text-slate-200 hover:bg-white/10 hover:text-accentNeon cursor-pointer transition-colors";
    li.onclick = () => selectLanguage(l.code);
    const img = document.createElement("img");
    img.src = `https://flagcdn.com/24x18/${l.flag}.png`;
    img.srcset = `https://flagcdn.com/48x36/${l.flag}.png 2x`;
    img.width = 20;
    img.height = 15;
    img.alt = "";
    img.className = "rounded-[2px] shrink-0";
    const span = document.createElement("span");
    span.textContent = l.label;
    li.append(img, span);
    list.appendChild(li);
  });
}

// پرچم و برچسب دکمه‌ی منو را با زبان داده‌شده هماهنگ می‌کند
function syncLangDropdown(lang) {
  const info = BuskitI18n.meta(lang);
  if (!info) return;
  const flagEl = document.getElementById("langDropdownFlag");
  flagEl.src = `https://flagcdn.com/24x18/${info.flag}.png`;
  flagEl.srcset = `https://flagcdn.com/48x36/${info.flag}.png 2x`;
  document.getElementById("langDropdownLabel").innerText = info.label;
}

var langDropdownOpen = false;

function toggleLangDropdown() {
  langDropdownOpen = !langDropdownOpen;
  const list = document.getElementById("langDropdownList");
  const btn = document.getElementById("langDropdownBtn");
  const chevron = document.getElementById("langDropdownChevron");

  if (langDropdownOpen) {
    list.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");
    chevron.style.transform = "rotate(180deg)";
  } else {
    list.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
    chevron.style.transform = "";
  }
}

function closeLangDropdown() {
  if (!langDropdownOpen) return;
  langDropdownOpen = false;
  document.getElementById("langDropdownList").classList.add("hidden");
  document
    .getElementById("langDropdownBtn")
    .setAttribute("aria-expanded", "false");
  document.getElementById("langDropdownChevron").style.transform = "";
}

function selectLanguage(lang) {
  syncLangDropdown(lang);
  closeLangDropdown();
  return changeLanguage(lang);
}

// بستن منوی زبان با کلیک بیرون از آن
document.addEventListener("click", (e) => {
  const wrap = document.getElementById("langDropdownWrap");
  if (wrap && !wrap.contains(e.target)) closeLangDropdown();
});

// ====== منوی همبرگری موبایل ======
let mobileMenuOpen = false;

function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  const menu = document.getElementById("mobileMenu");
  const btn = document.getElementById("mobileMenuBtn");
  const l1 = document.getElementById("hamburgerLine1");
  const l2 = document.getElementById("hamburgerLine2");
  const l3 = document.getElementById("hamburgerLine3");

  if (mobileMenuOpen) {
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    btn.setAttribute("aria-expanded", "true");
    l1.style.transform = "translateY(7px) rotate(45deg)";
    l2.style.opacity = "0";
    l3.style.transform = "translateY(-7px) rotate(-45deg)";
  } else {
    menu.classList.add("hidden");
    menu.classList.remove("flex");
    btn.setAttribute("aria-expanded", "false");
    l1.style.transform = "";
    l2.style.opacity = "1";
    l3.style.transform = "";
  }
}

function closeMobileMenu() {
  if (!mobileMenuOpen) return;
  mobileMenuOpen = false;
  const menu = document.getElementById("mobileMenu");
  const btn = document.getElementById("mobileMenuBtn");
  menu.classList.add("hidden");
  menu.classList.remove("flex");
  btn.setAttribute("aria-expanded", "false");
  document.getElementById("hamburgerLine1").style.transform = "";
  document.getElementById("hamburgerLine2").style.opacity = "1";
  document.getElementById("hamburgerLine3").style.transform = "";
}

// اگر صفحه به حالت دسکتاپ بزرگ‌تر شد، منوی موبایل به‌صورت خودکار بسته شود
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) closeMobileMenu();
});

// ====== زیرمنوی Buskit-Tools در منوی موبایل ======
let buskitToolsSubmenuOpen = false;

function toggleBuskitToolsSubmenu() {
  buskitToolsSubmenuOpen = !buskitToolsSubmenuOpen;
  const submenu = document.getElementById("navBuskitToolsMobileSubmenu");
  const btn = document.getElementById("navBuskitToolsMobileBtn");
  const chevron = document.getElementById("navBuskitToolsMobileChevron");

  if (buskitToolsSubmenuOpen) {
    submenu.classList.remove("hidden");
    submenu.classList.add("flex");
    btn.setAttribute("aria-expanded", "true");
    chevron.style.transform = "rotate(180deg)";
  } else {
    submenu.classList.add("hidden");
    submenu.classList.remove("flex");
    btn.setAttribute("aria-expanded", "false");
    chevron.style.transform = "";
  }
}

renderStarPicker();
renderQuestionsPicker();
loadReviews();
loadQuestions();

// اسکرول نرم برای تمام لینک‌های منو

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href").substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      e.preventDefault(); // جلوگیری از پرش ناگهانی

      const headerOffset = 100; // فاصله از بالای صفحه (به خاطر هدر ثابت)
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth", // اسکرول نرم
      });
    }
  });
});

// ====== ورود مخفی به پنل ادمین با ۵ کلیک روی لوگو ======
let logoClickCount = 0;
let logoClickTimer = null;

function handleLogoClick() {
  logoClickCount++;

  if (logoClickTimer) clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => {
    logoClickCount = 0;
  }, 1500); // اگر ظرف ۱.۵ ثانیه ۵ کلیک ثبت نشه، شمارش صفر می‌شه

  if (logoClickCount >= 5) {
    logoClickCount = 0;
    clearTimeout(logoClickTimer);
    window.location.href = "./admin.html";
  }
}
