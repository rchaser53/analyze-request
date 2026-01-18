import type { ApiProxyRequestBody } from './types';

export type SavedRequest = {
  id: string;
  name: string;
  description: string;
  request: ApiProxyRequestBody;
  createdAtIso: string;
  updatedAtIso: string;
};

const STORAGE_KEY: string = 'analyze-request:savedRequests:v1';

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
  const raw: string | null = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown | null = safeParseJson(raw);
  return parsed ?? [];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

    const headersRaw: unknown = requestRaw.headers;
    const headers: Record<string, string> = {};
    if (isRecord(headersRaw)) {
      for (const [k, v] of Object.entries(headersRaw)) {
        if (v === undefined || v === null) continue;
        headers[String(k)] = String(v);
      }
    }

    if (!id || !name || !url || !method) continue;

    out.push({
      id,
      name,
      description,
      request: { url, method, headers, body, timeoutMs },
      createdAtIso: createdAtIso || nowIso(),
      updatedAtIso: updatedAtIso || nowIso(),
    });
  }

  return out;
};

const writeAll = (items: SavedRequest[]): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
}): SavedRequest => {
  const all: SavedRequest[] = readAll();
  const ts: string = nowIso();

  const saved: SavedRequest = {
    id: createId(),
    name: args.name,
    description: args.description,
    request: args.request,
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
}): SavedRequest | null => {
  const all: SavedRequest[] = readAll();
  const idx: number = all.findIndex((it: SavedRequest): boolean => it.id === args.id);
  if (idx < 0) return null;

  const prev: SavedRequest = all[idx];
  const updated: SavedRequest = {
    ...prev,
    name: args.name,
    description: args.description,
    request: args.request,
    updatedAtIso: nowIso(),
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
