import type { Tabs } from './types';

// タブ切り替えを設定する
export const setupTabs = (): void => {
  const tabs: HTMLButtonElement[] = Array.from(document.querySelectorAll('.tab')) as HTMLButtonElement[];
  const panels: HTMLElement[] = Array.from(document.querySelectorAll('.tabPanel')) as HTMLElement[];

  const setActive = (name: Tabs): void => {
    for (const tab of tabs) {
      const tabName: Tabs = (tab.dataset.tab as Tabs) ?? 'text';
      tab.classList.toggle('active', tabName === name);
    }

    for (const panel of panels) {
      const panelName: Tabs = (panel.dataset.panel as Tabs) ?? 'text';
      panel.classList.toggle('hidden', panelName !== name);
    }
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const name: Tabs = (tab.dataset.tab as Tabs) ?? 'text';
      setActive(name);
    });
  }

  setActive('text');
};
