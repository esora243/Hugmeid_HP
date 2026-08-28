/* ============================================================
 * news-store.js — 新着記事データの読み込み / 保存ブリッジ
 * ------------------------------------------------------------
 * 【読み込み順】 news-data.js → news-store.js
 * admin.html（管理ツール）で保存した記事データが localStorage に
 * あれば、標準データ（news-data.js）より優先して反映します。
 *
 * 【本番反映について】
 * ・localStorage はこのブラウザ内だけで有効です。
 * ・本番サーバーへ反映するには、admin.html の
 *   「news-data.js を書き出す」でダウンロードしたファイルを
 *   サーバー上の news-data.js と差し替えてください。
 * ============================================================ */
(function () {
  'use strict';

  var KEY = 'hugmade_news';
  var CHANGE_EVENT = 'hugmade-news-updated';
  var ALLOWED_CATEGORIES = { achievement: true, event: true, media: true, notice: true };

  var DEFAULT = (typeof window.HUGMADE_NEWS !== 'undefined' && Array.isArray(window.HUGMADE_NEWS))
    ? JSON.parse(JSON.stringify(window.HUGMADE_NEWS))
    : [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function canUseStorage() {
    try {
      var testKey = '__hugmade_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  var storageAvailable = canUseStorage();

  function normalizeItem(item) {
    if (!item || typeof item !== 'object') return null;

    var rawDate = String(item.date || item.publishedAt || item.createdAt || '').trim();
    var date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : (function () {
          var d = new Date(rawDate);
          if (isNaN(d.getTime())) return '';
          return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        })();

    var category = Array.isArray(item.category) ? item.category[0] : item.category;
    category = ALLOWED_CATEGORIES[category] ? category : 'notice';

    var title = String(item.title || '').trim();
    var excerpt = String(item.excerpt || '').trim();
    if (!date || !title) return null;

    return {
      date: date,
      category: category,
      title: title,
      excerpt: excerpt
    };
  }

  function normalizeList(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeItem).filter(Boolean);
  }

  function readSaved() {
    if (!storageAvailable) return null;
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var arr = JSON.parse(raw);
      var normalized = normalizeList(arr);
      return normalized.length ? normalized : [];
    } catch (e) {
      return null;
    }
  }

  function readDefaults() {
    return normalizeList(clone(DEFAULT));
  }

  function getCurrent() {
    var saved = readSaved();
    return saved !== null ? saved : readDefaults();
  }

  function syncWindowData(arr) {
    window.HUGMADE_NEWS = normalizeList(arr);
    return window.HUGMADE_NEWS;
  }

  syncWindowData(getCurrent());

  window.HugmadeNewsStore = {
    KEY: KEY,
    CHANGE_EVENT: CHANGE_EVENT,
    isStorageAvailable: function () { return storageAvailable; },
    get: readSaved,
    getAll: function () { return clone(getCurrent()); },
    defaults: function () { return clone(readDefaults()); },
    normalizeList: function (arr) { return clone(normalizeList(arr)); },
    save: function (arr) {
      var normalized = normalizeList(arr);
      syncWindowData(normalized);
      if (!storageAvailable) return normalized;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(normalized));
      } catch (e) {
        console.error('ニュース保存に失敗しました', e);
      }
      try {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: clone(normalized) }));
      } catch (e) {
        // noop
      }
      return normalized;
    },
    clear: function () {
      syncWindowData(readDefaults());
      if (storageAvailable) {
        try { window.localStorage.removeItem(KEY); } catch (e) { console.error('ニュース初期化に失敗しました', e); }
      }
      try {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: clone(window.HUGMADE_NEWS) }));
      } catch (e) {
        // noop
      }
    },
    buildJS: function (arr) {
      var lines = [];
      lines.push('// ============ News data (shared by index.html & news.html) ============');
      lines.push('// 記事を追加する場合はこの配列に追記してください。');
      lines.push('// date: "YYYY-MM-DD" 形式');
      lines.push("// category: 'achievement' | 'event' | 'media' | 'notice'");
      lines.push('// ※ 管理ツール（admin.html）から書き出したデータです。');
      lines.push('window.HUGMADE_NEWS = [');
      var arr2 = normalizeList(arr || []);
      arr2.forEach(function (n, i) {
        lines.push('  {');
        lines.push("    date: '" + String(n.date || '').replace(/'/g, "\\'") + "',");
        lines.push("    category: '" + String(n.category || 'notice') + "',");
        lines.push("    title: '" + String(n.title || '').replace(/'/g, "\\'") + "',");
        lines.push("    excerpt: '" + String(n.excerpt || '').replace(/'/g, "\\'") + "'");
        lines.push('  }' + (i < arr2.length - 1 ? ',' : ''));
      });
      lines.push('];');
      return lines.join('\n');
    }
  };
})();
