'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  CornerDownLeft,
  Undo2,
  Redo2,
  Unlink,
} from 'lucide-react';
import type { RichTextDocument } from '@/types';
import { cn } from '@/lib/utils';
import { EMPTY_RICH_TEXT_DOCUMENT, normalizeRichTextValue } from '@/lib/rich-text';

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  mode = 'paragraphs',
}: {
  label?: string;
  value: unknown;
  onChange: (value: RichTextDocument) => void;
  placeholder?: string;
  mode?: 'paragraphs' | 'list';
}) {
  const normalizedValue = normalizeRichTextValue(value, mode);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? 'Tulis konten di sini...',
      }),
    ],
    content: normalizedValue,
    onUpdate({ editor: currentEditor }) {
      onChange((currentEditor.getJSON() as RichTextDocument) ?? EMPTY_RICH_TEXT_DOCUMENT);
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[220px] w-full px-4 py-3 text-sm text-gray-900 outline-none focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getJSON();
    const next = normalizedValue;

    if (JSON.stringify(current) !== JSON.stringify(next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, normalizedValue]);

  function setLink() {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Masukkan URL link', previousUrl ?? 'https://');

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  const toolbarButtons = editor
    ? [
        { icon: Bold, label: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
        { icon: Italic, label: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        { icon: UnderlineIcon, label: 'Underline', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
        { icon: Heading2, label: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
        { icon: Heading3, label: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
        { icon: Heading4, label: 'Heading 4', action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: editor.isActive('heading', { level: 4 }) },
        { icon: List, label: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
        { icon: ListOrdered, label: 'Ordered List', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
        { icon: Quote, label: 'Blockquote', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
        { icon: Minus, label: 'Horizontal Rule', action: () => editor.chain().focus().setHorizontalRule().run(), active: false },
        { icon: Link2, label: 'Link', action: setLink, active: editor.isActive('link') },
        { icon: Unlink, label: 'Remove Link', action: () => editor.chain().focus().unsetLink().run(), active: false },
        { icon: CornerDownLeft, label: 'Hard Break', action: () => editor.chain().focus().setHardBreak().run(), active: false },
        { icon: Undo2, label: 'Undo', action: () => editor.chain().focus().undo().run(), active: false, disabled: !editor.can().chain().focus().undo().run() },
        { icon: Redo2, label: 'Redo', action: () => editor.chain().focus().redo().run(), active: false, disabled: !editor.can().chain().focus().redo().run() },
      ]
    : [];

  return (
    <div>
      {label && <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>}
      <div className="overflow-hidden rounded-sm border border-gray-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-2">
          {toolbarButtons.map(({ icon: Icon, label: buttonLabel, action, active, disabled }) => (
            <button
              key={buttonLabel}
              type="button"
              onClick={action}
              disabled={disabled}
              title={buttonLabel}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-sm border text-gray-500 transition-colors',
                active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:border-gray-900 hover:text-gray-900',
                disabled && 'opacity-50'
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
