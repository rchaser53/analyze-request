import { getById } from './dom';
import type { Elements } from './types';

// 画面で使用するDOM参照をまとめる（nullは許容しない）
export const getElements = (): Elements => {
  return {
    method: getById<HTMLSelectElement>('method'),
    url: getById<HTMLInputElement>('url'),
    headers: getById<HTMLTextAreaElement>('headers'),
    body: getById<HTMLTextAreaElement>('body'),
    timeoutMs: getById<HTMLInputElement>('timeoutMs'),
    send: getById<HTMLButtonElement>('send'),
    clear: getById<HTMLButtonElement>('clear'),

    saveName: getById<HTMLInputElement>('saveName'),
    saveDescription: getById<HTMLTextAreaElement>('saveDescription'),
    saveRequest: getById<HTMLButtonElement>('saveRequest'),
    savedSelect: getById<HTMLSelectElement>('savedSelect'),
    loadSaved: getById<HTMLButtonElement>('loadSaved'),
    deleteSaved: getById<HTMLButtonElement>('deleteSaved'),
    savedError: getById<HTMLElement>('savedError'),

    curl: getById<HTMLElement>('curl'),
    reqError: getById<HTMLElement>('reqError'),

    status: getById<HTMLElement>('status'),
    time: getById<HTMLElement>('time'),
    contentType: getById<HTMLElement>('contentType'),
    respHeaders: getById<HTMLTextAreaElement>('respHeaders'),
    respBodyText: getById<HTMLTextAreaElement>('respBodyText'),
    respBodyJson: getById<HTMLDivElement>('respBodyJson'),
    respError: getById<HTMLElement>('respError'),
  };
};
