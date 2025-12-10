import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
    AlignmentType,
    HeadingLevel,
    PageBreak,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    convertInchesToTwip
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { HTMLToDocxParser } from './htmlToDocxParser';

/**
 * Interfaces para tipos de datos
 */
export interface DatosPortada {
    universidad: string;
    facultad: string;
    carrera: string;
    titulo: string;
    autor: string;
    email?: string;
    tutor?: string;
    ciudad: string;
    fecha: string;
}

export interface Subseccion {
    titulo: string;
    contenido: string;
}

export interface Capitulo {
    numero: number;
    titulo: string;
    subsecciones: Subseccion[];
    referencias?: string[];
}

export interface DocumentoTesis {
    portada: DatosPortada;
    capitulos: Capitulo[];
}

/**
 * Nueva interfaz para documento con HTML
 */
export interface SeccionHTML {
    titulo: string;
    contenidoHTML: string;
}

export interface DocumentoTesisHTML {
    portada: DatosPortada;
    indiceHTML: string;
    seccionesHTML: SeccionHTML[];
}

/**
 * Crea la portada de la tesis con formato académico estándar
 */
function crearPortada(datos: DatosPortada): Paragraph[] {
    // Leer el logo de la universidad
    // La ruta debe ser relativa al directorio del backend
    const logoPath = path.join(__dirname, '../../../frontend/public/universityImages/unerg-logo-png_seeklogo-265623.png');
    let logoBuffer: Buffer | undefined;

    try {
        if (fs.existsSync(logoPath)) {
            logoBuffer = fs.readFileSync(logoPath);
        } else {
            console.warn('Logo no encontrado en:', logoPath);
        }
    } catch (error) {
        console.warn('No se pudo cargar el logo de la universidad:', error);
    }

    const elementos: Paragraph[] = [];

    // Logo de la universidad (si existe)
    if (logoBuffer) {
        elementos.push(
            new Paragraph({
                children: [
                    new ImageRun({
                        data: logoBuffer,
                        transformation: {
                            width: 100,
                            height: 100
                        },
                        type: 'png'
                    } as any)
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: convertInchesToTwip(0.5), after: convertInchesToTwip(0.5) }
            })
        );
    }

    // Universidad
    elementos.push(
        new Paragraph({
            text: datos.universidad.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(logoBuffer ? 0.3 : 1), after: convertInchesToTwip(0.3) }
        })
    );

    return [
        ...elementos,

        // Facultad
        new Paragraph({
            text: datos.facultad.toUpperCase(),
            alignment: AlignmentType.CENTER,
            spacing: { after: convertInchesToTwip(0.2) }
        }),

        // Carrera
        new Paragraph({
            text: datos.carrera.toUpperCase(),
            alignment: AlignmentType.CENTER,
            spacing: { after: convertInchesToTwip(1.5) }
        }),

        // Título de la tesis
        new Paragraph({
            children: [
                new TextRun({
                    text: datos.titulo.toUpperCase(),
                    bold: true,
                    size: 28, // 14pt
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(1), after: convertInchesToTwip(1) }
        }),

        // Subtítulo "Trabajo de Grado"
        new Paragraph({
            text: 'Trabajo de Grado presentado como requisito para optar al título de',
            alignment: AlignmentType.CENTER,
            spacing: { after: convertInchesToTwip(0.1) }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: datos.carrera,
                    bold: true
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: convertInchesToTwip(1.5) }
        }),

        // Autor
        new Paragraph({
            text: 'Autor:',
            alignment: AlignmentType.CENTER,
            spacing: { after: convertInchesToTwip(0.1) }
        }),

        new Paragraph({
            children: [
                new TextRun({
                    text: datos.autor,
                    bold: true
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: convertInchesToTwip(0.5) }
        }),

        // Tutor (si existe)
        ...(datos.tutor ? [
            new Paragraph({
                text: 'Tutor:',
                alignment: AlignmentType.CENTER,
                spacing: { after: convertInchesToTwip(0.1) }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: datos.tutor,
                        bold: true
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: convertInchesToTwip(1.5) }
            })
        ] : []),

        // Ciudad y fecha
        new Paragraph({
            text: `${datos.ciudad}, ${datos.fecha}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(2) }
        })
    ];
}

/**
 * Crea el índice académico con formato estándar
 */
function crearIndice(capitulos: Capitulo[]): Paragraph[] {
    const elementos: Paragraph[] = [
        // Título "Índice" centrado
        new Paragraph({
            text: 'Índice',
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(0.5), after: convertInchesToTwip(0.5) }
        }),

        // Línea en blanco
        new Paragraph({ text: '' })
    ];

    // Contador de página (comienza en 5 para RESUMEN)
    let numeroPagina = 5;
    let numeroSeccion = 3; // Comienza desde 3 (RESUMEN)

    capitulos.forEach((cap, capIndex) => {
        // Determinar el título de la sección principal
        let tituloSeccion = cap.titulo.toUpperCase();

        // Título principal con número de página
        elementos.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${numeroSeccion}. ${tituloSeccion}`,
                        bold: capIndex === 0 // RESUMEN en negrita
                    }),
                    new TextRun({
                        text: ' '.repeat(100), // Espacios para separación
                    }),
                    new TextRun({
                        text: numeroPagina.toString(),
                        bold: false
                    })
                ],
                spacing: { after: convertInchesToTwip(0.05) },
                tabStops: [
                    {
                        type: 'right' as any,
                        position: convertInchesToTwip(6)
                    }
                ]
            })
        );

        numeroPagina++;
        numeroSeccion++;

        // Subsecciones con indentación
        cap.subsecciones.forEach((sub, subIndex) => {
            const numeroSubseccion = `${numeroSeccion - 1}.${subIndex + 1}`;

            elementos.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `    ${numeroSubseccion} ${sub.titulo}:`,
                        }),
                        new TextRun({
                            text: ' '.repeat(100),
                        }),
                        new TextRun({
                            text: numeroPagina.toString()
                        })
                    ],
                    spacing: { after: convertInchesToTwip(0.05) },
                    indent: { left: convertInchesToTwip(0.25) },
                    tabStops: [
                        {
                            type: 'right' as any,
                            position: convertInchesToTwip(6)
                        }
                    ]
                })
            );

            numeroPagina++;
        });
    });

    return elementos;
}

