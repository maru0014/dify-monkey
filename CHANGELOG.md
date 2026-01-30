## [0.2.1](https://github.com/maru0014/dify-monkey/compare/v0.2.0...v0.2.1) (2026-01-30)


### Bug Fixes

* resolve CSP issues by using userScripts.execute and postMessage ([#5](https://github.com/maru0014/dify-monkey/issues/5)) ([3a41e51](https://github.com/maru0014/dify-monkey/commit/3a41e51b04ef11ddcc8e4f90b98740bb68f83eff))

# Changelog

このプロジェクトのすべての重要な変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいています。
バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従います。

---

## [Unreleased]

### Added
- 今後追加予定の機能をここに記載

---

## [0.2.0] - 2026-01-30

### Added
- **チャット会話ID管理**: Dify APIからのconversation_idを保持し、会話の継続が可能に
- **アプリ別メッセージ履歴**: アプリごとにチャット履歴を分離管理
- **新しい会話ボタン**: サイドパネルから簡単に新規会話を開始可能

### Changed
- ChatTabコンポーネントのメッセージ状態を親コンポーネントで管理するよう変更

---

## [0.1.0] - 2026-01-22

### Added
- 初回リリース
- ユーザースクリプト管理機能
  - スクリプトの作成・編集・削除
  - URL パターンによる実行条件設定
  - Monaco Editor によるコード編集
- Dify API 連携
  - ワークフロー実行
  - チャットメッセージ送信（ストリーミング対応）
- サイドパネル UI
  - Dify エージェントとのチャット機能
  - スクリプト実行履歴表示
- オプションページ
  - Dify 接続設定
  - スクリプトエディタ
  - スクリプトテンプレート
- セキュリティ機能
  - AES-256-GCM による API キー暗号化
  - 3つのセキュリティモード（デバイスキー/マスターパスワード/平文）
  - パスワード強度検証

### Security
- Manifest V3 対応
- PBKDF2 による鍵導出（100,000 イテレーション）
- セキュリティ監査レポート作成

---

[Unreleased]: https://github.com/maru0014/dify-monkey/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/maru0014/dify-monkey/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/maru0014/dify-monkey/releases/tag/v0.1.0
