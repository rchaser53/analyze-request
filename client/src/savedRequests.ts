import type { ApiProxyErrorResponse, ApiProxyOkResponse, ApiProxyRequestBody } from './types';

export type SavedResponse =
  | (ApiProxyOkResponse & { savedAtIso: string })
  | (ApiProxyErrorResponse & { savedAtIso: string });

export type SavedRequest = {
  id: string;
  name: string;
  description: string;
  request: ApiProxyRequestBody;
  lastResponse: SavedResponse | null;
  createdAtIso: string;
  updatedAtIso: string;
};

const STORAGE_KEY_V1: string = 'analyze-request:savedRequests:v1';
const STORAGE_KEY_V2: string = 'analyze-request:savedRequests:v2';

const nowIso = (): string => {
  return new Date().toISOString();
};

const safeParseJson = (text: string): unknown | null => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const readAllUnsafe = (): unknown => {
  const rawV2: string | null = window.localStorage.getItem(STORAGE_KEY_V2);
  if (rawV2) {
    const parsedV2: unknown | null = safeParseJson(rawV2);
    return parsedV2 ?? [];
  }

  const rawV1: string | null = window.localStorage.getItem(STORAGE_KEY_V1);
  if (!rawV1) return [];
  const parsedV1: unknown | null = safeParseJson(rawV1);
  return parsedV1 ?? [];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const normalizeHeaders = (value: unknown): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (!isRecord(value)) return headers;
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined || v === null) continue;
    headers[String(k)] = String(v);
  }
  return headers;
};

const normalizeSavedResponse = (value: unknown): SavedResponse | null => {
  if (!isRecord(value)) return null;

  const ok: unknown = value.ok;
  const savedAtIso: string = typeof value.savedAtIso === 'string' ? value.savedAtIso : '';
  const durationMs: number = typeof value.durationMs === 'number' ? value.durationMs : 0;

  if (ok === true) {
    const requestedRaw: unknown = value.requested;
    const requested: { url: string; method: string } = {
      url: isRecord(requestedRaw) && typeof requestedRaw.url === 'string' ? requestedRaw.url : '',
      method: isRecord(requestedRaw) && typeof requestedRaw.method === 'string' ? requestedRaw.method : '',
    };

    const status: number = typeof value.status === 'number' ? value.status : 0;
    const statusText: string = typeof value.statusText === 'string' ? value.statusText : '';
    const contentType: string = typeof value.contentType === 'string' ? value.contentType : '';
    const bodyText: string = typeof value.bodyText === 'string' ? value.bodyText : '';
    const bodyJson: unknown | null = value.bodyJson === undefined ? null : (value.bodyJson as unknown | null);
    const headers: Record<string, string> = normalizeHeaders(value.headers);

    if (!requested.url || !requested.method || !savedAtIso || !status) return null;

    return {
      ok: true,
      requested,
      status,
      statusText,
      headers,
      contentType,
      bodyText,
      bodyJson,
      durationMs,
      savedAtIso,
    };
  }

  if (ok === false) {
    const error: string = typeof value.error === 'string' ? value.error : '';
    if (!savedAtIso || !error) return null;
    return {
      ok: false,
      error,
      durationMs,
      savedAtIso,
    };
  }

  return null;
};

const normalizeSavedRequests = (value: unknown): SavedRequest[] => {
  if (!Array.isArray(value)) return [];

  const out: SavedRequest[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;

    const id: string = typeof item.id === 'string' ? item.id : '';
    const name: string = typeof item.name === 'string' ? item.name : '';
    const description: string = typeof item.description === 'string' ? item.description : '';
    const createdAtIso: string = typeof item.createdAtIso === 'string' ? item.createdAtIso : '';
    const updatedAtIso: string = typeof item.updatedAtIso === 'string' ? item.updatedAtIso : '';

    const requestRaw: unknown = item.request;
    if (!isRecord(requestRaw)) continue;

    const url: string = typeof requestRaw.url === 'string' ? requestRaw.url : '';
    const method: string = typeof requestRaw.method === 'string' ? requestRaw.method : '';
    const body: string = typeof requestRaw.body === 'string' ? requestRaw.body : '';
    const timeoutMs: number = typeof requestRaw.timeoutMs === 'number' ? requestRaw.timeoutMs : 0;

    const headers: Record<string, string> = normalizeHeaders(requestRaw.headers);

    const lastResponse: SavedResponse | null = normalizeSavedResponse(item.lastResponse);

    if (!id || !name || !url || !method) continue;

    out.push({
      id,
      name,
      description,
      request: { url, method, headers, body, timeoutMs },
      lastResponse,
      createdAtIso: createdAtIso || nowIso(),
      updatedAtIso: updatedAtIso || nowIso(),
    });
  }

  return out;
};

