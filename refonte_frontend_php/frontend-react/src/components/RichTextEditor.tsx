import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading2, Highlighter, Italic, List, ListOrdered } from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

const wrapperClass =
  'overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900 ' +
  '[&_.ProseMirror]:min-h-60 [&_.ProseMirror]:cursor-text [&_.ProseMirror]:px-[1.1rem] [&_.ProseMirror]:py-4 ' +
  '[&_.ProseMirror]:text-[0.9rem] [&_.ProseMirror]:leading-[1.75] [&_.ProseMirror]:outline-none ' +
  '[&_.ProseMirror_h2]:mt-3.5 [&_.ProseMirror_h2]:mb-1.5 [&_.ProseMirror_h2]:text-[1.2rem] [&_.ProseMirror_h2]:font-bold ' +
  '[&_.ProseMirror_h2:first-child]:mt-0 [&_.ProseMirror_p]:mb-2.5 ' +
  '[&_.ProseMirror_ul]:mb-2.5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 ' +
  '[&_.ProseMirror_ol]:mb-2.5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 ' +
  '[&_.ProseMirror_mark]:rounded [&_.ProseMirror_mark]:bg-brand-amber/45 [&_.ProseMirror_mark]:px-0.5';

// Port fidèle de
// refonte_rabi_frontend/src/components/dashboard/author/RichTextEditor.tsx :
// même éditeur Tiptap (gras, italique, titre H2, listes, surlignage,
// alignement), mêmes icônes lucide-react que la source (plutôt que des
// glyphes texte) — le contenu d'un chapitre est stocké en HTML.
export function RichTextEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), Highlight],
    content,
    // Évite le rendu initial avant hydratation de l'îlot React (même raison
    // que côté Next.js, même si ici il n'y a pas de SSR React à proprement
    // parler — l'éditeur ne fait sens qu'une fois monté côté client).
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {},
    },
  });

  // useEditor ne prend `content` qu'à l'initialisation — sans ça, un
  // contenu qui arrive après coup (brouillon localStorage restauré une fois
  // le livre chargé, chapitre existant récupéré en mode édition) ne se
  // reflète jamais dans l'éditeur alors que les <input> classiques (titre,
  // numéro…) se mettent bien à jour puisqu'ils sont liés à `value`.
  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, content]);

  if (!editor) {
    return <div className="min-h-60 rounded-xl border border-black/10 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.04]" />;
  }

  return (
    <div className={wrapperClass}>
      <div
        className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-black/[0.04] px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.04]"
        role="toolbar"
        aria-label="Mise en forme du texte"
      >
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Gras">
          <Bold size={16} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italique">
          <Italic size={16} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Titre">
          <Heading2 size={17} strokeWidth={2.1} />
        </ToolbarButton>

        <span className="mx-1 h-5.5 w-px shrink-0 bg-black/10 dark:bg-white/10" />

        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Liste à puces">
          <List size={16} strokeWidth={2.1} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Liste numérotée">
          <ListOrdered size={16} strokeWidth={2.1} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} label="Surligner">
          <Highlighter size={16} strokeWidth={2.1} />
        </ToolbarButton>

        <span className="mx-1 h-5.5 w-px shrink-0 bg-black/10 dark:bg-white/10" />

        <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} label="Aligner à gauche">
          <AlignLeft size={16} strokeWidth={2.1} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} label="Centrer">
          <AlignCenter size={16} strokeWidth={2.1} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} label="Aligner à droite">
          <AlignRight size={16} strokeWidth={2.1} />
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
      title={label}
      aria-pressed={active}
      className={`flex size-8.5 items-center justify-center rounded-lg border-none text-inherit transition-colors ${
        active ? 'bg-gradient-to-br from-brand-amber to-brand-pink text-neutral-900 opacity-100' : 'bg-none opacity-75 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
