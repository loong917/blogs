function addClass(node, className) {
  node.properties ??= {};
  const current = node.properties.className ?? [];
  node.properties.className = Array.isArray(current)
    ? [...current, className]
    : [current, className];
}

function hasClass(node, className) {
  const current = node.properties?.className ?? [];
  return Array.isArray(current) ? current.includes(className) : current === className;
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

function removeInlineTableOfContents(parent) {
  if (!Array.isArray(parent.children)) return;

  for (let index = 0; index < parent.children.length; index += 1) {
    const node = parent.children[index];
    if (node.type !== 'element' || !/^h[1-6]$/.test(node.tagName)) continue;
    if (!/^(目录|文章目录|table of contents)$/i.test(nodeText(node).trim())) continue;

    let endIndex = index + 1;
    while (
      endIndex < parent.children.length &&
      parent.children[endIndex].type === 'text' &&
      !parent.children[endIndex].value.trim()
    ) {
      endIndex += 1;
    }

    const nextNode = parent.children[endIndex];
    if (nextNode?.type === 'element' && (nextNode.tagName === 'ul' || nextNode.tagName === 'ol')) {
      endIndex += 1;
    }

    parent.children.splice(index, endIndex - index);
    index -= 1;
  }
}

function decorateList(list) {
  if (hasClass(list, 'journal-references') || hasClass(list, 'contains-task-list')) return;

  const ordered = list.tagName === 'ol';
  addClass(list, 'journal-list');
  addClass(list, ordered ? 'journal-list-ordered' : 'journal-list-unordered');

  list.children = (list.children ?? []).map((item) => {
    if (item.type !== 'element' || item.tagName !== 'li' || hasClass(item, 'task-list-item')) return item;

    addClass(item, 'journal-list-item');
    item.children = [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['journal-list-marker'], ariaHidden: 'true' },
        children: [],
      },
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['journal-list-content'] },
        children: item.children ?? [],
      },
    ];
    return item;
  });
}

function transformChildren(parent) {
  if (!Array.isArray(parent.children)) return;

  removeInlineTableOfContents(parent);
  markReferenceSections(parent);

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

    if (node.tagName === 'ul' || node.tagName === 'ol') decorateList(node);

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
}

export default function rehypeJournal() {
  return (tree) => transformChildren(tree);
}
