import {
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    convertInchesToTwip
} from 'docx';

/**
 * Parser HTML simple para convertir HTML a elementos de docx
 */
export class HTMLToDocxParser {

    /**
     * Parsea HTML y retorna array de Paragraphs y Tables
     */
    static parseHTML(html: string): (Paragraph | Table)[] {
        const elements: (Paragraph | Table)[] = [];

        // Limpiar HTML
        let cleanHTML = html
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();

        // Parsear elementos principales
        const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gis;
        const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gis;
        const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gis;
        const pRegex = /<p[^>]*>(.*?)<\/p>/gis;
        const tableRegex = /<table[^>]*>(.*?)<\/table>/gis;
        const ulRegex = /<ul[^>]*>(.*?)<\/ul>/gis;
        const olRegex = /<ol[^>]*>(.*?)<\/ol>/gis;

        // Procesar por bloques
        let lastIndex = 0;
        const allMatches: Array<{ type: string; content: string; index: number }> = [];

        // Recolectar todos los matches
        let match;

        while ((match = h1Regex.exec(cleanHTML)) !== null) {
            allMatches.push({ type: 'h1', content: match[1], index: match.index });
        }
        while ((match = h2Regex.exec(cleanHTML)) !== null) {
            allMatches.push({ type: 'h2', content: match[1], index: match.index });
        }
        while ((match = h3Regex.exec(cleanHTML)) !== null) {
            allMatches.push({ type: 'h3', content: match[1], index: match.index });
        }
        while ((match = pRegex.exec(cleanHTML)) !== null) {
            allMatches.push({ type: 'p', content: match[1], index: match.index });
        }
        while ((match = tableRegex.exec(cleanHTML)) !== null) {
            allMatches.push({ type: 'table', content: match[1], index: match.index });
        }
        while ((match = ulRegex.exec(cleanHTML)) !== null) {
            allMatches.push({ type: 'ul', content: match[1], index: match.index });
        }
        while ((match = olRegex.exec(cleanHTML)) !== null) {
            allMatches.push({ type: 'ol', content: match[1], index: match.index });
        }

        // Ordenar por índice
        allMatches.sort((a, b) => a.index - b.index);

        // Procesar cada match
        for (const item of allMatches) {
            switch (item.type) {
                case 'h1':
                    elements.push(this.createHeading(item.content, HeadingLevel.HEADING_1));
                    break;
                case 'h2':
                    elements.push(this.createHeading(item.content, HeadingLevel.HEADING_2));
                    break;
                case 'h3':
                    elements.push(this.createHeading(item.content, HeadingLevel.HEADING_3));
                    break;
                case 'p':
                    elements.push(this.createParagraph(item.content));
                    break;
                case 'table':
                    const table = this.createTable(item.content);
                    if (table) elements.push(table);
                    break;
                case 'ul':
                case 'ol':
                    elements.push(...this.createList(item.content, item.type === 'ol'));
                    break;
            }
        }

        return elements;
    }

    /**
     * Crea un heading
     */
    private static createHeading(content: string, level: typeof HeadingLevel[keyof typeof HeadingLevel]): Paragraph {
        const cleanContent = this.stripTags(content);
        return new Paragraph({
            text: cleanContent,
            heading: level,
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(0.3), after: convertInchesToTwip(0.2) }
        });
    }

    /**
     * Crea un párrafo con formato
     */
    private static createParagraph(content: string): Paragraph {
        const textRuns = this.parseInlineFormatting(content);

        return new Paragraph({
            children: textRuns,
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: convertInchesToTwip(0.1) }
        });
    }

    /**
     * Parsea formato inline (bold, italic, etc.)
     */
    private static parseInlineFormatting(content: string): TextRun[] {
        const runs: TextRun[] = [];

        // Regex para detectar tags inline
        const strongRegex = /<strong>(.*?)<\/strong>/g;
        const emRegex = /<em>(.*?)<\/em>/g;
        const uRegex = /<u>(.*?)<\/u>/g;

        let text = content;
        let lastIndex = 0;
        const segments: Array<{ text: string; bold?: boolean; italic?: boolean; underline?: boolean; index: number }> = [];

        // Procesar strong
        let match;
        while ((match = strongRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                segments.push({ text: content.substring(lastIndex, match.index), index: lastIndex });
            }
            segments.push({ text: match[1], bold: true, index: match.index });
            lastIndex = match.index + match[0].length;
        }

        // Si no hay formato, retornar texto simple
        if (segments.length === 0) {
            const cleanText = this.stripTags(content);
            if (cleanText.trim()) {
                return [new TextRun({ text: cleanText })];
            }
            return [];
        }

        // Agregar texto restante
        if (lastIndex < content.length) {
            segments.push({ text: content.substring(lastIndex), index: lastIndex });
        }

        // Crear TextRuns
        for (const seg of segments) {
            const cleanText = this.stripTags(seg.text);
            if (cleanText.trim()) {
                runs.push(new TextRun({
                    text: cleanText,
                    bold: seg.bold,
                    italics: seg.italic,
                    underline: seg.underline ? {} : undefined
                }));
            }
        }

        return runs.length > 0 ? runs : [new TextRun({ text: this.stripTags(content) })];
    }

    /**
     * Crea una tabla
     */
    private static createTable(content: string): Table | null {
        const rows: TableRow[] = [];
        const trRegex = /<tr[^>]*>(.*?)<\/tr>/gis;

        let match;
        while ((match = trRegex.exec(content)) !== null) {
            const cells: TableCell[] = [];
            const tdRegex = /<td[^>]*>(.*?)<\/td>/gis;
            const thRegex = /<th[^>]*>(.*?)<\/th>/gis;

            let cellMatch;
            const rowContent = match[1];

            // Procesar td
            while ((cellMatch = tdRegex.exec(rowContent)) !== null) {
                const cellText = this.stripTags(cellMatch[1]);
                cells.push(new TableCell({
                    children: [new Paragraph({ text: cellText })],
                    borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
                    }
                }));
            }

            // Procesar th
            while ((cellMatch = thRegex.exec(rowContent)) !== null) {
                const cellText = this.stripTags(cellMatch[1]);
                cells.push(new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: cellText, bold: true })]
                    })],
                    borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
                    }
                }));
            }

            if (cells.length > 0) {
                rows.push(new TableRow({ children: cells }));
            }
        }

        if (rows.length === 0) return null;

        return new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE }
        });
    }

    /**
     * Crea una lista
     */
    private static createList(content: string, ordered: boolean): Paragraph[] {
        const paragraphs: Paragraph[] = [];
        const liRegex = /<li[^>]*>(.*?)<\/li>/gis;

        let match;
        let index = 1;
        while ((match = liRegex.exec(content)) !== null) {
            const text = this.stripTags(match[1]);
            paragraphs.push(new Paragraph({
                text: ordered ? `${index}. ${text}` : `• ${text}`,
                spacing: { after: convertInchesToTwip(0.05) },
                indent: { left: convertInchesToTwip(0.5) }
            }));
            index++;
        }

        return paragraphs;
    }

    /**
     * Elimina tags HTML
     */
    private static stripTags(html: string): string {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }
}
