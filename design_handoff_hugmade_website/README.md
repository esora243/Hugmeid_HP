# Handoff: 株式会社はぐめいど コーポレートサイト

## Overview

株式会社はぐめいどは「医学生の情報格差を埋め、地域医療を支える医師を育てる」ことをミッションとする企業です。本デザインはそのコーポレートサイトの First Release にあたり、以下を目的とします:

- 事業内容(プラットフォーム/地域医療留学/キャリア支援)の紹介
- スポンサー企業・提携先からの問い合わせ獲得
- 事業実績・イベント開催報告・メディア掲載の随時発信(ニュース機能)

トップページ(`index.html`)と、ニュース一覧ページ(`news.html`)の 2 ページ構成です。

## About the Design Files

本パッケージに含まれる HTML/JS/画像 は **デザインリファレンス(HTML で作られた高精細プロトタイプ)** です。そのまま本番デプロイするためのコードではありません。

想定される実装方法は以下のいずれかです:

- **既存コードベースがある場合**: そのフレームワーク(Next.js / Nuxt / SvelteKit / Astro など)と既存のコンポーネント/デザイントークン規約に沿って、このデザインを **再構築** してください。
- **新規プロジェクトの場合**: 静的 or SSG に適するため、**Next.js (App Router) + Tailwind CSS** もしくは **Astro** の採用を推奨します。ニュース記事は将来的にヘッドレス CMS(microCMS / Contentful / Sanity)への差し替えを想定して、データ層を分離できる形で実装してください。

## Fidelity

**High-fidelity (hifi)**。カラー、タイポグラフィ、余白、レスポンシブ挙動、ホバー/フォーカス/リビール(スクロール連動フェードイン)アニメーションを含む、実装可能レベルの完成度でモックアップされています。

以下は仮のプレースホルダーであり、本番実装前に差し替えが必要です:

- ニュース記事(現状 7 件のダミーデータ入り)。詳細記事ページは未実装 — 記事詳細フローの設計は本ハンドオフのスコープ外です。
- Story セクションの地図イラスト(`assets/hero-map.png`, `story-map-japan.png`, `story-map-world.png`)。
- サービスカードの写真(`service-01-platform.jpg` / `service-02-rural.jpg` / `service-03-career.jpg`)は生成 AI 画像(Seedream v5 Pro)。本番運用時は撮り下ろし写真、または広報部で許諾済みの写真素材への差し替えを推奨します。
- お問い合わせフォームは `alert()` によるダミー送信。実装時は API エンドポイント(SendGrid / Resend / Formspree など)への POST に置き換えてください。

---

## Screens / Views

### 1. Home (index.html)

長尺 1 ページ構成のランディングページ。以下のセクションを縦に並べます。

#### 1-1. Nav (グローバルナビ)
- 固定表示 (position: fixed)。スクロール 20px 超で背景を半透明白 + backdrop-filter blur(12px) + 下線 1px に切り替え(`.nav.scrolled`)。
- 左: ブランド名「株式会社はぐめいど」(Noto Serif JP 600 / 18px)
- 中央リンク: `Story / Mission / Services / News` (13px, letter-spacing 0.04em)。840px 以下で非表示。
- 右: 「お問い合わせ」ピルボタン(navy-900 塗り、padding 10px 20px、hover で teal-600 + translateY(-1px))

#### 1-2. Hero (`#top`)
- 2 カラムグリッド(1.05fr : 0.95fr, gap: clamp(40px, 6vw, 80px))。900px 以下で 1 カラム。
- 左カラム:
  - H1: 「未来を創る**医師**を育む。」("医師" は teal-600)。Noto Serif JP 600 / clamp(32px, 5.2vw, 60px), line-height 1.3, letter-spacing -0.01em。
  - サブ: 「**国境を越える力は、地域を越える力になる。**株式会社はぐめいどは、海外留学支援を入口に、将来の地域医療を支える医師を育てています。」太字部分は下 35% にコーラルの下線(`linear-gradient(transparent 65%, rgba(232, 115, 90, 0.18) 65%)`)。Noto Serif JP / clamp(17px, 1.8vw, 21px)。
  - CTA 2 つ:
    - Primary: 「スポンサー企業として参画する →」(navy-900 塗り、ピル型、16px 30px)。hover: teal-600 + translateY(-2px) + 矢印 SVG 右へ translateX(4px)。
    - Ghost: 「私たちの物語を読む」(border 1px line-strong、hover で border navy-900 + 背景 paper-2)。
