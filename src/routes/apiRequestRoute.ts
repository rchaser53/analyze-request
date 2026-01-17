import type { Request, Response as ExpressResponse, Router } from 'express';
import { Router as createRouter } from 'express';
import { isHttpUrl, normalizeHeaders } from '../lib/http';

type ProxyRequestBody = {
  url?: unknown;
  method?: unknown;
  headers?: unknown;
  body?: unknown;
  timeoutMs?: unknown;
};

type ProxyOkResponse = {
  ok: true;
  requested: { url: string; method: string };
  status: number;
  statusText: string;
  headers: Record<string, string>;
  contentType: string;
  bodyText: string;
  bodyJson: unknown | null;
  durationMs: number;
};

type ProxyErrorResponse = {
  ok: false;
  error: string;
  durationMs: number;
};

const getString = (value: unknown): string | null => {
  return typeof value === 'string' ? value : null;
};

const getNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed: number = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const methodAllowsBody = (method: string): boolean => {
  return !['GET', 'HEAD'].includes(method);
};

export const createApiRequestRouter = (): Router => {
  const router: Router = createRouter();

  // GUIから受け取った内容でHTTPリクエストを投げ、結果をそのまま返すプロキシ
  router.post(
    '/request',
    async (
      req: Request<Record<string, never>, ProxyOkResponse | ProxyErrorResponse, ProxyRequestBody>,
      res: ExpressResponse<ProxyOkResponse | ProxyErrorResponse>,
    ) => {
      const startedAt: number = Date.now();

      try {
        const urlRaw: string | null = getString(req.body?.url);
        if (!urlRaw || !isHttpUrl(urlRaw)) {
          return res.status(400).json({
            ok: false,
            error: 'url is required and must be http(s)',
            durationMs: Date.now() - startedAt,
          });
        }

        const methodRaw: string = (getString(req.body?.method) ?? 'GET').toUpperCase();
        const timeoutMs: number = Math.max(1, getNumber(req.body?.timeoutMs) ?? 15000);

        const headers = normalizeHeaders(req.body?.headers);

        const controller: AbortController = new AbortController();
        const timeoutHandle: NodeJS.Timeout = setTimeout(() => controller.abort(), timeoutMs);

        let fetchBody: string | undefined = undefined;
        if (methodAllowsBody(methodRaw)) {
          const bodyValue: unknown = req.body?.body;
          if (bodyValue !== undefined && bodyValue !== null && bodyValue !== '') {
            fetchBody = typeof bodyValue === 'string' ? bodyValue : JSON.stringify(bodyValue);

            // Content-Typeが未指定なら最低限付与する
            const hasContentType: boolean =
              headers['Content-Type'] !== undefined || headers['content-type'] !== undefined;

            if (!hasContentType) {
              headers['Content-Type'] = typeof bodyValue === 'string'
                ? 'text/plain; charset=utf-8'
                : 'application/json; charset=utf-8';
            }
          }
        }

        const response: globalThis.Response = await fetch(urlRaw, {
          method: methodRaw,
          headers,
          body: fetchBody,
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutHandle);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value: string, key: string) => {
          responseHeaders[key] = value;
        });

        const contentType: string = response.headers.get('content-type') ?? '';
        const bodyText: string = await response.text();

        let bodyJson: unknown | null = null;
        if (contentType.includes('application/json')) {
          try {
            bodyJson = JSON.parse(bodyText) as unknown;
          } catch {
            bodyJson = null;
          }
        }

        return res.json({
          ok: true,
          requested: { url: urlRaw, method: methodRaw },
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          contentType,
          bodyText,
          bodyJson,
          durationMs: Date.now() - startedAt,
        });
      } catch (err: unknown) {
        const message: string = err instanceof Error ? err.message : String(err);
        const normalized: string = message.includes('aborted') || message.includes('AbortError')
          ? 'timeout'
          : message;

        return res.status(500).json({
          ok: false,
          error: normalized,
          durationMs: Date.now() - startedAt,
        });
      }
    },
  );

  return router;
};
