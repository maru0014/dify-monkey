---
description: Githubリリース作成・バージョン更新フロー
---

# GitHub Release Workflow for AI Agent

このプロジェクトで新しいバージョンをリリースする際は、以下のステップを厳密に順守してください。

## 前提条件
- 現在のブランチが `main` であり、最新の状態であることを確認すること。
- 未コミットの変更がないことを確認すること。

## 実行ステップ

### 1. バージョンの決定とファイル更新
指定されたバージョン（例: `0.1.2`）に基づき、以下のファイルを更新してください。
- `package.json`: `version` フィールドを更新（`npm version --no-git-tag-version <version>` を推奨）
- `manifest.json`: `version` フィールドを上記と完全に一致させる

### 2. ビルド検証
リリース用の成果物が正しく生成されるか、ローカルでビルドを実行してください。
```bash
npm run build
   ```

### 3. **変更のコミットとプッシュ**
バージョン更新を記録します。`<VERSION>` は実際のバージョンに置き換えてください。
```bash
git add package.json package-lock.json manifest.json
git commit -m "chore: release v<VERSION>"
git push origin main
```

### 4. **タグの付与とリリース実行**
最後にタグを作成し、プッシュします。これによりGitHub Actionsが起動します。
```bash
git tag v<VERSION>
git push origin v<VERSION>
```

### 5. **完了後の確認**
ghコマンドでGitHub上のリポジトリを確認し、Actionsが正常に開始されたことを報告してください。