- 右カラム: `assets/hero-map.png`(世界と日本をつなぐ地図イラスト)。aspect-ratio 1:1, object-fit: contain, max-width 560px。

#### 1-3. Story (`#story`, class `.story`)
- 背景 `--paper-2`。
- Section head:
  - H2 (`.sec-title` に `style="font-size: 26px"` 上書き): 「自分の地域から、一歩外に出ることで<br>初めて気づく学び。<br>ここから、医師としての豊かさを育みます。」
  - Lede: 「現役医学生は、10 年後、20 年後の医療を担う存在です。**DX 化が進み、人間としての価値が求められる現代だからこそ**、患者に寄り添い、対話の中で本当に必要とされる医療を提供できる医師を育みます。」
- Story diagram (3 カラム: 1fr / auto / 1fr, 820px 以下で 1 カラム化):
  - Card 01「地域から見える、日本の医療のリアル。」+ 説明文 + `assets/story-map-japan.png`
  - Connector: `≈` (Fraunces italic 44px teal-600) — テキストラベルなし。
  - Card 02「海外から俯瞰する、日本の医療のリアル。」+ 説明文 + `assets/story-map-world.png`
  - カード: 背景 paper, border 1px line, padding clamp(28px, 3.5vw, 44px)。マップは aspect-ratio 16:10。
- Synthesis(下部の濃紺帯): navy-900 背景・paper 文字、"適応力" のみ teal-500 太字。「国境を越える力」と「地域を越える力」に共通するのは、適応力です。医学生という早期段階から、異文化交流や多文化理解について学ぶきっかけを創ります。

#### 1-4. CEO (`#ceo`)
- CEO grid(1 カラム, max-width 780px 中央寄せ):
  - H3「株式会社はぐめいど 運営事務局」(Noto Serif JP 600, clamp(22px, 2.4vw, 28px), navy-900)
  - `blockquote.ceo-quote`: 「地方の医学生でも、日本、そして世界各国で活躍できる場を実現します。」Noto Serif JP / clamp(18px, 2vw, 22px), 左に 2px teal-600 の縦線、padding-left 20px。
  - Bio: 「日本全国どこに居ても平等に情報を得ることのできるプラットフォームを構築し、医学生が『新しいことに挑戦する』ための情報インフラを構築します。」
- CEO 写真ブロックは非表示。META (統計) も非表示。

#### 1-5. Mission (`#mission`, class `.mission`)
- 背景 navy-900 全面、装飾として左上に teal 8%・右下にコーラル 5% の radial gradient オーバーレイ(`.mission::before`)。
- 中央寄せ (mission-inner, max-width 900px):
  - タグ: `Mission & Vision — 03` (JetBrains Mono, teal-500, letter-spacing 0.2em)
  - Statement: 「国境を越える力は、<br><span class="em">地域を越える力</span>になる。」`.em` は Fraunces italic 400, teal-500。Noto Serif JP 500, clamp(32px, 6vw, 68px)。
  - Desc: 「はぐめいどのミッション。それは、日本全国どの地域に居ても、平等な医療を受けることのできる環境を創ることです。」16px / 2 の行間、paper 75% 不透明色。

#### 1-6. Services (`#services`)
- タグ `What We Do — 04`、H2「情報格差の両側に、3 つの橋を架ける。」、Lede「オンライン・地方・対面。届き方の違う 3 つの事業を、同じ思想のもとで運営しています。」
- 3 カラムグリッド(gap 24px, 900px 以下で 1 カラム)。各カード:
  - 背景 paper、border 1px line、`overflow: hidden`
  - hover: border navy-900 + `translateY(-4px)` + 内部 img が `scale(1.04)`(transition 0.6s cubic-bezier(.2,.7,.2,1))
- カード構造 (**フォトカード**):
  - `.service-visual`: aspect-ratio 3/2 のフルブリード画像枠。`<img>` を `object-fit: cover`。
  - `.service-body`: padding clamp(24px, 2.5vw, 32px) x clamp(28px, 3vw, 40px)、縦積み。
    - `.service-num` (mono, 11px, 0.2em letter-spacing, ink-400)
    - `<h4>` (Noto Serif JP 600, 22px, navy-900)
    - `<p>` (14.5px, ink-700, line-height 1.9)
