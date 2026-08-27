import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading2, Highlighter, Italic, List, ListOrdered } from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

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
      attributes: { class: 'rte__content' },
    },
  });

  if (!editor) {
    return <div className="rte__loading" />;
  }

  return (
    <div className="rte">
      <div className="rte__toolbar" role="toolbar" aria-label="Mise en forme du texte">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} label="Gras">
          <Bold size={16} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italique">
          <Italic size={16} strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Titre">
          <Heading2 size={17} strokeWidth={2.1} />
        </ToolbarButton>

        <span className="rte__divider" />

        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Liste à puces">
          <List size={16} strokeWidth={2.1} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Liste numérotée">
          <ListOrdered size={16} strokeWidth={2.1} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} label="Surligner">
          <Highlighter size={16} strokeWidth={2.1} />
        </ToolbarButton>

        <span className="rte__divider" />

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
    <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={active} className={`rte__btn${active ? ' is-active' : ''}`}>
      {children}
    </button>
  );
}
