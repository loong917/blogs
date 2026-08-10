function addClass(node, className) {
  node.properties ??= {};
  const current = node.properties.className ?? [];
  node.properties.className = Array.isArray(current)
    ? [...current, className]
    : [current, className];
}

function nodeText(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(nodeText).join('');
}

function markReferenceSections(parent) {
  if (!Array.isArray(parent.children)) return;

  parent.children.forEach((node, index) => {
    if (node.type !== 'element' || !/^h[1-6]$/.test(node.tagName)) return;
    if (!/^(参考|参考文献|参考资料|references?)$/i.test(nodeText(node).trim())) return;

    addClass(node, 'journal-reference-heading');
    const referenceList = parent.children
      .slice(index + 1)
      .find((child) => child.type === 'element' && (child.tagName === 'ul' || child.tagName === 'ol'));

    if (!referenceList) return;
    addClass(referenceList, 'journal-references');

    for (const item of referenceList.children ?? []) {
      if (item.type !== 'element' || item.tagName !== 'li') continue;
      const firstText = item.children?.find((child) => child.type === 'text');
      if (firstText) firstText.value = firstText.value.replace(/^\s*\[\d+\]\s*/, '');
    }
  });
}

function transformChildren(parent) {
  if (!Array.isArray(parent.children)) return;

  parent.children = parent.children.map((node) => {
    if (node.type !== 'element') return node;

    if (/^h[1-6]$/.test(node.tagName)) addClass(node, 'journal-heading');

    if (node.tagName === 'blockquote') addClass(node, 'journal-callout');

    if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
      const href = node.properties.href;
      if (/^https?:\/\//.test(href)) {
        node.properties.target = '_blank';
        node.properties.rel = ['noreferrer', 'noopener'];
      }
    }

    if (node.tagName === 'pre') {
      addClass(node, 'journal-code');
      const code = node.children?.find((child) => child.type === 'element' && child.tagName === 'code');
      const languageClass = code?.properties?.className?.find?.((value) => String(value).startsWith('language-'));
      if (languageClass) node.properties.dataLanguage = String(languageClass).replace('language-', '');
    }

    if (node.tagName === 'img') {
      addClass(node, 'journal-image');
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';
    }

    transformChildren(node);

    if (
      node.tagName === 'p' &&
      node.children?.length === 1 &&
      node.children[0].type === 'element' &&
      node.children[0].tagName === 'img'
    ) {
      const image = node.children[0];
      const alt = typeof image.properties?.alt === 'string' ? image.properties.alt : '';
      return {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['journal-figure'] },
        children: [
          image,
          ...(alt
            ? [{ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: alt }] }]
            : []),
        ],
      };
    }

    if (node.tagName === 'table') {
      return {
        type: 'element',
        tagName: 'div',
        properties: { className: ['journal-table-wrap'], role: 'region', ariaLabel: '可横向滚动的表格' },
        children: [node],
      };
    }

    return node;
  });

  markReferenceSections(parent);
}

export default function rehypeJournal() {
  return (tree) => transformChildren(tree);
}
