export interface BlogData {
  id: number;
  title: string;
  date: string;
  image: string;
  tags: string[];
  summary?: string;
}

export function parseBlogDate(date: string, id?: number) {
  const matched = date.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (matched) {
    return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
  }

  const source = String(id ?? '');
  if (source.length >= 8) {
    return new Date(Number(source.slice(0, 4)), Number(source.slice(4, 6)) - 1, Number(source.slice(6, 8)));
  }

  return new Date(0);
}

export function getDateView(date: string, id?: number) {
  const parsed = parseBlogDate(date, id);
  return {
    day: String(parsed.getDate()).padStart(2, '0'),
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(parsed).toUpperCase(),
    month: new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(parsed),
    iso: Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString(),
  };
}

export function getReadingMinutes(body: string) {
  const imageCount = (body.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []).length;
  const plain = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|=-]/g, '');

  const chineseChars = (plain.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const otherWords = (plain.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;

  const minutes = chineseChars / 400 + otherWords / 200 + imageCount * (12 / 60);
  return Math.max(1, Math.round(minutes));
}

export function createExcerpt(body: string, summary?: string, maxLength = 96) {
  if (summary) return summary;

  const blocks = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter((block) => {
      if (!block || /^#{1,6}\s/.test(block)) return false;
      if (/^(目录|参考|References?)$/i.test(block)) return false;
      if (/^\s*(?:[-*+]|\d+[.、])\s*/.test(block)) return false;
      if (/^(?:\s*[-*+]\s+.+\r?\n?){2,}$/.test(block)) return false;
      if (/^\s*\|.*\|\s*$/m.test(block)) return false;
      return true;
    })
    .map((block) => block
      .replace(/^>\s?/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+[.、]\s*/gm, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_`~]/g, '')
      .replace(/^[^\u4e00-\u9fff：]{3,100}[A-Za-z]+：\s*/, '')
      .replace(/\s+/g, ' ')
      .trim())
    .filter((block) => block.length >= 24);

  const paragraph = blocks[0] ?? '';

  if (!paragraph) return '打开这篇记录，继续阅读完整内容。';
  return paragraph.length > maxLength ? `${paragraph.slice(0, maxLength).trim()}…` : paragraph;
}
