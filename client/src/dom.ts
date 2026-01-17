// DOM要素を安全に取得する（存在しない場合は例外にする）
export const getById = <T extends HTMLElement>(id: string): T => {
  const node: HTMLElement | null = document.getElementById(id);
  if (!node) {
    throw new Error(`Element not found: ${id}`);
  }
  return node as T;
};
