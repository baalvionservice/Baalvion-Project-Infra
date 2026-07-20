'use strict';

/**
 * @module _csv-utils
 *
 * Small, dependency-free CSV reader used by validate-products.cjs and
 * import-products.cjs. Handles the cases real spreadsheet exports actually produce:
 * a UTF-8 byte-order mark, quoted fields containing commas, escaped ("") quotes
 * inside a quoted field, CRLF/LF line endings, and empty trailing columns.
 *
 * Deliberately not a full RFC 4180 implementation (no multi-line quoted fields) —
 * that's more than this system's fields (short text, semicolon-separated lists)
 * ever need, and keeping it dependency-free means one less thing to audit/update.
 */

const fs = require('node:fs');

/**
 * @param {string} text raw CSV file contents
 * @returns {string[][]} rows of raw string cells, including the header row at index 0
 */
function parseRows(text) {
  // Strip a UTF-8 BOM (U+FEFF) — Excel/Numbers commonly prepend one.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      const isBlankLine = row.length === 1 && row[0] === '';
      if (!isBlankLine) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Parses CSV text into an array of row objects keyed by the header row.
 * @param {string} text
 * @returns {Array<Record<string, string>>}
 */
function parseCsv(text) {
  const rows = parseRows(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

/**
 * Reads and parses a CSV file from disk (UTF-8).
 * @param {string} filePath
 * @returns {Array<Record<string, string>>}
 */
function readCsvFile(filePath) {
  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Splits a semicolon-separated list cell into trimmed, non-empty parts.
 * @param {string|undefined} value
 * @returns {string[]}
 */
function splitList(value) {
  return value ? value.split(';').map((s) => s.trim()).filter(Boolean) : [];
}

/**
 * Interprets common truthy spreadsheet values ("true", "1", "yes", "y" — case-insensitive).
 * @param {string|undefined} value
 * @returns {boolean}
 */
function truthy(value) {
  return ['true', '1', 'yes', 'y'].includes(String(value ?? '').toLowerCase());
}

/**
 * URL-safe, lowercase, hyphenated slug from arbitrary text (mirrors commerce-service's
 * own slug format requirement: /^[a-z0-9-]+$/).
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

module.exports = { parseRows, parseCsv, readCsvFile, splitList, truthy, slugify };
