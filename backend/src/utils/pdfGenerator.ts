import PdfPrinter from 'pdfmake';
import { type TDocumentDefinitions } from 'pdfmake/interfaces';
import { type DocumentoTesis, type Capitulo, type DatosPortada } from './wordGenerator';

// Configuración de fuentes estándar (no requiere archivos externos)
const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

const printer = new PdfPrinter(fonts);

/**
 * Crea la definición del documento PDF para la tesis
 */
function crearDefinicionPdf(documento: DocumentoTesis): TDocumentDefinitions {
    const content: any[] = [];

    // --- PORTADA ---
    content.push(
        { text: documento.portada.universidad.toUpperCase(), style: 'header', alignment: 'center', margin: [0, 50, 0, 10] },
        { text: documento.portada.facultad.toUpperCase(), style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },
        { text: documento.portada.carrera.toUpperCase(), style: 'subheader', alignment: 'center', margin: [0, 0, 0, 60] },

        { text: documento.portada.titulo.toUpperCase(), style: 'title', alignment: 'center', margin: [0, 0, 0, 40] },

        { text: 'Trabajo de Grado presentado como requisito para optar al título de', alignment: 'center', margin: [0, 0, 0, 5] },
        { text: documento.portada.carrera, style: 'bold', alignment: 'center', margin: [0, 0, 0, 60] },

        { text: 'Autor:', alignment: 'center', margin: [0, 0, 0, 5] },
        { text: documento.portada.autor, style: 'bold', alignment: 'center', margin: [0, 0, 0, 20] }
    );

    if (documento.portada.tutor) {
        content.push(
            { text: 'Tutor:', alignment: 'center', margin: [0, 0, 0, 5] },
            { text: documento.portada.tutor, style: 'bold', alignment: 'center', margin: [0, 0, 0, 60] }
        );
    } else {
        content.push({ text: '', margin: [0, 0, 0, 60] });
    }

    content.push(
        { text: `${documento.portada.ciudad}, ${documento.portada.fecha}`, alignment: 'center', margin: [0, 50, 0, 0], pageBreak: 'after' }
    );

    // --- ÍNDICE ---
    content.push({ text: 'ÍNDICE GENERAL', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] });

    documento.capitulos.forEach(cap => {
        content.push({
            text: cap.titulo,
            style: 'tocItem',
            margin: [0, 5, 0, 2]
        });

        cap.subsecciones.forEach((sub, idx) => {
            content.push({
                text: `${cap.numero}.${idx + 1} ${sub.titulo}`,
                style: 'tocSubItem',
                margin: [20, 2, 0, 2]
            });
        });
    });

    content.push({ text: '', pageBreak: 'after' });

    // --- CAPÍTULOS ---
    documento.capitulos.forEach((cap, index) => {
        // Título del capítulo
        content.push({
            text: cap.titulo.toUpperCase(),
            style: 'chapterTitle',
            alignment: 'center',
            margin: [0, 20, 0, 20],
            pageBreak: index > 0 ? 'before' : undefined
        });

        // Subsecciones
        cap.subsecciones.forEach((sub, idx) => {
            content.push({
                text: `${cap.numero}.${idx + 1} ${sub.titulo}`,
                style: 'sectionTitle',
                margin: [0, 15, 0, 10]
            });

            // Contenido (dividir párrafos)
            const parrafos = sub.contenido.split('\n\n');
            parrafos.forEach(p => {
                if (p.trim()) {
                    content.push({
                        text: p.trim(),
                        style: 'bodyText',
                        alignment: 'justify',
                        margin: [0, 0, 0, 10]
                    });
                }
            });
        });

        // Referencias
        if (cap.referencias && cap.referencias.length > 0) {
            content.push({
                text: 'Referencias',
                style: 'sectionTitle',
                margin: [0, 20, 0, 10]
            });

            cap.referencias.forEach(ref => {
                content.push({
                    text: ref,
                    style: 'bodyText',
                    margin: [20, 0, 0, 5]
                });
            });
        }
    });

    return {
        content,
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 12,
            lineHeight: 1.5
        },
        styles: {
            header: {
                fontSize: 16,
                bold: true
            },
            subheader: {
                fontSize: 14,
                bold: true
            },
            title: {
                fontSize: 20,
                bold: true
            },
            bold: {
                bold: true
            },
            chapterTitle: {
                fontSize: 18,
                bold: true
            },
            sectionTitle: {
                fontSize: 14,
                bold: true
            },
            bodyText: {
                fontSize: 12
            },
            tocItem: {
                fontSize: 12,
                bold: true
            },
            tocSubItem: {
                fontSize: 12
            }
        },
        pageSize: 'LETTER',
        pageMargins: [72, 72, 72, 72] // 1 pulgada = 72 pt
    };
}

/**
 * Genera el documento PDF en un Buffer
 */
export async function generarDocumentoPdf(documento: DocumentoTesis): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const docDefinition = crearDefinicionPdf(documento);
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks: any[] = [];

            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err) => reject(err));

            pdfDoc.end();
        } catch (error) {
            reject(error);
        }
    });
}
