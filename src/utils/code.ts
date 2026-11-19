/** Small Python-example lexer shared by static rendering and native typing.
 * Tokens are text, never executable markup. Keeping whitespace as text preserves
 * newlines and indentation, including an incomplete token while typing. */
export function codeTokens(source: string) {
  const pattern =
    /("[^"\n]*(?:"|$)|'[^'\n]*(?:'|$)|#[^\n]*|\b(?:import|from|as|def|return|False|True)\b|\b\d+\b)/g;
  const tokens: { text: string; kind?: string }[] = [];
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    if (match.index! > cursor)
      tokens.push({ text: source.slice(cursor, match.index) });
    const text = match[0];
    tokens.push({
      text,
      kind: text.startsWith('#')
        ? 'comment'
        : /^["']/.test(text)
          ? 'string'
          : /^\d/.test(text)
            ? 'number'
            : 'keyword',
    });
    cursor = match.index! + text.length;
  }
  if (cursor < source.length) tokens.push({ text: source.slice(cursor) });
  return tokens;
}
export function highlightedCode(source: string) {
  const escape = (text: string) =>
    text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  return codeTokens(source)
    .map(({ text, kind }) =>
      kind ? `<span class="${kind}">${escape(text)}</span>` : escape(text),
    )
    .join('');
}
export function renderCode(node: HTMLElement, source: string) {
  const fragment = document.createDocumentFragment();
  for (const { text, kind } of codeTokens(source)) {
    if (!kind) fragment.append(document.createTextNode(text));
    else {
      const span = document.createElement('span');
      span.className = kind;
      span.textContent = text;
      fragment.append(span);
    }
  }
  node.replaceChildren(fragment);
}
