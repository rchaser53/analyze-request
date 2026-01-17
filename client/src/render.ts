import type { ApiProxyOkResponse, Elements } from './types';
import { prettyJson } from './json';
import { renderJsonTree } from './jsonTree';

const nextPaint = async (): Promise<void> => {
  await new Promise<void>((resolve: () => void) => {
    requestAnimationFrame(() => resolve());
  });
};

const setMeta = (el: Elements, result: ApiProxyOkResponse): void => {
  el.status.textContent = `${result.status} ${result.statusText}`;
  el.time.textContent = `${result.durationMs} ms`;
  el.contentType.textContent = result.contentType || '-';
};

const setHeaders = (el: Elements, result: ApiProxyOkResponse): void => {
  el.respHeaders.value = prettyJson(result.headers);
};

const setBodyText = (el: Elements, result: ApiProxyOkResponse): void => {
  el.respBodyText.value = result.bodyText ?? '';
};

const setBodyJson = (el: Elements, result: ApiProxyOkResponse): void => {
  if (result.bodyJson === null) {
    // JSONではない/解析失敗の場合の表示
    el.respBodyJson.textContent = '（JSONとして表示できません）';
    return;
  }

  renderJsonTree(el.respBodyJson, result.bodyJson);
};

// レスポンスをプロパティ単位で段階的に表示する
export const renderResponseIncrementally = async (
  el: Elements,
  result: ApiProxyOkResponse,
): Promise<void> => {
  setMeta(el, result);
  await nextPaint();

  setHeaders(el, result);
  await nextPaint();

  setBodyText(el, result);
  await nextPaint();

  setBodyJson(el, result);
};
