/* ============================================================
 * contact.js — お問い合わせフォーム送信処理
 * ------------------------------------------------------------
 * 【本番でメール受信する場合（推奨）】
 *   1. Formspree（https://formspree.io）などでフォームIDを作成
 *   2. 下の CONTACT_CONFIG.endpoint に送信先URLを設定
 *      例) endpoint: 'https://formspree.io/f/abcdwxyz'
 *   3. 設定後、送信内容はそのサービス経由でメールに届きます
 *
 * 【endpoint が空（未設定）の場合】
 *   送信内容はこのブラウザの localStorage に保存され、
 *   admin.html の「問い合わせ受信箱」で確認できます。
 *   あくまでデモ・ローカル用です。
 * ============================================================ */
var CONTACT_CONFIG = {
  endpoint: '' // ← ここに Formspree 等の送信先URLを設定（空の間はローカル受信箱に保存）
};

(function () {
  'use strict';
  var INBOX_KEY = 'hugmade_inquiries';
  var form = document.querySelector('form.form');
  if (!form) return;

  window.handleContactSubmit = function (e) {
    if (e) e.preventDefault();

    var nameEl = document.getElementById('name');
    var companyEl = document.getElementById('company');
    var emailEl = document.getElementById('email');
    var topicEl = document.getElementById('topic');
    var messageEl = document.getElementById('message');

    // メール形式チェック（HTML5 required の補助）
    var email = emailEl ? emailEl.value.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('メールアドレスの形式が正しくありません。', true);
      if (emailEl) emailEl.focus();
      return false;
    }

    var payload = {
      date: new Date().toISOString(),
      name: nameEl ? nameEl.value.trim() : '',
      company: companyEl ? companyEl.value.trim() : '',
      email: email,
      topic: topicEl ? topicEl.value : '',
      message: messageEl ? messageEl.value.trim() : ''
    };

    var submitBtn = form.querySelector('button[type="submit"]');
    function restoreBtn() {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '送信する →'; }
    }
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '送信中…'; }

    if (CONTACT_CONFIG.endpoint) {
      // ---- 外部フォームサービスへ送信 ----
      fetch(CONTACT_CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        showToast('お問い合わせありがとうございます。担当より2営業日以内にご連絡いたします。');
      })
      .catch(function () {
        showToast('送信に失敗しました。時間をおいて再度お試しください。', true);
      })
      .finally(restoreBtn);
    } else {
      // ---- ローカル受信箱に保存（admin.html で確認可） ----
      try {
        var list = JSON.parse(localStorage.getItem(INBOX_KEY)) || [];
        if (!Array.isArray(list)) list = [];
        list.unshift(payload);
        localStorage.setItem(INBOX_KEY, JSON.stringify(list));
        form.reset();
        showToast('お問い合わせありがとうございます。担当より2営業日以内にご連絡いたします。');
      } catch (err) {
        showToast('送信に失敗しました。時間をおいて再度お試しください。', true);
      }
      restoreBtn();
    }
    return false;
  };

  // ---- トースト表示（既存スタイルに影響しない専用クラス ct-） ----
  function showToast(msg, isError) {
    var old = document.getElementById('ct-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'ct-toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    if (isError) t.style.background = '#B0402F';
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('ct-toast-show'); }, 10);
    setTimeout(function () {
      t.classList.remove('ct-toast-show');
      setTimeout(function () { t.remove(); }, 400);
    }, 5000);
  }

  var style = document.createElement('style');
  style.textContent = '#ct-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,12px);' +
    'background:var(--navy-900,#0A2540);color:#FAFAF7;padding:14px 22px;font-size:13px;line-height:1.7;' +
    'opacity:0;transition:opacity .3s,transform .3s;z-index:9999;max-width:min(90vw,520px);text-align:center}' +
    '#ct-toast.ct-toast-show{opacity:1;transform:translate(-50%,0)}';
  document.head.appendChild(style);
})();
