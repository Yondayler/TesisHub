import { Editor } from '@tiptap/react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Table,
    Undo, Redo, Highlighter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ToolbarEditorProps {
    editor: Editor | null;
}

export function ToolbarEditor({ editor }: ToolbarEditorProps) {
    if (!editor) {
        return null;
    }

    const ToolbarButton = ({
        onClick,
        isActive,
        icon: Icon,
        label
    }: {
        onClick: () => void;
        isActive?: boolean;
        icon: any;
        label: string;
    }) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                "h-8 w-8 p-0",
                isActive && "bg-[var(--accent)] text-[var(--accent-foreground)]"
            )}
            title={label}
        >
            <Icon className="h-4 w-4" />
        </Button>
    );

    return (
        <div className="border-b border-[var(--border)] bg-[var(--card)] p-2 flex items-center gap-1 flex-wrap sticky top-0 z-10">
            {/* Deshacer/Rehacer */}
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                icon={Undo}
                label="Deshacer"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                icon={Redo}
                label="Rehacer"
            />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Estilos de texto */}
            <Select
                value={
                    editor.isActive('heading', { level: 1 }) ? 'h1' :
                        editor.isActive('heading', { level: 2 }) ? 'h2' :
                            editor.isActive('heading', { level: 3 }) ? 'h3' :
                                'paragraph'
                }
                onValueChange={(value) => {
                    if (value === 'paragraph') {
                        editor.chain().focus().setParagraph().run();
                    } else if (value === 'h1') {
                        editor.chain().focus().toggleHeading({ level: 1 }).run();
                    } else if (value === 'h2') {
                        editor.chain().focus().toggleHeading({ level: 2 }).run();
                    } else if (value === 'h3') {
                        editor.chain().focus().toggleHeading({ level: 3 }).run();
                    }
                }}
            >
                <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="paragraph">Párrafo</SelectItem>
                    <SelectItem value="h1">Título 1</SelectItem>
                    <SelectItem value="h2">Título 2</SelectItem>
                    <SelectItem value="h3">Título 3</SelectItem>
                </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Formato de texto */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                icon={Bold}
                label="Negrita (Ctrl+B)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                icon={Italic}
                label="Cursiva (Ctrl+I)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                icon={UnderlineIcon}
                label="Subrayado (Ctrl+U)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                icon={Strikethrough}
                label="Tachado"
            />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Alineación */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                icon={AlignLeft}
                label="Alinear izquierda"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                icon={AlignCenter}
                label="Centrar"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                icon={AlignRight}
                label="Alinear derecha"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                icon={AlignJustify}
                label="Justificar"
            />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Listas */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                icon={List}
                label="Lista con viñetas"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                icon={ListOrdered}
                label="Lista numerada"
            />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Tabla */}
            <ToolbarButton
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                icon={Table}
                label="Insertar tabla"
            />

            {/* Resaltado */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive('highlight')}
                icon={Highlighter}
                label="Resaltar"
            />
        </div>
    );
}
