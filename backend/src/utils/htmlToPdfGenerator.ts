import puppeteer from 'puppeteer';
import { type DocumentoTesisHTML } from './wordGenerator';
import fs from 'fs';
import path from 'path';

/**
 * Estilos CSS académicos para el PDF
 */
const estilosAcademicos = `
<style>
  @page {
    size: A4;
    margin: 2.5cm;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    text-align: justify;
  }

  /* Portada - Diseño Fiel al Frontend */
  .portada-container {
    width: 100%;
    height: 100vh; /* Ocupar toda la página */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 3cm 2cm; /* Similar a py-12 px-16 */
    box-sizing: border-box;
    page-break-after: always;
    font-family: 'Times New Roman', Times, serif; /* Mantener fuente académica */
  }

  .portada-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 1cm;
  }

  .portada-logo-placeholder {
    height: 3cm;
    width: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af; /* text-gray-400 */
    font-size: 0.75rem; /* text-xs */
  }

  .portada-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
    max-width: 80%;
  }

  .portada-titulo {
    font-size: 16pt; /* text-xl aprox */
    font-weight: bold;
    margin-bottom: 0.75rem; /* mb-3 */
    line-height: 1.25;
    text-transform: uppercase;
  }

  .portada-subtitulo {
    font-size: 12pt; /* text-base */
    font-weight: bold;
    margin-bottom: 4rem; /* mb-16 */
    text-transform: uppercase;
  }

  .portada-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem; /* space-y-1 */
    font-size: 12pt; /* text-base */
    line-height: 1.6;
  }

  .portada-info p {
    margin: 0;
    text-align: center;
  }

  .portada-footer {
    text-align: center;
    padding-bottom: 1cm;
    font-size: 12pt;
  }


  /* Índice */
  .indice {
    page-break-after: always;
  }

  .indice h2 {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 30px;
    text-transform: uppercase;
  }

  /* Secciones */
  h2 {
    font-size: 14pt;
    font-weight: bold;
    margin-top: 30px;
    margin-bottom: 20px;
    text-align: center;
    text-transform: uppercase;
    page-break-before: always;
  }

  h3 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 15px;
    text-align: left;
  }

  h4 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 15px;
    margin-bottom: 10px;
    text-align: left;
  }

  p {
    margin-bottom: 12pt;
    text-align: justify;
    text-indent: 0;
  }

  strong {
    font-weight: bold;
  }

  em {
    font-style: italic;
  }

  /* Listas */
  ul, ol {
    margin: 10px 0 10px 40px;
  }

  li {
    margin-bottom: 5px;
  }

  /* Tablas */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }

  th, td {
    border: 1px solid #000;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f0f0f0;
    font-weight: bold;
  }

  /* Evitar saltos de página dentro de elementos */
  h2, h3, h4 {
    page-break-after: avoid;
  }

  p, li {
    orphans: 3;
    widows: 3;
  }
</style>
`;

/**
 * Genera la portada en HTML con diseño fiel al frontend
 */
function generarPortadaHTML(portada: DocumentoTesisHTML['portada'], logoBase64?: string): string {
  return `
    <div class="portada-container">
      <div class="portada-header">
        ${logoBase64
      ? `<img src="${logoBase64}" alt="Logo Universidad" style="height: 5cm; width: auto; margin-bottom: 15px;" />`
      : ''
    }
      </div>
      
      <div class="portada-content">
        <div class="portada-titulo">${portada.titulo}</div>
        
        <div class="portada-subtitulo">
          Proyecto Grado II
        </div>
        
        <div class="portada-info">
          <p>${portada.autor}</p>
          ${portada.email ? `<p>${portada.email}</p>` : ''}
          <p>${portada.carrera}</p>
          <p>${portada.facultad}</p>
        </div>
      </div>
      
      <div class="portada-footer">
        <p>${portada.ciudad} - ${portada.fecha}</p>
      </div>
    </div>
  `;
}

/**
 * Genera el índice en HTML
 */
function generarIndiceHTML(indiceHTML: string, seccionesHTML: DocumentoTesisHTML['seccionesHTML']): string {
  // Si el índice ya viene con HTML, usarlo directamente
  if (indiceHTML && indiceHTML.trim()) {
    return `
      <div class="indice">
        ${indiceHTML}
      </div>
    `;
  }

  // Si no hay índice, generar uno básico
  return `
    <div class="indice">
      <h2>ÍNDICE GENERAL</h2>
      <ul style="list-style: none; padding: 0;">
        ${seccionesHTML.map((seccion, index) => `
          <li style="margin: 10px 0;">
            ${index + 1}. ${seccion.titulo || 'SECCIÓN ' + (index + 1)}
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Genera el documento HTML completo
 */
function generarDocumentoHTML(documento: DocumentoTesisHTML, logoBase64?: string): string {
  const portadaHTML = generarPortadaHTML(documento.portada, logoBase64);
  const indiceHTML = generarIndiceHTML(documento.indiceHTML, documento.seccionesHTML);

  // DEBUG: Ver estructura de secciones
  console.log('🔍 [DEBUG PDF] Total de secciones:', documento.seccionesHTML.length);
  documento.seccionesHTML.forEach((seccion, index) => {
    console.log(`🔍 [DEBUG PDF] Sección ${index}:`, {
      titulo: seccion.titulo,
      tieneContenidoHTML: !!seccion.contenidoHTML,
      longitudContenido: seccion.contenidoHTML?.length || 0,
      primeros100Chars: seccion.contenidoHTML?.substring(0, 100) || 'VACÍO'
    });
  });

  // Generar secciones - cada sección ya tiene sus propios h2 que fuerzan page-break
  const seccionesHTML = documento.seccionesHTML.map(seccion => {
    return `<div class="seccion">${seccion.contenidoHTML}</div>`;
  }).join('\n');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${documento.portada.titulo}</title>
      ${estilosAcademicos}
    </head>
    <body>
      ${portadaHTML}
      ${indiceHTML}
      ${seccionesHTML}
    </body>
    </html>
  `;
}

/**
 * Genera un PDF a partir de un documento HTML
 */
export async function generarPDFDesdeHTML(documento: DocumentoTesisHTML): Promise<Buffer> {
  // Leer logo de la universidad
  let logoBase64 = '';
  try {
    // Ruta hardcodeada por ahora según requerimiento, idealmente vendría en la configuración
    const logoPath = '/home/analista/Documentos/TesisHub/frontend/public/universityImages/unerg-logo-png_seeklogo-265623.png';
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      // Asumimos PNG por la extensión del archivo
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.error('Error al leer el logo para PDF:', error);
  }

  const html = generarDocumentoHTML(documento, logoBase64);

  // Lanzar navegador headless
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Establecer contenido HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: {
        top: '2.5cm',
        right: '2.5cm',
        bottom: '2.5cm',
        left: '2.5cm'
      }
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
