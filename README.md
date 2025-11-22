# SNS Engagement App

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-007ACC.svg?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000.svg?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4.svg?logo=tailwindcss&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4-D97757.svg?logo=anthropic&logoColor=white)

**SNSエンゲージメント戦略支援アプリ - インプレッション最大化と承認欲求コントロール**

[デモ](#デモ) | [インストール](#インストール) | [使用方法](#使用方法) | [アーキテクチャ](#アーキテクチャ)

</div>

---

## 概要

**SNS Engagement App** は、SNSでのインプレッション最大化を科学的にサポートするAI駆動のWebアプリケーションです。

### 核心戦略: 9:1の法則

> **「他人が聞きたいこと」を9割、「自分が言いたいこと」を1割**

SNSで成功するための秘訣は、プラットフォームの「主宰者」に好かれることです。飲み会に例えると：

- **インプレッション獲得モード (90%)**: 主宰者が喜ぶ行動。場を盛り上げ、みんなのために価値を提供する
- **自己表現モード (10%)**: 本当の自分を表現する時間。燃え尽き防止のためのガス抜き

### 主な機能

| 機能 | 説明 |
|------|------|
| **バズ分析** | バズっている投稿を分析し、成功の構造を抽出 |
| **ガッチャンコ機能** | バズノウハウ x プラットフォーム最適化 = 投稿完成 |
| **好感度スコア** | プラットフォームから見た「あなたの好かれ度」を数値化 |
| **週間スケジューラー** | 9:1比率を守った投稿計画を自動生成 |
| **AI最適化** | Claude Sonnet 4 によるコンテンツ自動最適化 |

---

## スクリーンショット

<!-- スクリーンショットプレースホルダー -->
<div align="center">

| ダッシュボード | スコア分析 |
|:---:|:---:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Score](docs/screenshots/score.png) |

| コンテンツ最適化 | 週間スケジュール |
|:---:|:---:|
| ![Content](docs/screenshots/content.png) | ![Schedule](docs/screenshots/schedule.png) |

</div>

> 注: スクリーンショットは `docs/screenshots/` ディレクトリに配置してください

---

## デモ

