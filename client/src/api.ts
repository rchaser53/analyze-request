import type { ApiProxyErrorResponse, ApiProxyOkResponse, ApiProxyRequestBody } from './types';

export type ApiResult = ApiProxyOkResponse | ApiProxyErrorResponse;

// サーバのプロキシAPIに投げる
export const postProxyRequest = async (body: ApiProxyRequestBody): Promise<ApiResult> => {
  const res: Response = await fetch('/api/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data: unknown = await res.json().catch((): null => null);

  if (!data || typeof data !== 'object') {
    return {
      ok: false,
      error: `Request failed (${res.status})`,
      durationMs: 0,
    };
  }

  // ここでは型検証は最小限（unknownから安全に取り出す）
  const maybeOk: unknown = (data as { ok?: unknown }).ok;
  if (maybeOk === true) {
    return data as ApiProxyOkResponse;
  }

  const errorMessage: string = String((data as { error?: unknown }).error ?? `Request failed (${res.status})`);
  const durationMs: number = Number((data as { durationMs?: unknown }).durationMs ?? 0);

  return {
    ok: false,
    error: errorMessage,
    durationMs,
  };
};
