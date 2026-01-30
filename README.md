# Dify Monkey 🐵

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

**Difyと連携可能なユーザースクリプトマネージャー** Chrome拡張機能

任意のWebページ上で独自のJavaScript（ユーザースクリプト）を実行でき、スクリプト内からDifyのワークフローを直接呼び出すことができます。また、サイドパネルでDifyのエージェントとチャットを行う機能も提供します。

---

## ✨ 主な機能

- **ユーザースクリプト管理**: 任意のWebページでカスタムJavaScriptを実行
- **Difyワークフロー連携**: スクリプト内から直接Dify APIを呼び出し
- **サイドパネルチャット**: Difyエージェントとのリアルタイムチャット（ストリーミング対応）
- **Monaco Editor**: VS Code同等の高機能コードエディタ内蔵
- **セキュアなAPIキー管理**: AES-256-GCM暗号化によるAPIキー保護

---

## 🔒 セキュリティ

本拡張機能はセキュリティを重視して設計されています：

- **AES-256-GCM暗号化**: APIキーは暗号化して保存
- **PBKDF2鍵導出**: 100,000回イテレーションによる強力な鍵導出
- **3つのセキュリティモード**: デバイスキー / マスターパスワード / 平文から選択可能
- **Manifest V3**: 最新のChrome拡張機能セキュリティ基準に準拠

詳細は [SECURITY_AUDIT.md](SECURITY_AUDIT.md) を参照してください。

---

## 📦 インストール方法

### 開発者モードでのインストール

1. このリポジトリをクローン
   ```bash
   git clone https://github.com/maru0014/dify-monkey.git
   cd dify-monkey
   ```

2. 依存関係をインストール
   ```bash
   npm install
   ```

3. ビルド
   ```bash
   npm run build
   ```

4. Chromeで拡張機能をロード
   - `chrome://extensions/` を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `dist` フォルダを選択

---

## 🚀 使い方

### 初期設定

1. 拡張機能アイコンをクリックしてサイドパネルを開く
2. 設定画面でDify APIのエンドポイントとAPIキーを設定
3. セキュリティモードを選択（デバイスキーまたはマスターパスワード推奨）

### ユーザースクリプトの作成

1. オプションページを開く（拡張機能アイコンを右クリック → オプション）
2. 「新規スクリプト」をクリック
3. スクリプト名、対象URL（ワイルドカード対応）を設定
4. Monaco Editorでスクリプトを記述
5. 保存

### スクリプト内でのDify API呼び出し

```javascript
// ワークフロー実行
const result = await dify.workflow.run({
  inputs: { text: 'Hello, Dify!' }
});
console.log(result);

// ページコンテンツの取得
const page = await dify.page.readContent();
console.log(page.title, page.content);

// トースト通知
dify.ui.toast('処理が完了しました', 'success');

// ログ出力（サイドパネルに表示）
dify.log('Workflow result', result);
```

> **Note**: チャット機能（`dify.chat.send`）はUser Script APIでは未実装です。チャットはサイドパネルのChat UIをご利用ください。

---

## 🛠️ 開発

### 開発環境の起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### テスト

```bash
npm test
```

### コントリビューション

#### コミット規約（Conventional Commits）
コミットメッセージは以下の形式に従ってください：

```bash
feat: 新機能を追加      # → マイナーバージョンアップ
fix: バグを修正         # → パッチバージョンアップ
feat!: 破壊的変更       # → メジャーバージョンアップ
docs: ドキュメント更新
chore: その他の変更
```

#### リリースフロー
PRを`main`ブランチにマージすると、semantic-releaseにより自動的にリリースが作成されます。

1. フィーチャーブランチで開発
2. PRを作成・レビュー
3. マージ → 自動リリース（バージョン決定、CHANGELOG更新、タグ作成）

### プロジェクト構成

```
src/
├── background/      # Service Worker
├── content/         # Content Script（通信リレー）
├── options/         # オプションページ（設定・エディタ）
├── sidepanel/       # サイドパネル（チャットUI）
├── prompt/          # プロンプトUI
├── shared/          # 共有モジュール
│   ├── api/         # Dify APIクライアント
│   ├── components/  # 共有UIコンポーネント
│   ├── hooks/       # React Hooks
│   ├── lib/         # ユーティリティ
│   └── types/       # 型定義
└── types/           # グローバル型定義
```

---

## 📋 技術スタック

| カテゴリ | 技術 |
|---------|------|
| ビルドツール | Vite + CRXJS |
| フレームワーク | React 19 + TypeScript |
| スタイリング | Tailwind CSS |
| UIコンポーネント | shadcn/ui |
| コードエディタ | Monaco Editor |
| テスト | Vitest |

---

## 📄 ライセンス

[MIT License](LICENSE)

---

## 👤 作者

**marumo**
- GitHub: [@maru0014](https://github.com/maru0014)
- Email: marumo@codelife.cafe
