---
description: Githubリリース作成
---

# Githubリリース作成作成手順

// turbo-all

1. タグを設定する
```bash
git tag v0.1.0
```

2. タグをプッシュする（.github\workflows\release.yml が動作することでリリースが作成される）
```bash
git push origin v0.1.0
```
