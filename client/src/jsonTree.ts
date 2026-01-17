export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type JsonKind = 'null' | 'boolean' | 'number' | 'string' | 'array' | 'object' | 'unknown';

const getKind = (value: unknown): JsonKind => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'object':
      return 'object';
    default:
      return 'unknown';
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  return true;
};

const createSpan = (className: string, text: string): HTMLSpanElement => {
  const span: HTMLSpanElement = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
};

const formatPrimitive = (value: unknown): { className: string; text: string } => {
  const kind: JsonKind = getKind(value);
  if (kind === 'string') return { className: 'tree-value tree-string', text: JSON.stringify(value) };
  if (kind === 'number') return { className: 'tree-value tree-number', text: String(value) };
  if (kind === 'boolean') return { className: 'tree-value tree-boolean', text: String(value) };
  if (kind === 'null') return { className: 'tree-value tree-null', text: 'null' };
  return { className: 'tree-value tree-unknown', text: String(value) };
};

const createPrimitiveNode = (value: unknown): HTMLElement => {
  const formatted = formatPrimitive(value);
  return createSpan(formatted.className, formatted.text);
};

const createSummaryText = (value: unknown): string => {
  const kind: JsonKind = getKind(value);
  if (kind === 'array') {
    const arr: unknown[] = value as unknown[];
    return `Array(${arr.length})`;
  }
  if (kind === 'object') {
    const obj: Record<string, unknown> = value as Record<string, unknown>;
    return `Object(${Object.keys(obj).length})`;
  }
  return formatPrimitive(value).text;
};

const createEntryRow = (label: string, node: HTMLElement): HTMLDivElement => {
  const row: HTMLDivElement = document.createElement('div');
  row.className = 'tree-row';

  const key: HTMLSpanElement = createSpan('tree-key', label);
  const sep: HTMLSpanElement = createSpan('tree-sep', ': ');

  row.appendChild(key);
  row.appendChild(sep);
  row.appendChild(node);

  return row;
};

const createContainer = (depth: number): HTMLDivElement => {
  const container: HTMLDivElement = document.createElement('div');
  container.className = 'tree-children';
  container.style.setProperty('--tree-depth', String(depth));
  return container;
};

const createNode = (value: unknown, depth: number, open: boolean): HTMLElement => {
  const kind: JsonKind = getKind(value);

  if (kind !== 'array' && kind !== 'object') {
    return createPrimitiveNode(value);
  }

  const details: HTMLDetailsElement = document.createElement('details');
  details.className = 'tree-node';
  details.open = open;

  const summary: HTMLElement = document.createElement('summary');
  summary.className = 'tree-summary';
  summary.appendChild(createSpan('tree-preview', createSummaryText(value)));
  details.appendChild(summary);

  const children: HTMLDivElement = createContainer(depth);

  if (kind === 'array') {
    const arr: unknown[] = value as unknown[];
    for (let i = 0; i < arr.length; i += 1) {
      const child: unknown = arr[i];
      const childNode: HTMLElement = createNode(child, depth + 1, false);
      children.appendChild(createEntryRow(String(i), childNode));
    }
  }

  if (kind === 'object') {
    if (isPlainObject(value)) {
      const keys: string[] = Object.keys(value);
      keys.sort((a: string, b: string) => a.localeCompare(b));
      for (const key of keys) {
        const child: unknown = value[key];
        const childNode: HTMLElement = createNode(child, depth + 1, false);
        children.appendChild(createEntryRow(key, childNode));
      }
    }
  }

  details.appendChild(children);
  return details;
};

// JSONをChrome DevTools風にネスト展開しながら表示する
export const renderJsonTree = (container: HTMLElement, value: unknown): void => {
  container.innerHTML = '';

  if (value === undefined) {
    container.appendChild(createSpan('tree-empty', '（未取得）'));
    return;
  }

  const root: HTMLElement = createNode(value, 0, true);
  container.appendChild(root);
};
