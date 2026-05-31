'use strict';

/**
 * Report exporters. CSV / JSON / HTML are always available (zero deps); XLSX
 * (exceljs) and PDF (pdfkit) activate when the optional dependency is installed —
 * otherwise they raise a clear 501 with an install hint. render() returns an
 * artifact envelope { content, encoding, contentType, ext } that the run pipeline
 * persists and the download endpoint streams.
 */

const { AppError } = require('../utils/errors');

const FORMATS = ['csv', 'json', 'html', 'xlsx', 'pdf'];

/** Resolve the column list: explicit columns spec wins; otherwise infer from rows. */
function resolveColumns(columnsSpec = [], rows = []) {
    if (Array.isArray(columnsSpec) && columnsSpec.length) {
        return columnsSpec.map((c) => ({ key: c.key, label: c.label || c.key, format: c.format || null }));
    }
    const keys = new Set();
    for (const r of rows.slice(0, 50)) Object.keys(r || {}).forEach((k) => keys.add(k));
    return [...keys].map((k) => ({ key: k, label: k, format: null }));
}

function cell(v) {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

function csvEscape(s) {
    const str = cell(s);
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function htmlEscape(s) {
    return cell(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toCSV(rows, cols) {
    const header = cols.map((c) => csvEscape(c.label)).join(',');
    const body = rows.map((r) => cols.map((c) => csvEscape(r[c.key])).join(',')).join('\n');
    return `${header}\n${body}`;
}

function toJSON(rows, cols) {
    return JSON.stringify({ columns: cols.map((c) => c.label), rows: rows.map((r) => Object.fromEntries(cols.map((c) => [c.key, r[c.key] ?? null]))) }, null, 2);
}

function toHTML(rows, cols, meta = {}) {
    const head = cols.map((c) => `<th>${htmlEscape(c.label)}</th>`).join('');
    const body = rows.map((r) => `<tr>${cols.map((c) => `<td>${htmlEscape(r[c.key])}</td>`).join('')}</tr>`).join('\n');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${htmlEscape(meta.title || 'Report')}</title>
<style>body{font:13px system-ui,Segoe UI,Arial;margin:24px;color:#1a1a1a}
h1{font-size:18px;margin:0 0 4px}.meta{color:#666;font-size:12px;margin-bottom:16px}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}
th{background:#f5f5f7}tr:nth-child(even){background:#fafafa}</style></head>
<body><h1>${htmlEscape(meta.title || 'Report')}</h1>
<div class="meta">Generated ${new Date().toISOString()} · ${rows.length} row(s)</div>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

async function toXLSX(rows, cols, meta = {}) {
    let ExcelJS;
    try { ExcelJS = require('exceljs'); }
    catch { throw new AppError('NOT_IMPLEMENTED', 'Excel export requires the optional "exceljs" dependency (pnpm add exceljs)', 501); }
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Baalvion Report Service';
    const ws = wb.addWorksheet((meta.title || 'Report').slice(0, 28));
    ws.columns = cols.map((c) => ({ header: c.label, key: c.key, width: Math.min(40, Math.max(12, c.label.length + 2)) }));
    ws.getRow(1).font = { bold: true };
    for (const r of rows) ws.addRow(cols.reduce((o, c) => { o[c.key] = (r[c.key] && typeof r[c.key] === 'object') ? cell(r[c.key]) : r[c.key]; return o; }, {}));
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
}

function toPDF(rows, cols, meta = {}) {
    let PDFDocument;
    try { PDFDocument = require('pdfkit'); }
    catch { throw new AppError('NOT_IMPLEMENTED', 'PDF export requires the optional "pdfkit" dependency (pnpm add pdfkit)', 501); }
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
            const chunks = [];
            doc.on('data', (d) => chunks.push(d));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(16).text(meta.title || 'Report', { underline: false });
            doc.moveDown(0.2).fontSize(9).fillColor('#666').text(`Generated ${new Date().toISOString()} · ${rows.length} row(s)`).fillColor('#000');
            doc.moveDown(0.6);

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const colWidth = pageWidth / cols.length;
            const drawRow = (vals, bold) => {
                const y = doc.y;
                doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica');
                vals.forEach((v, i) => doc.text(cell(v).slice(0, 60), doc.page.margins.left + i * colWidth, y, { width: colWidth - 4, ellipsis: true }));
                doc.moveDown(0.2);
                doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#eee').stroke();
            };
            drawRow(cols.map((c) => c.label), true);
            for (const r of rows) {
                if (doc.y > doc.page.height - doc.page.margins.bottom - 20) doc.addPage();
                drawRow(cols.map((c) => r[c.key]), false);
            }
            doc.end();
        } catch (err) { reject(err); }
    });
}

async function render(format, { rows = [], columns = [], meta = {} } = {}) {
    const fmt = String(format || 'csv').toLowerCase();
    if (!FORMATS.includes(fmt)) throw new AppError('BAD_REQUEST', `Unsupported format: ${fmt}. One of ${FORMATS.join(', ')}`, 400);
    const cols = resolveColumns(columns, rows);

    switch (fmt) {
        case 'csv':  return { content: toCSV(rows, cols),  encoding: 'utf8', contentType: 'text/csv; charset=utf-8', ext: 'csv' };
        case 'json': return { content: toJSON(rows, cols), encoding: 'utf8', contentType: 'application/json; charset=utf-8', ext: 'json' };
        case 'html': return { content: toHTML(rows, cols, meta), encoding: 'utf8', contentType: 'text/html; charset=utf-8', ext: 'html' };
        case 'xlsx': return { content: (await toXLSX(rows, cols, meta)).toString('base64'), encoding: 'base64', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' };
        case 'pdf':  return { content: (await toPDF(rows, cols, meta)).toString('base64'),  encoding: 'base64', contentType: 'application/pdf', ext: 'pdf' };
        default:     throw new AppError('BAD_REQUEST', `Unsupported format: ${fmt}`, 400);
    }
}

module.exports = { FORMATS, resolveColumns, toCSV, toJSON, toHTML, toXLSX, toPDF, render };
