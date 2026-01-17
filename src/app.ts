import express from 'express';
import path from 'path';
import { createApiRequestRouter } from './routes/apiRequestRoute';

export const createApp = (): express.Express => {
  const app: express.Express = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // 静的ファイル（GUI）を配信
  app.use(express.static(path.resolve(__dirname, '../public')));

  // API
  app.use('/api', createApiRequestRouter());

  // SPAのフォールバック
  app.get('*', (_req: express.Request, res: express.Response) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  });

  return app;
};
