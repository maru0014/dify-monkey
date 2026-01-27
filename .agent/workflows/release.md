---
description: Githubリリース作成・バージョン更新フロー
---

# Githubリリース作成フロー

このワークフローは、バージョン番号の更新からタグのプッシュまでを行います。
実行前に、更新するバージョン番号（例: `0.1.2`）を決定してください。

1. **バージョン定義ファイルの更新**
   `package.json` と `manifest.json` の `version` フィールドを新しいバージョン（例: `0.1.2`）に更新してください。

2. **ビルド検証**
   ビルドが正常に通るか確認します。
   ```bash
   npm run build
   ```

3. **変更のコミット**
   バージョン変更をコミットします。`<VERSION>` は実際のバージョンに置き換えてください。
   ```bash
   git add package.json manifest.json
   git commit -m "chore: release v<VERSION>"
   ```

4. **タグの作成**
   Gitタグを作成します。
   ```bash
   git tag v<VERSION>
   ```

5. **変更とタグのプッシュ**
   この操作により、GitHub Actionsがトリガーされ、リリースが作成されます。
   ```bash
   git push origin main
   git push origin v<VERSION>
   ```
