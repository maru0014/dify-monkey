---
description: 本番ビルドの実行
---

# 本番ビルド手順

// turbo-all

1. 本番用ビルドを実行
```bash
npm run build
```

2. ビルド結果は `dist/` フォルダに出力される

3. Chrome Web Storeへの公開
- `dist` フォルダをZIP化
- Chrome Developer Dashboardからアップロード