<!-- デモURL追加時にコメント解除 -->
<!--
### ライブデモ
[https://sns-engagement-app.vercel.app](https://sns-engagement-app.vercel.app)
-->

### ローカルデモ

```bash
# クローン
git clone https://github.com/ryoma3736/sns-engagement-app.git
cd sns-engagement-app

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## インストール

### 必要条件

- **Node.js**: 18.x 以上
- **npm**: 9.x 以上
- **Anthropic API Key**: Claude API利用に必要

### セットアップ手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/ryoma3736/sns-engagement-app.git
cd sns-engagement-app

# 2. 依存関係をインストール
npm install

# 3. 環境変数を設定
cp .env.example .env
# .env ファイルを編集してAPIキーを設定

# 4. 開発サーバーを起動
npm run dev
```

### 本番ビルド

```bash
# ビルド
npm run build

# 本番サーバー起動
npm start
```

---

## 使用方法

### 1. コンテンツ分析

バズっている投稿のURLを入力すると、AIが以下を分析します:

- **フック**: 冒頭で読者を引き込む要素
- **主要ポイント**: 成功した構造要素
- **感情トリガー**: エンゲージメントを生む感情的要素
- **CTA**: 行動を促す要素

```typescript
// 使用例
const analysis = await contentOptimizer.analyzeBuzzContent(
  'https://threads.net/...',
  '投稿内容...',
  'threads'
);
```

### 2. ガッチャンコ機能（プラットフォーム最適化）

分析結果を元に、ターゲットプラットフォーム向けにコンテンツを最適化:

```typescript
// バズノウハウ x Threads最適化
const optimized = await contentOptimizer.optimizeForPlatform(
  analysis,
  'threads',
  'impression' // インプレッション獲得モード
);
```

### 3. 好感度スコア計算

プラットフォームから見た「あなたの好かれ度」を100点満点で評価:

- **エンゲージメントスコア** (35%): いいね・コメント・シェア活動
- **一貫性スコア** (25%): 投稿頻度の安定性
- **トレンドスコア** (20%): トレンドへの参加度
- **コミュニティスコア** (20%): フォロワー獲得・保存数

### 4. 週間スケジューラー

9:1比率を守った1週間の投稿計画:

- **平日 (月-金)**: インプレッション獲得モード
- **週末 (土-日)**: 自己表現モード（ガス抜き）

---

## 環境変数

`.env.example` を `.env` にコピーして、以下を設定:

| 変数名 | 必須 | 説明 |
|--------|:----:|------|
| `ANTHROPIC_API_KEY` | **必須** | Claude API キー |
| `DATABASE_URL` | 任意 | データベース接続URL |
| `NEXTAUTH_URL` | 任意 | NextAuth認証URL |
| `NEXTAUTH_SECRET` | 任意 | NextAuth シークレット |
| `GITHUB_TOKEN` | 任意 | GitHub API トークン（Miyabi用） |

---

## アーキテクチャ

```
+------------------------------------------------------------------+
|                      SNS Engagement App                           |
+------------------------------------------------------------------+
|                                                                   |
|  +--------------------+    +--------------------+                 |
|  |    Frontend        |    |    API Routes      |                 |
|  |    (Next.js 14)    |<-->|    (/api/*)        |                 |
|  +--------------------+    +--------------------+                 |
|           |                         |                             |
|           v                         v                             |
|  +----------------------------------------------------------+    |
|  |                    Services Layer                         |    |
|  +----------------------------------------------------------+    |
|  |                         |                       |         |    |
|  |  +-----------------+  +-----------------+  +-----------+  |    |
|  |  | StrategyManager |  | ContentOptimizer|  | ScoreCalc |  |    |
|  |  +-----------------+  +-----------------+  +-----------+  |    |
|  |          |                    |                 |         |    |
|  |          v                    v                 v         |    |
|  |  +---------------------------------------------------+   |    |
|  |  |              9:1 Strategy Engine                  |   |    |
|  |  | +---------------+ +---------------+ +-----------+ |   |    |
|  |  | | Impression    | | Expression    | | Weekly    | |   |    |
|  |  | | Mode (90%)    | | Mode (10%)    | | Scheduler | |   |    |
|  |  | +---------------+ +---------------+ +-----------+ |   |    |
|  |  +---------------------------------------------------+   |    |
|  +----------------------------------------------------------+    |
|                              |                                    |
|                              v                                    |
|  +----------------------------------------------------------+    |
|  |                   Claude AI API                           |    |
|  |              (claude-sonnet-4-20250514)                   |    |
|  +----------------------------------------------------------+    |
|                                                                   |
+------------------------------------------------------------------+

                        +-------------------+
                        |   Platforms       |
                        +-------------------+
                        |  +-------------+  |
                        |  |  Threads    |  |
                        |  +-------------+  |
                        |  | Instagram   |  |
                        |  +-------------+  |
                        |  |  Twitter    |  |
                        |  +-------------+  |
                        +-------------------+
```

### プロジェクト構造

```
sns-engagement-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── analyze/        # コンテンツ分析API
│   │   │   └── optimize/       # 最適化API
│   │   ├── content/            # コンテンツページ
│   │   ├── score/              # スコアページ
│   │   ├── strategy/           # 戦略ページ
│   │   ├── layout.tsx          # ルートレイアウト
│   │   └── globals.css         # グローバルCSS
│   ├── components/             # UIコンポーネント
│   │   ├── ContentAnalyzer.tsx # コンテンツ分析UI
│   │   ├── ScoreGauge.tsx      # スコアゲージ
│   │   ├── ScoreRadar.tsx      # レーダーチャート
│   │   ├── ModeRatioSlider.tsx # モード比率スライダー
│   │   ├── WeeklyScheduler.tsx # 週間スケジューラー
│   │   ├── ActionRecommend.tsx # アクション推奨
│   │   └── OptimizedOutput.tsx # 最適化結果表示
│   ├── services/               # ビジネスロジック
│   │   ├── strategyManager.ts  # 戦略管理
│   │   ├── contentOptimizer.ts # コンテンツ最適化
│   │   └── scoreCalculator.ts  # スコア計算
│   ├── hooks/                  # カスタムフック
│   │   └── useStrategy.ts      # 戦略フック
│   └── types/                  # 型定義
│       └── index.ts            # 共通型
├── .claude/                    # Claude Code設定
│   ├── agents/                 # Miyabi Agent定義
│   └── commands/               # カスタムコマンド
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md                   # このファイル
```

---

## 技術スタック

### フロントエンド

- **Next.js 14** - React フレームワーク（App Router）
- **React 18** - UIライブラリ
- **TailwindCSS 3.4** - CSSフレームワーク
- **Recharts** - データビジュアライゼーション
- **Zustand** - 状態管理

### バックエンド

- **Next.js API Routes** - サーバーレスAPI
- **Anthropic SDK** - Claude AI連携

### 開発ツール

- **TypeScript 5.3** - 型安全な開発
- **ESLint** - コード品質
- **Jest** - テストフレームワーク
- **Miyabi Framework** - 自律型開発支援

---

## 開発

### スクリプト

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番サーバー
npm start

# リント
npm run lint

# テスト
npm test
```

### Miyabi Commands

Claude Code で使用可能なコマンド:

```bash
/test           # テスト実行
/verify         # システム検証
/deploy         # デプロイ
/generate-docs  # ドキュメント生成
/agent-run      # Agent実行
```

---

## 核心戦略の詳細

### なぜ9:1なのか？

SNSプラットフォームは「場を盛り上げてくれる人」を優遇します。

```
プラットフォーム目線:
┌─────────────────────────────────────────────────┐
│ 「この人はみんなのために価値を提供してくれる」   │
│ 「トレンドに参加して場を盛り上げてくれる」       │
│ 「他の人のコンテンツにも積極的に反応してくれる」 │
│                                                  │
│              = インプレッションを与えよう！      │
└─────────────────────────────────────────────────┘
```

### インプレッションモード vs 自己表現モード

| 項目 | インプレッションモード (90%) | 自己表現モード (10%) |
|------|------------------------------|----------------------|
| 目的 | プラットフォームに好かれる | 自分のガス抜き |
| 内容 | 他人が聞きたいこと | 自分が言いたいこと |
| トレンド | 積極参加 | 気にしない |
| 頻度 | 平日（月-金） | 週末（土-日） |
| KPI | インプレッション数 | 自己満足度 |

---

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

---

## 作者

**ryoma3736**

---

## 謝辞

- [Anthropic Claude](https://www.anthropic.com/) - AI分析・最適化
- [Miyabi Framework](https://github.com/ShunsukeHayashi/Autonomous-Operations) - 自律型開発支援
- [Vercel](https://vercel.com/) - Next.js & ホスティング

---

<div align="center">

**SNSでの成功は「好かれる」こと**

*主宰者（プラットフォーム）に好かれる行動を9割、自分らしさを1割*

</div>
