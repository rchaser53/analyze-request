import { createApp } from './app';

const port: number = process.env.PORT ? Number(process.env.PORT) : 5173;

const app = createApp();

// サーバ起動
app.listen(port, () => {
  console.log(`analyze-request running on http://localhost:${port}`);
});
