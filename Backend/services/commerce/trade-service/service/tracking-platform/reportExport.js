'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — dependency-free CSV
 * serialization for tracking reports. XLSX/PDF are intentionally not
 * implemented here: they need a binary-format library (exceljs/pdfkit) that
 * isn't currently a trade-service dependency, and adding one is a deliberate
 * package.json change, not something to do silently inside a report
 * endpoint. CSV/JSON cover the same data losslessly in the meantime.
 */
function toCsv(rows) {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
        if (v == null) return '';
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','));
    return lines.join('\n');
}

module.exports = { toCsv };
