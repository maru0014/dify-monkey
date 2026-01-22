# Dify Monkey - プロジェクトルール

## 概要
Dify Monkeyは、Difyと連携可能なユーザースクリプトマネージャーChrome拡張機能です。

## 技術スタック
- **Build Tool**: Vite + CRXJS
- **Core**: React + TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: shadcn/ui
- **Icons**: Lucide React
- **Editor**: @monaco-editor/react
- **Router**: React Router DOM
- **Markdown**: react-markdown + remark-gfm
- **Page Content**: @mozilla/readability (ページ本文抽出)

## アーキテクチャ (Manifest V3)

### コンポーネント構成
1. **Background Service Worker** (`src/background/index.ts`)
   - ユーザースクリプトの登録・解除（`chrome.userScripts` API）
   - Dify APIへのHTTPリクエスト代行（CORS回避・APIキー隠蔽）
   - `chrome.storage` の変更監視とスクリプト同期

2. **Content Script** (`src/content/relay.ts`)
   - 実行ワールド: `ISOLATED`
   - `USER_SCRIPT` ワールドと `BACKGROUND` 間の通信ブリッジ
   - Readabilityによるページコンテンツ抽出

3. **User Scripts (Runtime)**
   - 実行ワールド: `USER_SCRIPT`
   - Dify Bridge（通信用関数）をヘッダーとして付与

4. **UI Components**
   - **Side Panel**: Difyチャットインターフェース (`src/sidepanel/`)
   - **Options Page**: スクリプトエディタ・設定画面 (`src/options/`)

## ディレクトリ構造ルール

```
src/
├── background/       # Service Worker
├── content/          # Content Script (ISOLATED World)
├── sidepanel/        # Side Panel UI
│   ├── App.tsx       # Tab Router (Chat/Scripts)
│   └── components/   # Side Panel固有コンポーネント
│       ├── TabNav.tsx           # タブ切り替え
│       ├── ScriptCard.tsx       # スクリプトカード
│       ├── ExecutionProgress.tsx # 進捗表示
│       ├── ExecutionHistory.tsx  # 実行履歴
│       ├── ScriptsTab.tsx       # Scriptsタブ統合
│       ├── ScriptLogs.tsx       # dify.log()のログ表示
│       └── ContentEditModal.tsx # ページコンテンツ編集モーダル
├── options/          # Options Page
│   ├── pages/        # Page Components
│   └── components/   # Options固有コンポーネント
├── shared/           # 共通モジュール
│   ├── api/          # Dify Client
│   ├── hooks/        # 共通Hooks (useDifyApps, useScriptExecution等)
│   ├── lib/          # ユーティリティ (storage, bridge)
│   └── types/        # 共通型定義 (ScriptExecution等)
└── types/            # グローバル型定義
```

## コーディング規約

### TypeScript
- 厳密な型付けを行う
- `any` の使用は避け、適切な型を定義する
- インターフェースは `I` プレフィックスなしで定義

### React
- 関数コンポーネントを使用
- カスタムフックは `use` プレフィックスで命名
- Propsの型は `ComponentNameProps` で命名

### ストレージ
- `chrome.storage.local` を使用
- APIキーはBackground Script内でのみ使用し、DOMには露出させない

### 通信
- チャットストリーミングは `Port` (`dify-chat-stream`) を使用した長寿命接続
- サイドパネルスクリプト実行は `Port` (`script-execution`) で進捗をリアルタイム通知
- `dify.log()` のログ転送は `Port` (`sidepanel-logs`) でサイドパネルへブロードキャスト
- ワークフロー実行は `CustomEvent` 経由でBackground Scriptへ転送

## セキュリティルール

1. **APIキーの保護**
   - `chrome.storage.local` にのみ保存
   - 通信はすべてBackground Script内で行う

2. **スクリプトの隔離**
   - `world: 'USER_SCRIPT'` で実行
   - ページ側のJavaScript変数を汚染しない

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 参照
- 設計書: `設計書.md`
