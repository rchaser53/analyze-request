export type NormalizedHeaders = Record<string, string>;

export const isHttpUrl = (value: string): boolean => {
  try {
    const url: URL = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const normalizeHeaders = (input: unknown): NormalizedHeaders => {
  if (input === undefined || input === null) return {};
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('headers must be an object');
  }

  const headers: NormalizedHeaders = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    headers[String(key)] = String(value);
  }

  return headers;
};