const writeAll = (items: SavedRequest[]): void => {
  window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(items));
};

const readAll = (): SavedRequest[] => {
  return normalizeSavedRequests(readAllUnsafe());
};

const createId = (): string => {
  const maybeCrypto: Crypto | undefined = globalThis.crypto;
  if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
    return maybeCrypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const listSavedRequests = (): SavedRequest[] => {
  return readAll().sort((a: SavedRequest, b: SavedRequest): number => {
    // 新しいものを上に
    return b.updatedAtIso.localeCompare(a.updatedAtIso);
  });
};

export const getSavedRequestById = (id: string): SavedRequest | null => {
  const all: SavedRequest[] = listSavedRequests();
  for (const item of all) {
    if (item.id === id) return item;
  }
  return null;
};

export const saveNewRequest = (args: {
  name: string;
  description: string;
  request: ApiProxyRequestBody;
  lastResponse: ApiProxyOkResponse | ApiProxyErrorResponse | null;
}): SavedRequest => {
  const all: SavedRequest[] = readAll();
  const ts: string = nowIso();

  const lastResponse: SavedResponse | null = args.lastResponse
    ? ({ ...args.lastResponse, savedAtIso: ts } as SavedResponse)
    : null;

  const saved: SavedRequest = {
    id: createId(),
    name: args.name,
    description: args.description,
    request: args.request,
    lastResponse,
    createdAtIso: ts,
    updatedAtIso: ts,
  };

  writeAll([saved, ...all]);
  return saved;
};

export const updateSavedRequest = (args: {
  id: string;
  name: string;
  description: string;
  request: ApiProxyRequestBody;
  lastResponse: ApiProxyOkResponse | ApiProxyErrorResponse | null;
}): SavedRequest | null => {
  const all: SavedRequest[] = readAll();
  const idx: number = all.findIndex((it: SavedRequest): boolean => it.id === args.id);
  if (idx < 0) return null;

  const prev: SavedRequest = all[idx];
  const ts: string = nowIso();
  const lastResponse: SavedResponse | null = args.lastResponse ? ({ ...args.lastResponse, savedAtIso: ts } as SavedResponse) : null;
  const updated: SavedRequest = {
    ...prev,
    name: args.name,
    description: args.description,
    request: args.request,
    lastResponse,
    updatedAtIso: ts,
  };

  const next: SavedRequest[] = [...all];
  next.splice(idx, 1, updated);
  writeAll(next);
  return updated;
};

export const updateSavedRequestLastResponse = (args: {
  id: string;
  lastResponse: ApiProxyOkResponse | ApiProxyErrorResponse;
}): SavedRequest | null => {
  const all: SavedRequest[] = readAll();
  const idx: number = all.findIndex((it: SavedRequest): boolean => it.id === args.id);
  if (idx < 0) return null;

  const prev: SavedRequest = all[idx];
  const ts: string = nowIso();
  const updated: SavedRequest = {
    ...prev,
    lastResponse: { ...args.lastResponse, savedAtIso: ts } as SavedResponse,
    updatedAtIso: ts,
  };

  const next: SavedRequest[] = [...all];
  next.splice(idx, 1, updated);
  writeAll(next);
  return updated;
};

export const deleteSavedRequest = (id: string): void => {
  const all: SavedRequest[] = readAll();
  const next: SavedRequest[] = all.filter((it: SavedRequest): boolean => it.id !== id);
  writeAll(next);
};
