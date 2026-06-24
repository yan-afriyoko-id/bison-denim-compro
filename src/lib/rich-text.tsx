import type { ReactNode } from 'react';
import type { RichTextDocument, RichTextMark, RichTextNode } from '@/types';
import { cn } from '@/lib/utils';

export const EMPTY_RICH_TEXT_DOCUMENT: RichTextDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

function createTextNode(text: string): RichTextNode {
  return { type: 'text', text };
}

function createParagraphNode(text: string): RichTextNode {
  const lines = text.split('\n');
  const content: RichTextNode[] = [];

  lines.forEach((line, index) => {
    if (line.length > 0) {
      content.push(createTextNode(line));
    }
    if (index < lines.length - 1) {
      content.push({ type: 'hardBreak' });
    }
  });

  return {
    type: 'paragraph',
    content,
  };
}

function normalizeParagraphText(text: string) {
  const trimmed = text.replace(/\r\n/g, '\n').trim();
  if (!trimmed) {
    return EMPTY_RICH_TEXT_DOCUMENT;
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((paragraph) => createParagraphNode(paragraph))
    .filter((node) => (node.content?.length ?? 0) > 0);

  return {
    type: 'doc',
    content: paragraphs.length > 0 ? paragraphs : EMPTY_RICH_TEXT_DOCUMENT.content,
  } satisfies RichTextDocument;
}

function normalizeListText(text: string) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return EMPTY_RICH_TEXT_DOCUMENT;
  }

  return {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: lines.map((line) => ({
          type: 'listItem',
          content: [createParagraphNode(line)],
        })),
      },
    ],
  } satisfies RichTextDocument;
}

export function isRichTextDocument(value: unknown): value is RichTextDocument {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'type' in value &&
      (value as { type?: unknown }).type === 'doc' &&
      'content' in value &&
      Array.isArray((value as { content?: unknown }).content)
  );
}

export function normalizeRichTextValue(
  value: unknown,
  mode: 'paragraphs' | 'list' = 'paragraphs'
): RichTextDocument {
  if (isRichTextDocument(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    const listItems = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    return normalizeListText(listItems.join('\n'));
  }

  if (typeof value === 'string') {
    return mode === 'list' ? normalizeListText(value) : normalizeParagraphText(value);
  }

  return EMPTY_RICH_TEXT_DOCUMENT;
}

export function serializeRichText(value: unknown, mode: 'paragraphs' | 'list' = 'paragraphs') {
  return JSON.stringify(normalizeRichTextValue(value, mode));
}

function nodeHasMeaningfulContent(node: RichTextNode): boolean {
  if (typeof node.text === 'string' && node.text.trim().length > 0) {
    return true;
  }

  return (node.content ?? []).some(nodeHasMeaningfulContent);
}

export function hasRichTextContent(value: unknown, mode: 'paragraphs' | 'list' = 'paragraphs') {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => typeof item === 'string' && item.trim().length > 0);
  }

  const normalized = normalizeRichTextValue(value, mode);
  return normalized.content.some(nodeHasMeaningfulContent);
}

export function renderLegacyText(value: string) {
  return value
    .split('\n')
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`legacy-text-${index}`}>{paragraph}</p>
    ));
}

function applyMarks(node: ReactNode, marks?: RichTextMark[]) {
  if (!marks || marks.length === 0) {
    return node;
  }

  return marks.reduce<ReactNode>((acc, mark, index) => {
    switch (mark.type) {
      case 'bold':
        return <strong key={`mark-${index}`}>{acc}</strong>;
      case 'italic':
        return <em key={`mark-${index}`}>{acc}</em>;
      case 'underline':
        return <u key={`mark-${index}`}>{acc}</u>;
      case 'link': {
        const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '#';
        return (
          <a
            key={`mark-${index}`}
            href={href}
            target={mark.attrs?.target === '_blank' ? '_blank' : undefined}
            rel={mark.attrs?.target === '_blank' ? 'noopener noreferrer' : undefined}
          >
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, node);
}

function renderNodes(nodes: RichTextNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${node.type}-${index}`;

    switch (node.type) {
      case 'paragraph':
        return <p key={key}>{renderNodes(node.content ?? [], key)}</p>;
      case 'heading': {
        const level = typeof node.attrs?.level === 'number' ? node.attrs.level : 2;
        if (level === 3) return <h3 key={key}>{renderNodes(node.content ?? [], key)}</h3>;
        if (level === 4) return <h4 key={key}>{renderNodes(node.content ?? [], key)}</h4>;
        return <h2 key={key}>{renderNodes(node.content ?? [], key)}</h2>;
      }
      case 'bulletList':
        return <ul key={key}>{renderNodes(node.content ?? [], key)}</ul>;
      case 'orderedList':
        return <ol key={key}>{renderNodes(node.content ?? [], key)}</ol>;
      case 'listItem':
        return <li key={key}>{renderNodes(node.content ?? [], key)}</li>;
      case 'blockquote':
        return <blockquote key={key}>{renderNodes(node.content ?? [], key)}</blockquote>;
      case 'horizontalRule':
        return <hr key={key} />;
      case 'hardBreak':
        return <br key={key} />;
      case 'text':
        return <span key={key}>{applyMarks(node.text ?? '', node.marks)}</span>;
      default:
        return node.content?.length ? <div key={key}>{renderNodes(node.content, key)}</div> : null;
    }
  });
}

export function RichTextRenderer({
  content,
  className,
  mode = 'paragraphs',
}: {
  content: unknown;
  className?: string;
  mode?: 'paragraphs' | 'list';
}) {
  const normalized = normalizeRichTextValue(content, mode);

  return <div className={cn('rich-text-content', className)}>{renderNodes(normalized.content, 'rich-text')}</div>;
}
