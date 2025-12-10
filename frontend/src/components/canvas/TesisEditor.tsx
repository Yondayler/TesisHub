import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Capitulo } from '@/types/canvas';
import { Bold, Italic, AlignLeft, AlignCenter, AlignJustify, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TesisEditorProps {
    capitulos: Capitulo[];
    onExportarCapitulo?: (capitulo: Capitulo) => void;
    exportandoCapituloId?: number | null;
}

// Función simple para convertir Markdown básico a HTML
const parseMarkdown = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negritas
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Cursivas
        .replace(/### (.*?)\n/g, '<h3>$1</h3>') // H3
        .replace(/## (.*?)\n/g, '<h2>$1</h2>') // H2
        .replace(/# (.*?)\n/g, '<h1>$1</h1>') // H1
        .replace(/\n/g, '<br/>'); // Saltos de línea
};

export function TesisEditor({ capitulos, onExportarCapitulo, exportandoCapituloId }: TesisEditorProps) {
    // Convertir capítulos a HTML
    const contenidoHTML = capitulos.map(cap => `
    <h1>${cap.titulo}</h1>
    ${cap.subsecciones.map(sub => `
      <h2>${sub.titulo}</h2>
      ${parseMarkdown(sub.contenido)}
    `).join('')}
    ${cap.referencias && cap.referencias.length > 0 ? `
      <h3>Referencias</h3>
      <ul>
        ${cap.referencias.map(ref => `<li>${ref}</li>`).join('')}
      </ul>
    ` : ''}
  `).join('<hr/>');

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: contenidoHTML,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl prose-invert dark:prose-invert max-w-none focus:outline-none min-h-full p-[2.54cm]',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col h-full bg-[var(--card)]">
            {/* Toolbar */}
            <div className="border-b border-[var(--border)] p-2 flex items-center gap-2 bg-[var(--muted)]">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-[var(--border)] mx-2" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={editor.isActive({ textAlign: 'left' }) ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}
                >
                    <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={editor.isActive({ textAlign: 'center' }) ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}
                >
                    <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={editor.isActive({ textAlign: 'justify' }) ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}
                >
                    <AlignJustify className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor Content - Estilo Word */}
            <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-8 flex justify-center">
                <EditorContent
                    editor={editor}
                    className="w-[210mm] min-h-[297mm] bg-white dark:bg-[#1a1a1a] shadow-lg text-black dark:text-white"
                />
            </div>

            {/* Lista de Capítulos (sidebar derecho) */}
            {capitulos.length > 0 && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--muted)]">
                    <h3 className="font-semibold mb-2 text-sm text-[var(--foreground)]">Capítulos Generados</h3>
                    <div className="space-y-1">
                        {capitulos.map((cap) => (
                            <div key={cap.numero} className="flex items-center justify-between text-sm p-2 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded transition-colors text-[var(--muted-foreground)]">
                                <span>{cap.titulo}</span>
                                {onExportarCapitulo && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onExportarCapitulo(cap)}
                                        disabled={exportandoCapituloId === cap.numero}
                                        className="hover:bg-[var(--background)]"
                                    >
                                        {exportandoCapituloId === cap.numero ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <FileDown className="h-3 w-3" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