- Cards:
  - **01 / PLATFORM「プラットフォーム事業」**
    画像: `assets/service-01-platform.jpg`(3 人の学生がカフェテリアでスマホの記事を共有する写真)
    説明: 「日本全国の医学生に、将来の理想のキャリアと、その実現のために必要な情報を発信する、オンライン事業を運営しています。」
  - **02 / RURAL PROGRAM「地域医療留学プログラム」**
    画像: `assets/service-02-rural.jpg`(地方病院で医学生が高齢の地域住民と会話する写真)
    説明: 「『地方への適応』も"留学"と捉え直す、対面型のプログラムです。都市部と地方の医療情報格差を、実際に足を運べる仕組みで埋めていきます。」
  - **03 / CAREER EVENTS「医学生キャリア支援事業」**
    画像: `assets/service-03-career.jpg`(私服の医学生 6 名が机を囲み、奥に企業登壇者がいるワークショップ写真)
    説明: 「対面イベントを通じて、オンラインでは伝わりにくい『文脈』や『熱量』を届けます。企業と医学生の直接的な出会いの場を運営します。」

#### 1-7. News Preview (`#news`, class `.news-preview`)
- 背景 `--paper-2`。
- ヘッダ行 (`.news-head-row`): 左に sec-head「News — 05 / 最新のお知らせ。」(リード文なし)、右に「すべてのお知らせを見る →」ボタン(paper 背景 + border line-strong、hover で navy-900 塗り + paper 文字 + translateY(-2px))。720px 以下でボタンを下段に。
- リスト (`.news-preview-list`, `<div id="news-preview-list">`): `news-data.js` の `HUGMADE_NEWS` を日付降順ソート、先頭 4 件を JS でレンダー。
- Item 行(`.np-item`, `<a>` タグ, `href="news.html"`):
  - Grid: 130px(日付) / 130px(カテゴリタグ) / 1fr(タイトル) / auto(矢印)、780px 以下で 1 カラム。
  - Date: `MM.DD` を上、`YYYY` を下(mono, ink-500/400)
  - `.np-cat` タグ(4 種、カラーは Design Tokens 参照)
  - Title: Noto Serif JP 600, clamp(15px, 1.7vw, 17px), navy-900、hover で teal-600
  - Arrow SVG(右矢印、hover で translateX(4px) + teal-600)
  - 全体 hover: `rgba(10, 37, 64, 0.03)` 背景。

#### 1-8. Contact (`#contact`)
- 背景 `--paper-2`。
- タグ `Contact — 06`、H2「医学生と、共に何かを始めませんか。」、Lede: 「事業連携などのお問い合わせはこちらから。担当より 2 営業日以内にご連絡いたします。」
- 2 カラム(0.9fr : 1.1fr, 820px 以下で 1 カラム)。
- 左: 会社情報リスト(Company / Email / For)
  - Company: 「株式会社はぐめいど」
  - Email: `admin@new.hugmeid.com`(mailto: リンク、teal-600, hover で underline)
  - For: 「採用パートナー企業様/事業提携/メディア取材/医学生の方」
- 右: フォーム(白背景・border line・padding clamp(28px, 3.5vw, 44px))
  - Fields: お名前(required)、会社名/所属、メール(required)、お問い合わせ種別(select)、内容(textarea, required)
  - お問い合わせ種別のオプション: 「事業連携について」「その他」 の 2 択
  - ラベル: mono 11px, ink-500, 大文字, letter-spacing 0.12em。required 表示は右上に `*` (coral)。
  - Inputs: padding 14px 16px、border 1px line、focus で border navy-900。border-radius 0(角丸なし)。
  - Submit ボタン: navy-900 塗り、width 100%、padding 18px、hover teal-600。現状 `onsubmit` で alert 表示。

#### 1-9. Footer
- 背景 navy-900、paper 70% 不透明色、13px。
- 中身: ブランド「はぐめいど」(SVG マーク削除済み、テキストのみ)+ 「未来を創る医師を育む。」の説明文。
- 下部のコピーライト行(© 2026 HUG-MADE Inc.)は削除済み。

