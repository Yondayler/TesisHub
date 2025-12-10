import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { marked } from 'marked';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useEffect } from 'react';

interface TesisEditorWYSIWYGProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
    onEditorReady?: (editor: Editor | null) => void;
}

export function TesisEditorWYSIWYG({
    content,
    onChange,
    editable = true,
    onEditorReady
}: TesisEditorWYSIWYGProps) {

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                }
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableHeader,
            TableCell.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        class: {
                            default: null,
                            parseHTML: element => element.getAttribute('class'),
                            renderHTML: attributes => {
                                return {
                                    class: attributes.class,
                                }
                            },
                        },
                    }
                },
            }),
            Image.configure({
                inline: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Highlight.configure({
                multicolor: true
            }),
            TextStyle,
            Color,
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[600px] text-black prose-headings:font-bold prose-headings:text-black prose-p:text-justify prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base prose-h1:text-2xl prose-h1:mb-6 prose-h1:text-center prose-h1:uppercase prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:font-semibold prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-6 prose-h3:font-semibold prose-strong:font-bold prose-strong:text-black prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4 prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4 prose-li:mb-2 prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-table:w-full prose-table:border-collapse prose-table:mb-4 prose-th:border prose-th:border-gray-400 prose-th:p-2 prose-th:bg-gray-100 prose-th:font-bold prose-td:border prose-td:border-gray-400 prose-td:p-2',
            },
        },
    });



    // Actualizar contenido cuando cambie externamente
    useEffect(() => {
        const updateContent = async () => {
            if (editor && content) {
                // Evitar actualizaciones si el contenido es idéntico (para evitar bucles con HTML)
                const currentHTML = editor.getHTML();
                if (content === currentHTML) return;

                // Intentar detectar si es Markdown (tiene # o * y no empieza con tags HTML comunes)
                // O simplemente parsear siempre, ya que marked respeta HTML existente
                try {
                    // Si el contenido parece HTML (empieza con <), úsalo directo
                    // Si no, parsealo con marked
                    const isHTML = /^\s*<[a-z][\s\S]*>/i.test(content);

                    if (isHTML) {
                        editor.commands.setContent(content);
                    } else {
                        const parsed = await marked.parse(content);
                        editor.commands.setContent(parsed);
                    }
                } catch (e) {
                    console.error('Error parsing markdown:', e);
                    editor.commands.setContent(content);
                }
            } else if (editor && !content) {
                editor.commands.setContent('');
            }
        };

        updateContent();
    }, [content, editor]);

    // Notificar cuando el editor esté listo
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
        return () => {
            if (onEditorReady) {
                onEditorReady(null);
            }
        };
    }, [editor, onEditorReady]);

    return (
        <div className="flex flex-col w-full">
            <div className="w-full">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
