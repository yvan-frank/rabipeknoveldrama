'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading2, Highlighter, Italic, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), Highlight],
    content,
    // Next.js SSR : évite le rendu initial côté serveur (l'éditeur ne fait
    // sens que côté client) et le mismatch d'hydratation qui en résulterait.
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        class:
          'min-h-60 max-w-none px-3 py-2 text-sm outline-none [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_mark]:rounded [&_mark]:bg-brand-amber/40 [&_mark]:px-0.5',
      },
    },
  });

  if (!editor) {
    return <div className="h-72 animate-pulse rounded-lg border border-black/15 bg-black/[0.03] dark:border-white/20 dark:bg-white/[0.04]" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-black/15 dark:border-white/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-black/[0.015] p-1.5 dark:border-white/10 dark:bg-white/[0.03]">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Gras">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italique">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Titre">
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Liste à puces">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Liste numérotée">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} label="Surligner">
          <Highlighter size={15} />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-black/10 dark:bg-white/15" />
        <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} label="Aligner à gauche">
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} label="Centrer">
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} label="Aligner à droite">
          <AlignRight size={15} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex size-7 items-center justify-center rounded-md transition ${
        active ? 'bg-foreground text-background' : 'text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