---

### 2. News List (news.html)

事業実績・イベント開催報告・メディア掲載・お知らせを掲載する一覧ページ。

#### 2-1. Nav
- index.html と同じ体裁。News リンクに `.active` クラスで teal-600 表示。他のアンカーは `index.html#story` 等の絶対アンカー。

#### 2-2. Page Head
- padding-top clamp(140px, 20vw, 200px)、下線 1px line。
- 2 カラム(1fr : auto, 720px 以下で 1 カラム)。
- 左: Eyebrow「News & Updates」、H1「最新のお知らせ」(Noto Serif JP 600, clamp(32px, 4.8vw, 56px))、Lede。
- 右: Entries in total カウンタ。数字は Fraunces 32px 500 navy-900、ラベルは mono 12px ink-500。

#### 2-3. Filter Tabs
- `position: sticky; top: 68px;` でスクロール追従。
- カテゴリタブ(すべて / 事業実績 / イベント / メディア掲載 / お知らせ)。
- ボタン: ピル型、border 1px line、padding 10px 20px、hover で navy-900、`.active` で navy-900 塗り+ paper 文字。
- 各ボタンにカテゴリ件数を `.cnt` (mono 11px) で表示。

#### 2-4. News List
- 縦積み、行と行の間に border-bottom 1px line。
- 行(`.news-item`): grid 140px / 140px / 1fr / auto, 780px 以下で 1 カラム。
- Date, Category tag, Title + Excerpt, Arrow の 4 要素。トップページの `.np-item` と同じ配色/挙動、Excerpt(p)が追加される点のみ違い。

#### 2-5. Pagination
- 1 ページ 8 件で自動分割(件数が 8 以下なら非表示)。
- ボタン: 40x40, mono 13px, border 1px line。`.active` で navy-900 塗り。
- 前/次矢印は非活性時 opacity 0.35 + cursor not-allowed。

#### 2-6. Empty State
- 表示件数 0 のとき「該当するお知らせはまだありません。」(Noto Serif JP 16px, ink-500, center)。

#### 2-7. Back-to-home CTA & Footer
- 「トップページに戻る →」ボタン付きの帯。
- Footer は index.html と同じ。

---

## Interactions & Behavior

### スクロール連動 (`.reveal`)
- IntersectionObserver で threshold 0.12、rootMargin `0px 0px -60px 0px`。
- 表示前: `opacity: 0; transform: translateY(24px)`(news 一覧は 16px)。
- 表示後: `opacity: 1; transform: none`。transition 0.9s cubic-bezier(.2,.7,.2,1)。
- `@media (prefers-reduced-motion: reduce)` で無効化。

### Nav スクロール状態
- `window.scrollY > 20` で `.nav.scrolled` を付与。背景・blur・下線を transition 0.3s ease で切り替え。

### ホバー
- Primary ボタン: `translateY(-2px)` + 背景 teal-600、矢印 `translateX(4px)`。250ms。
- News アイテム全体: 背景色 fade 200ms、タイトル文字色 → teal-600、矢印 `translateX(4px)`。
- **Service カード: `translateY(-4px)` + border navy-900 + 内部 img が `scale(1.04)`。300ms(カード) / 600ms(画像)。**

### スムーズスクロール
- `html { scroll-behavior: smooth; }` でネイティブに任せる。

### News rendering (共通データ)
- `news-data.js` が `window.HUGMADE_NEWS` に配列をセット。
- **Home** (`index.html`): 日付降順で先頭 4 件を `#news-preview-list` にレンダー。全アイテムが `news.html` へリンク。
- **News page** (`news.html`):
  - state: `{ filter: 'all', page: 1, perPage: 8 }`
  - `.filter-btn` クリックで state.filter を更新、`aria-selected` も同期。state.page を 1 にリセット。
  - `.pagination` クリックで prev/next/page 番号切り替え。切り替え時に `.news-section` を `scrollIntoView({ behavior: 'smooth', block: 'start' })`(実装先で `scrollIntoView` を避けたい場合は `window.scrollTo` に置き換え可)。

### Form
- 現状 `onsubmit="event.preventDefault(); alert(...)"`。実装時は POST エンドポイントに差し替え、成功/失敗トースト等を追加してください。バリデーションは HTML5 `required` のみを利用。

