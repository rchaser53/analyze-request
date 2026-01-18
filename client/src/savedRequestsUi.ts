import { deleteSavedRequest, getSavedRequestById, listSavedRequests, saveNewRequest, updateSavedRequest } from './savedRequests';
import type { ApiProxyRequestBody, Elements } from './types';

const setError = (target: HTMLElement, message: string): void => {
  target.textContent = message;
};

const rebuildSelect = (el: Elements, selectedId: string | null): void => {
  const items = listSavedRequests();

  el.savedSelect.innerHTML = '';

  const placeholder: HTMLOptionElement = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = items.length === 0 ? '（保存されたリクエストはありません）' : '選択してください';
  el.savedSelect.appendChild(placeholder);

  for (const item of items) {
    const opt: HTMLOptionElement = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.description ? `${item.name} — ${item.description}` : item.name;
    el.savedSelect.appendChild(opt);
  }

  if (selectedId) {
    el.savedSelect.value = selectedId;
  }
};

const updateSaveButtonLabel = (el: Elements): void => {
  const hasSelection: boolean = Boolean(el.savedSelect.value);
  el.saveRequest.textContent = hasSelection ? 'Update' : 'Save';
};

export const setupSavedRequestsUi = (args: {
  el: Elements;
  getCurrentRequest: () => ApiProxyRequestBody | null;
  applyRequestToForm: (req: ApiProxyRequestBody) => void;
}): void => {
  const { el, getCurrentRequest, applyRequestToForm } = args;

  rebuildSelect(el, null);
  updateSaveButtonLabel(el);

  el.saveRequest.addEventListener('click', () => {
    setError(el.savedError, '');

    const name: string = el.saveName.value.trim();
    const description: string = el.saveDescription.value.trim();

    if (!name) {
      setError(el.savedError, '保存名を入力してください');
      return;
    }

    const req: ApiProxyRequestBody | null = getCurrentRequest();
    if (!req) {
      setError(el.savedError, '入力が不正なため保存できません（Headers JSONなどを確認してください）');
      return;
    }

    const selectedId: string = el.savedSelect.value;
    if (selectedId) {
      const selected = getSavedRequestById(selectedId);
      if (!selected) {
        setError(el.savedError, '選択されたリクエストが見つかりません（再読み込みしてください）');
        rebuildSelect(el, null);
        updateSaveButtonLabel(el);
        return;
      }

      const ok: boolean = window.confirm(`「${selected.name}」を上書き更新しますか？`);
      if (!ok) return;

      const updated = updateSavedRequest({ id: selectedId, name, description, request: req });
      if (!updated) {
        setError(el.savedError, '上書き更新に失敗しました');
        return;
      }

      rebuildSelect(el, updated.id);
      updateSaveButtonLabel(el);
      return;
    }

    // 選択が無い場合でも、同名があれば上書き候補にする
    const existingSameName = listSavedRequests().find((it) => it.name === name) ?? null;
    if (existingSameName) {
      const ok: boolean = window.confirm(
        `同名の保存「${existingSameName.name}」が存在します。上書き更新しますか？\nキャンセルで新規保存します。`,
      );

      if (ok) {
        const updated = updateSavedRequest({
          id: existingSameName.id,
          name,
          description,
          request: req,
        });

        if (!updated) {
          setError(el.savedError, '上書き更新に失敗しました');
          return;
        }

        rebuildSelect(el, updated.id);
        updateSaveButtonLabel(el);
        return;
      }
    }

    const saved = saveNewRequest({ name, description, request: req });
    rebuildSelect(el, saved.id);
    updateSaveButtonLabel(el);
  });

  el.loadSaved.addEventListener('click', () => {
    setError(el.savedError, '');

    const id: string = el.savedSelect.value;
    if (!id) {
      setError(el.savedError, '読み込むリクエストを選択してください');
      return;
    }

    const saved = getSavedRequestById(id);
    if (!saved) {
      setError(el.savedError, '選択されたリクエストが見つかりません（再読み込みしてください）');
      rebuildSelect(el, null);
      return;
    }

    // 入力欄にも反映（編集して再保存しやすくする）
    el.saveName.value = saved.name;
    el.saveDescription.value = saved.description;

    el.savedSelect.value = saved.id;
    updateSaveButtonLabel(el);

    applyRequestToForm(saved.request);
  });

  el.deleteSaved.addEventListener('click', () => {
    setError(el.savedError, '');

    const id: string = el.savedSelect.value;
    if (!id) {
      setError(el.savedError, '削除するリクエストを選択してください');
      return;
    }

    const saved = getSavedRequestById(id);
    if (!saved) {
      setError(el.savedError, '選択されたリクエストが見つかりません');
      rebuildSelect(el, null);
      return;
    }

    const ok: boolean = window.confirm(`「${saved.name}」を削除しますか？`);
    if (!ok) return;

    deleteSavedRequest(id);
    rebuildSelect(el, null);
    updateSaveButtonLabel(el);
  });

  el.savedSelect.addEventListener('change', () => {
    setError(el.savedError, '');
    updateSaveButtonLabel(el);

    const id: string = el.savedSelect.value;
    if (!id) return;

    const saved = getSavedRequestById(id);
    if (!saved) return;

    el.saveName.value = saved.name;
    el.saveDescription.value = saved.description;
  });
};
