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

  // news-data.js がセットした標準データ（リセット用に保持）
  var DEFAULT = (typeof window.HUGMADE_NEWS !== 'undefined' && Array.isArray(window.HUGMADE_NEWS))
    ? JSON.parse(JSON.stringify(window.HUGMADE_NEWS))
    : [];

  function readSaved() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : null;
    } catch (e) { return null; }
  }

  // 保存データがあれば標準データより優先
  var saved = readSaved();
  if (saved !== null) {
    window.HUGMADE_NEWS = saved;
  }

  window.HugmadeNewsStore = {
    KEY: KEY,
    get: readSaved,
    defaults: function () { return JSON.parse(JSON.stringify(DEFAULT)); },
    save: function (arr) {
      localStorage.setItem(KEY, JSON.stringify(arr));
      window.HUGMADE_NEWS = arr;
    },
    clear: function () {
      localStorage.removeItem(KEY);
    },
    // ダウンロード用の news-data.js ソースを生成（元ファイルと同形式）
    buildJS: function (arr, note) {
      var lines = [];
      lines.push('// ============ News data (shared by index.html & news.html) ============');
      lines.push('// 記事を追加する場合はこの配列に追記してください。');
      lines.push('// date: "YYYY-MM-DD" 形式');
      lines.push("// category: 'achievement' | 'event' | 'media' | 'notice'");
      lines.push('// ※ 管理ツール（admin.html）から書き出したデータです。');
      lines.push('window.HUGMADE_NEWS = [');
      var arr2 = arr || [];
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