---

## State Management

**Home (index.html)**: 状態なし。純粋な静的レンダリング + News preview の初期化 JS のみ。

**News (news.html)**:
- `filter: 'all' | 'achievement' | 'event' | 'media' | 'notice'`
- `page: number`(1-indexed)
- `perPage: number`(定数 8)
- 派生値: `filtered()`(NEWS を state.filter で絞って date desc ソート)、`totalPages = Math.max(1, Math.ceil(filtered.length / perPage))`
- URL 反映は未実装。実装時は URL クエリ (`?category=event&page=2`) と同期させることを推奨。

**データ取得**: 現状はローカル配列。将来的にヘッドレス CMS を採用する場合、`news-data.js` を fetch に差し替えて同じ shape の配列を得られれば描画側の変更は最小限で済みます。

Shape:
```ts
type NewsItem = {
  date: string;      // "YYYY-MM-DD"
  category: 'achievement' | 'event' | 'media' | 'notice';
  title: string;
  excerpt: string;
};
```

---

## Design Tokens

CSS 変数として `:root` に定義済み(`index.html` / `news.html` の `<style>` 先頭)。

### Colors

| Token | Hex | 用途 |
|---|---|---|
| `--navy-900` | `#0A2540` | プライマリ文字色、CTA 背景、Mission/Footer 背景 |
| `--navy-800` | `#143559` | 予備 |
| `--navy-700` | `#1E4874` | メディアカテゴリタグ文字 |
| `--navy-500` | `#3D6A94` | メディアカテゴリタグ border |
| `--teal-600` | `#0891A6` | アクセント、リンク、ホバー、eyebrow |
| `--teal-500` | `#1BA7BC` | Mission 内アクセント |
| `--teal-100` | `#D6EEF2` | 事業実績タグ背景 |
| `--coral` | `#E8735A` | 必須マーカー、イベントタグ文字 |
| `--coral-soft` | `#F3A48F` | イベントタグ border |
| `--paper` | `#FAFAF7` | ベース背景 |
| `--paper-2` | `#F2F0EA` | セクション交互配色、副背景 |
| `--ink-900` | `#0F1B2A` | 本文色 |
| `--ink-700` | `#2C3B4F` | 副本文 |
| `--ink-500` | `#5A6B80` | 補助テキスト |
| `--ink-400` | `#8C99AB` | 淡いラベル、arrow |
| `--line` | `#DDD8CE` | 罫線 |
| `--line-strong` | `#B8B2A5` | 濃い罫線 |

### Typography

Google Fonts から読み込み:

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Noto+Sans+JP:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Token | Stack | 用途 |
|---|---|---|
| `--font-sans` | Noto Sans JP + system | 本文、UI |
| `--font-serif` | Noto Serif JP + Hiragino Mincho ProN | 見出し、リード文、引用 |
| `--font-display` | Fraunces + Noto Serif JP | 数字装飾、italic アクセント |
| `--font-mono` | JetBrains Mono | ラベル、日付、カテゴリタグ、番号 |

Scale の例:
- H1: clamp(32px, 5.2vw, 60px) / line-height 1.3 / letter-spacing -0.01em / weight 600
- H2: clamp(28px, 3.6vw, 44px) / 1.4 / -0.005em / 600(Story のみ 26px 固定に上書き)
- H3 (card / CEO): clamp(20px, 2.4vw, 28px) / 1.5 / 600
- Body: 15-16px / 1.9 / 400
- Mono label: 11-12px / letter-spacing 0.1-0.2em / uppercase

### Spacing

- Wrapper max-width: `1240px`
- Gutter: `clamp(20px, 4vw, 48px)`
- Section vertical padding: `clamp(80px, 12vw, 140px)`
- Mission section: `clamp(120px, 18vw, 200px)`
- Hero top padding: `clamp(140px, 20vw, 200px)`

### Radius

- Buttons/pills: `999px`
- Cards / inputs / 写真: `0`(意図的にスクエア)

### Shadows / Elevation

シャドウは基本使わず、border 1px + 微細な hover translateY で立体感を出しています。

### Motion

