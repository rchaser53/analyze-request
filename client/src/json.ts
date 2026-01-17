export type ParseOk<T> = { ok: true; value: T };
export type ParseErr = { ok: false; error: string };

export const prettyJson = (value: unknown): string => {
  return JSON.stringify(value, null, 2);
};

// JSONとして解釈できなければエラーを返す
export const tryParseJsonObject = (text: string): ParseOk<Record<string, string>> | ParseErr => {
  const trimmed: string = text.trim();
  if (trimmed === '') {
    return { ok: true, value: {} };
  }

  try {
    const parsed: unknown = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'JSONオブジェクトではありません' };
    }

    const obj: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === undefined || v === null) continue;
      obj[String(k)] = String(v);
    }

    return { ok: true, value: obj };
  } catch (e: unknown) {
    const message: string = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
};
