export type CurlInput = {
  url: string;
  method: string;
  headers: Record<string, string>;
  bodyText: string;
};

// 画面入力からcURLコマンド例を生成する（あくまで参考表示用）
export const buildCurl = (input: CurlInput): string => {
  const parts: string[] = ['curl'];
  parts.push('-X', JSON.stringify(input.method));

  for (const [k, v] of Object.entries(input.headers)) {
    parts.push('-H', JSON.stringify(`${k}: ${v}`));
  }

  if (input.bodyText !== '' && !['GET', 'HEAD'].includes(input.method)) {
    parts.push('--data', JSON.stringify(input.bodyText));
  }

  parts.push(JSON.stringify(input.url));
  return parts.join(' ');
};
