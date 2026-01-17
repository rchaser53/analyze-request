export type Tabs = 'text' | 'json';

export type Elements = {
  method: HTMLSelectElement;
  url: HTMLInputElement;
  headers: HTMLTextAreaElement;
  body: HTMLTextAreaElement;
  timeoutMs: HTMLInputElement;
  send: HTMLButtonElement;
  clear: HTMLButtonElement;
  curl: HTMLElement;
  reqError: HTMLElement;

  status: HTMLElement;
  time: HTMLElement;
  contentType: HTMLElement;
  respHeaders: HTMLTextAreaElement;
  respBodyText: HTMLTextAreaElement;
  respBodyJson: HTMLTextAreaElement;
  respError: HTMLElement;
};

export type ApiProxyRequestBody = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timeoutMs: number;
};

export type ApiProxyOkResponse = {
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

export type ApiProxyErrorResponse = {
  ok: false;
  error: string;
  durationMs: number;
};
