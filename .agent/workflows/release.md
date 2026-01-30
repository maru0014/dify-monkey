---
description: Githubリリース作成（semantic-releaseによる自動化）
---

# Githubリリースフロー

## 概要
semantic-release により、mainブランチへのマージで自動的にリリースが作成されます。

## フロー

1. **フィーチャーブランチで開発**
   ```bash
   git checkout -b feat/new-feature
   ```

2. **Conventional Commitsに従ってコミット**
   ```bash
   # 新機能 → マイナーバージョンアップ
   git commit -m "feat: 新しい機能を追加"
   
   # バグ修正 → パッチバージョンアップ
   git commit -m "fix: バグを修正"
   
   # 破壊的変更 → メジャーバージョンアップ
   git commit -m "feat!: APIを変更" 
   # または
   git commit -m "feat: 変更内容
   
   BREAKING CHANGE: 詳細説明"
   ```

3. **PRを作成・マージ**
   - PRをmainへマージすると自動的にリリース

## 自動化される処理
- バージョン番号の決定（コミット履歴から）
- CHANGELOG.md の更新
- package.json / manifest.json のバージョン更新
- Gitタグの作成
- GitHubリリースの作成（ZIP添付）

## 注意事項

> ⚠️ 手動でのタグ作成・バージョン更新は不要です

> ⚠️ リリースをスキップしたい場合は `[skip ci]` をコミットメッセージに含める
