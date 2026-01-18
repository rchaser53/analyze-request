import './styles.css';

import { buildCurl } from './curl';
import { getElements } from './elements';
import { tryParseJsonObject, prettyJson } from './json';
import { postProxyRequest } from './api';
import { setupTabs } from './tabs';
import { renderResponseIncrementally } from './render';
import { setupSavedRequestsUi } from './savedRequestsUi';
import type { ApiProxyRequestBody, Elements } from './types';

const setError = (target: HTMLElement, message: string): void => {
  target.textContent = message;
};

const clearResponse = (el: Elements): void => {
  el.status.textContent = '-';
  el.time.textContent = '-';
  el.contentType.textContent = '-';
  el.respHeaders.value = '';
  el.respBodyText.value = '';
  el.respBodyJson.textContent = '';
};

const applyDefaults = (el: Elements): void => {
  el.url.value = 'https://httpbin.org/anything';
  el.method.value = 'GET';
  el.headers.value = '{\n  "Accept": "application/json"\n}';
  el.body.value = '';
  el.timeoutMs.value = '15000';

  el.saveName.value = '';
  el.saveDescription.value = '';
  setError(el.savedError, '');

  setError(el.reqError, '');
  setError(el.respError, '');
  el.curl.textContent = '';
  clearResponse(el);
};

const applyRequestToForm = (el: Elements, req: ApiProxyRequestBody): void => {
  el.url.value = req.url;
  el.method.value = req.method;
  el.headers.value = prettyJson(req.headers);
  el.body.value = req.body;
  el.timeoutMs.value = String(req.timeoutMs || 15000);

  setError(el.reqError, '');
  updateCurl(el, req);
};

const buildRequestBody = (el: Elements): ApiProxyRequestBody | null => {
  const url: string = el.url.value.trim();
  const method: string = el.method.value;

  const headersParsed = tryParseJsonObject(el.headers.value);
  if (!headersParsed.ok) {
    setError(el.reqError, `Headers JSONが不正です: ${headersParsed.error}`);
    return null;
  }

  const timeoutMs: number = Number(el.timeoutMs.value || '15000');

  return {
    url,
    method,
    headers: headersParsed.value,
    body: el.body.value,
    timeoutMs,
  };
};

const updateCurl = (el: Elements, body: ApiProxyRequestBody): void => {
  el.curl.textContent = buildCurl({
    url: body.url,
    method: body.method,
    headers: body.headers,
    bodyText: body.body,
  });
};

const sendRequest = async (el: Elements): Promise<void> => {
  setError(el.reqError, '');
  setError(el.respError, '');

  const body: ApiProxyRequestBody | null = buildRequestBody(el);
  if (!body) return;

  updateCurl(el, body);

  el.send.disabled = true;
  el.send.textContent = 'Sending...';

  // 送信中に段階表示が分かるよう、まずはプレースホルダを入れておく
  el.status.textContent = '...';
  el.time.textContent = '...';
  el.contentType.textContent = '...';
  el.respHeaders.value = '';
  el.respBodyText.value = '';
  el.respBodyJson.textContent = '';

  try {
    const result = await postProxyRequest(body);

    if (result.ok !== true) {
      setError(el.respError, result.error);
      el.status.textContent = 'error';
      return;
    }

    await renderResponseIncrementally(el, result);
  } catch (e: unknown) {
    const message: string = e instanceof Error ? e.message : String(e);
    setError(el.respError, message);
  } finally {
    el.send.disabled = false;
    el.send.textContent = 'Send';
  }
};

const main = (): void => {
  setupTabs();

  const el: Elements = getElements();
  applyDefaults(el);

  setupSavedRequestsUi({
    el,
    getCurrentRequest: (): ApiProxyRequestBody | null => buildRequestBody(el),
    applyRequestToForm: (req: ApiProxyRequestBody): void => {
      applyRequestToForm(el, req);
    },
  });

  el.send.addEventListener('click', () => {
    void sendRequest(el);
  });

  el.clear.addEventListener('click', () => {
    applyDefaults(el);
  });

  // Ctrl/Cmd+Enterで送信
  window.addEventListener('keydown', (ev: KeyboardEvent) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
      void sendRequest(el);
    }
  });
};

main();
