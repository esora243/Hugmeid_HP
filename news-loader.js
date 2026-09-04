/* ============================================================
 * news-loader.js — 記事データの統合ローダー（公開ページ用）
 * ------------------------------------------------------------
 * 表示優先度:
 *   1. microCMS（本番CMS。API「news」が作成済みなら自動で使われる）
 *   2. 管理ツール(admin.html)で保存した localStorage データ
 *   3. news-data.js の初期データ
 *
 * index.html / news.html はこのローダーを経由して記事を表示するため、
 * 管理画面での追加・編集・削除がそのままサイトに反映されます。
 * ============================================================ */
(function () {
  'use strict';

  var MICROCMS_DOMAIN = 'hugmeid';
  var API_KEY = '8uwainxJqQScCDcIlbtsMi8vMhtCZdTaPMEL';
  var ENDPOINT = 'https://' + MICROCMS_DOMAIN + '.microcms.io/api/v1/news';

  // microCMS のデータを共通形式 {date, category, title, excerpt} に揃える
  function normalize(items) {
    return (items || []).map(function (n) {
      var rawDate = n.publishedAt || n.createdAt || n.date || '';
      var d = String(rawDate).slice(0, 10); // YYYY-MM-DD
      var cat = Array.isArray(n.category) ? (n.category[0] || 'notice') : (n.category || 'notice');
      return {
        date: d,
        category: cat,
        title: n.title || '',
        excerpt: n.excerpt || n.body || ''
      };
    }).filter(function (n) { return n.title; });
  }

  function sortDesc(arr) {
    return arr.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  // ローカルデータ（管理画面の編集結果 → 初期データ）
  function loadLocal() {
    if (window.HugmadeNewsStore) {
      var saved = window.HugmadeNewsStore.get();
      if (saved) return sortDesc(saved);
      return sortDesc(window.HugmadeNewsStore.defaults());
    }
    if (window.HUGMADE_NEWS) return sortDesc(window.HUGMADE_NEWS);
    return [];
  }

  window.HugmadeNewsLoader = {
    // コールバックで記事配列（新しい順）を返す
    load: function (cb) {
      var done = function (items) {
        if (typeof cb === 'function') cb(items);
      };
      // 1) microCMS を試す（失敗しても画面は止めない）
      fetch(ENDPOINT + '?limit=100', {
        headers: { 'X-MICROCMS-API-KEY': API_KEY }
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }).then(function (data) {
        var items = normalize(data.contents);
        if (items.length) { done(sortDesc(items)); }
        else { done(loadLocal()); }
      }).catch(function () {
        // 2) microCMS が未作成/未接続の場合はローカルデータ
        done(loadLocal());
      });
    },
    loadLocal: loadLocal
  };
})();