/**
 * Crea un capítulo completo con sus subsecciones
 */
function crearCapitulo(capitulo: Capitulo): Paragraph[] {
    const elementos: Paragraph[] = [];

    // Título del capítulo
    elementos.push(
        new Paragraph({
            text: capitulo.titulo.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(0.5), after: convertInchesToTwip(0.5) },
            pageBreakBefore: true
        })
    );

    // Subsecciones
    capitulo.subsecciones.forEach((subseccion, idx) => {
        // Título de subsección
        elementos.push(
            new Paragraph({
                text: `${capitulo.numero}.${idx + 1} ${subseccion.titulo}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: convertInchesToTwip(0.3), after: convertInchesToTwip(0.2) }
            })
        );

        // Contenido de subsección (dividir en párrafos)
        const parrafos = subseccion.contenido.split('\n\n');
        parrafos.forEach(parrafo => {
            if (parrafo.trim()) {
                elementos.push(
                    new Paragraph({
                        text: parrafo.trim(),
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: convertInchesToTwip(0.15), line: 360 }, // Interlineado 1.5
                        indent: { firstLine: convertInchesToTwip(0.5) }
                    })
                );
            }
        });
    });

    // Referencias del capítulo (si existen)
    if (capitulo.referencias && capitulo.referencias.length > 0) {
        elementos.push(
            new Paragraph({
                text: 'Referencias',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: convertInchesToTwip(0.4), after: convertInchesToTwip(0.2) }
            })
        );

        capitulo.referencias.forEach(ref => {
            elementos.push(
                new Paragraph({
                    text: ref,
                    spacing: { after: convertInchesToTwip(0.1) },
                    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) }
                })
            );
        });
    }

    return elementos;
}

/**
 * Genera el documento completo de tesis en formato .docx
 */
export async function generarDocumentoTesis(documento: DocumentoTesis): Promise<Buffer> {
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.5) // Margen izquierdo mayor para empastado
                    }
                }
            },
            children: [
                // Portada
                ...crearPortada(documento.portada),

                // Salto de página
                new Paragraph({ children: [new PageBreak()] }),

                // Índice
                ...crearIndice(documento.capitulos),

                // Salto de página
                new Paragraph({ children: [new PageBreak()] }),

                // Capítulos
                ...documento.capitulos.flatMap(cap => crearCapitulo(cap))
            ]
        }]
    });

    return await Packer.toBuffer(doc);
}

/**
 * Genera solo un capítulo (útil para preview)
 */
export async function generarCapituloIndividual(capitulo: Capitulo): Promise<Buffer> {
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.5)
                    }
                }
            },
            children: crearCapitulo(capitulo)
        }]
    });

    return await Packer.toBuffer(doc);
}

/**
 * NUEVA FUNCIÓN: Genera documento de tesis desde HTML (mantiene formato visual)
 */
export async function generarDocumentoTesisHTML(documento: DocumentoTesisHTML): Promise<Buffer> {
    const elementos: (Paragraph | Table)[] = [];

    // 1. Portada
    elementos.push(...crearPortada(documento.portada));
    elementos.push(new Paragraph({ children: [new PageBreak()] }));

    // 2. Índice (parsear HTML)
    if (documento.indiceHTML) {
        elementos.push(
            new Paragraph({
                text: 'ÍNDICE',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: convertInchesToTwip(0.5), after: convertInchesToTwip(0.5) }
            })
        );
        const indiceElements = HTMLToDocxParser.parseHTML(documento.indiceHTML);
        elementos.push(...indiceElements);
        elementos.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // 3. Secciones (parsear HTML de cada sección)
    documento.seccionesHTML.forEach((seccion, index) => {
        // Título de sección
        elementos.push(
            new Paragraph({
                text: seccion.titulo,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: convertInchesToTwip(0.5), after: convertInchesToTwip(0.3) },
                pageBreakBefore: index > 0
            })
        );

        // Contenido HTML parseado
        const seccionElements = HTMLToDocxParser.parseHTML(seccion.contenidoHTML);
        elementos.push(...seccionElements);
    });

    // Crear documento
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.5)
                    }
                }
            },
            children: elementos
        }]
    });

    return await Packer.toBuffer(doc);
}
