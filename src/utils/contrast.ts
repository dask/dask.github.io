export type ContrastEntry = { hex: string; rating: string };
/** Keep hex emphasis separate from the accessibility rating, without client HTML injection. */
export function renderContrast(element: Element, entries: ContrastEntry[]) {
  const fragment = document.createDocumentFragment();
  entries.forEach(({ hex, rating }, index) => {
    if (index) fragment.append(document.createTextNode(' '));
    const hexLabel = document.createElement('strong');
    hexLabel.textContent = hex;
    fragment.append(hexLabel, document.createTextNode(`(${rating})`));
  });
  element.replaceChildren(fragment);
}