- Reveal: 0.9s cubic-bezier(.2, .7, .2, 1)、translateY(24px → 0)
- Hover: 200-300ms、translateY(-2px 〜 -4px)
- Service card image zoom on hover: `scale(1.04)`, 600ms cubic-bezier(.2, .7, .2, 1)
- Nav 切替: 300ms ease

### Breakpoints

- 900px: Hero, Services を 1 カラムに
- 840px: nav-links を非表示(モバイルメニュー未実装)
- 820px: Story diagram / CEO / Contact を 1 カラムに
- 780px: News アイテムを 1 カラム
- 720px: Page head を 1 カラム、`.backhome` を縦積み

モバイルメニュー(<840px)は未設計。実装時にドロワー等の追加を推奨。

---

## Assets

同梱パス: `design_handoff_hugmade_website/assets/`

| ファイル | 用途 | 出典 |
|---|---|---|
| `hero-map.png` | Hero 右カラムの世界地図 | 既存プロジェクト内アセット |
| `story-map-japan.png` | Story Card 01 の日本地図 | 既存プロジェクト内アセット |
| `story-map-world.png` | Story Card 02 の世界地図 | 既存プロジェクト内アセット |
| `service-01-platform.jpg` | Services Card 01 の写真 | Seedream v5 Pro 生成(要差し替え) |
| `service-02-rural.jpg` | Services Card 02 の写真 | Seedream v5 Pro 生成(要差し替え) |
| `service-03-career.jpg` | Services Card 03 の写真 | Seedream v5 Pro 生成(要差し替え) |

サービスカードのイラスト SVG は削除済み。写真素材の本番差し替え時は同じアスペクト比(3:2)・同じファイル名で置き換えれば HTML の変更は不要です。

---

## Files

このバンドルに含まれるファイル:

- `README.md` — 本ドキュメント
- `index.html` — トップページ(Nav / Hero / Story / CEO / Mission / Services / News Preview / Contact / Footer)
- `news.html` — ニュース一覧ページ(カテゴリフィルタ + ページネーション)
- `news-data.js` — 共有ニュースデータ(`window.HUGMADE_NEWS` にセット)
- `assets/` — 画像アセット一式(上表参照)

### 実装時の推奨アーキテクチャ

```
src/
  app/                        # or pages/
    page.tsx                  # Home
    news/
      page.tsx                # News list (with filter/pagination)
      [slug]/page.tsx         # 記事詳細 (将来拡張)
  components/
    layout/
      Nav.tsx
      Footer.tsx
    home/
      Hero.tsx
      Story.tsx
      Ceo.tsx
      Mission.tsx
      Services.tsx            # 写真フォトカード x 3
      NewsPreview.tsx         # index の #news セクション
      Contact.tsx
    news/
      NewsList.tsx
      NewsItem.tsx
      Filters.tsx
      Pagination.tsx
  lib/
    news.ts                   # NewsItem 型 + fetcher
  styles/
    tokens.css                # --navy-900 等の CSS 変数(Tailwind config でも可)
public/
  assets/                     # 画像
```

Tailwind を採用する場合、上記 Design Tokens を `tailwind.config.js` の `theme.extend` に移植してください。カラーは `navy: { 500: '#3D6A94', ... }` のようにネスト、フォントは `fontFamily.serif` / `sans` / `mono` / `display` を上書きします。

### 未実装 / 実装時に判断が必要な点

1. **記事詳細ページ**: 現状は `<a href="news.html">` で一覧に飛ばすだけ。要件次第で `news/[slug]` を用意し、`window.HUGMADE_NEWS` に `slug`, `body` (markdown/HTML) を追加してください。
2. **お問い合わせフォームのバックエンド**: SendGrid / Resend / Formspree など何を採用するか。
3. **モバイルナビゲーション**: <840px でハンバーガー + ドロワーの追加。
4. **ニュース CMS 化**: microCMS 等に移す場合の型・API 仕様。
5. **OGP / メタ情報**: 現在は title/description のみ。og:image, og:type, twitter:card 等の追加を推奨。
6. **サービスカードの写真差し替え**: 生成 AI 画像は暫定。撮り下ろし・許諾済み素材への差し替えを本番前に。
7. **アクセシビリティ監査**: フォーカスリング、`aria-live` (フィルタ切替時)、キーボード操作の網羅確認を実装フェーズで実施してください。
