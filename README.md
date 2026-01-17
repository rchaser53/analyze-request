# analyze-request

GUI上でHTTPリクエストを作って投げ、レスポンス（status/headers/body）を確認するための小さなWebアプリです。

## 起動

```bash
npm install
npm start
```

- デフォルトは `http://localhost:5173` で起動します。
- ポート変更: `PORT=3000 npm start`

## ビルド

```bash
npm run build
```

- フロントはViteで `client/` → `public/` にビルドします（`public/` は生成物なのでgit管理しません）。
- サーバはTypeScriptを `src/` → `dist/` にビルドします。

## 使い方

- Method / URL / Headers(JSON) / Body を入力して **Send**
- **Cmd+Enter** / **Ctrl+Enter** でも送信できます
- レスポンスの `Body (text)` と `Body (json)` をタブで切り替えできます

## メモ

- ブラウザのCORS制約を避けるため、サーバ側の `POST /api/request` がプロキシします。
- URLは `http(s)` のみ許可しています。
