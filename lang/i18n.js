// =====================================================================
//  هسته‌ی چندزبانگی — معمولاً نیازی به ویرایش این فایل نیست.
//  هر زبان در فایل خودش (lang/<code>.js) است و فقط وقتی کاربر آن را
//  انتخاب کند (یا زبان ذخیره‌شده‌ی او باشد) بارگذاری می‌شود.
// =====================================================================
(function () {
  var LANGS = window.BUSKIT_LANGUAGES || [];
  var DEFAULT = window.BUSKIT_DEFAULT_LANG || (LANGS[0] && LANGS[0].code) || "en";
  var VERSION = window.BUSKIT_LANG_VERSION || 1;

  var translations = {}; // زبان‌های آماده‌ی استفاده
  var raw = {}; // داده‌ی خامِ ثبت‌شده، قبل از ترکیب با زبان جایگزین
  var pending = {}; // بارگذاری‌های در حال انجام
  var hooks = [];

  function meta(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return null;
  }

  function savedLang() {
    try {
      var s = localStorage.getItem("buskitLang");
      if (s && meta(s)) return s;
    } catch (e) {}
    return meta(DEFAULT) ? DEFAULT : LANGS[0] && LANGS[0].code;
  }

  function fileUrl(code) {
    return "lang/" + code + ".js?v=" + VERSION;
  }

  function done(code, data) {
    translations[code] = data;
    hooks.forEach(function (fn) {
      fn(code, data);
    });
  }

  // فایل هر زبان این تابع را صدا می‌زند
  function register(code, data) {
    raw[code] = data;
    // زبانِ کامل بلافاصله آماده است؛ زبانِ ناقص (با fallbackLang) در load() کامل می‌شود
    if (!data.fallbackLang || data.fallbackLang === code) done(code, data);
  }

  function injectScript(code) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = fileUrl(code);
      s.onload = resolve;
      s.onerror = function () {
        reject(new Error("فایل زبان پیدا نشد: " + s.src));
      };
      document.head.appendChild(s);
    });
  }

  function finalize(code) {
    var data = raw[code];
    var fb = data.fallbackLang;
    if (translations[code]) return Promise.resolve(translations[code]);
    if (!fb || fb === code) {
      done(code, data);
      return Promise.resolve(data);
    }
    // ترجمه‌ی ناقص: کلیدهای ترجمه‌نشده از زبان جایگزین (پیش‌فرض: انگلیسی) پر می‌شوند
    return load(fb).then(function () {
      var merged = Object.assign({}, translations[fb], data);
      var missing = Object.keys(translations[fb]).filter(function (k) {
        return !(k in data);
      });
      if (missing.length)
        console.warn(
          "[i18n] " + code + ": " + missing.length + " کلید هنوز ترجمه نشده (از " + fb + " استفاده شد):",
          missing,
        );
      done(code, merged);
      return merged;
    });
  }

  function load(code) {
    if (translations[code]) return Promise.resolve(translations[code]);
    if (!meta(code)) return Promise.reject(new Error("زبان ناشناخته: " + code));
    if (pending[code]) return pending[code];
    pending[code] = (raw[code] ? Promise.resolve() : injectScript(code))
      .then(function () {
        if (!raw[code]) throw new Error("فایل lang/" + code + ".js زبان را ثبت نکرد (BuskitI18n.register)");
        return finalize(code);
      })
      .then(
        function (d) {
          delete pending[code];
          return d;
        },
        function (err) {
          delete pending[code];
          throw err;
        },
      );
    return pending[code];
  }

  var startLang = savedLang();

  window.BuskitI18n = {
    languages: LANGS,
    translations: translations,
    startLang: startLang,
    meta: meta,
    register: register,
    load: load,
    // هر زبانی که آماده شد (قبلی‌ها هم فوراً) به fn داده می‌شود
    onRegister: function (fn) {
      hooks.push(fn);
      Object.keys(translations).forEach(function (c) {
        fn(c, translations[c]);
      });
    },
    locale: function (code) {
      var m = meta(code);
      return (m && m.locale) || "en-US";
    },
    // زبان شروعِ صفحه را همزمان (قبل از script.js) بارگذاری می‌کند تا صفحه
    // هیچ‌وقت بدون متن نماند. اگر شکست بخورد، load() در DOMContentLoaded دوباره تلاش می‌کند.
    writeStartTag: function () {
      if (meta(startLang)) document.write('<script src="' + fileUrl(startLang) + '"><\/script>');
    },
  };
})();
