'use strict';
/**
 * Fixed-width record composition (Customs Connectors).
 *
 * The US ABI channel does not speak XML or JSON. It speaks CATAIR: fixed-length
 * records where every field is identified by its column position, and a field
 * one character out of place shifts everything after it. This module is the
 * engine for that — padding, justification, implied decimals, record assembly
 * and, most importantly, the checks that make a malformed record impossible to
 * emit rather than merely unlikely.
 *
 * THE RULE THAT MATTERS: a numeric field that does not fit THROWS. Alphabetic
 * overflow is truncated because a shortened description is a cosmetic loss, but
 * a truncated customs value is an understated declaration — which is a false
 * statement to a customs authority, not a formatting bug. Silently trimming a
 * digit off a number is the one thing this module must never do.
 *
 * Layouts are declared as data (`{ name, recordLength, fields }`) so a CATAIR
 * chapter revision is a table edit. `validateLayout()` refuses overlapping or
 * out-of-bounds fields at load time, which catches a mistranscribed column
 * position before it becomes a rejected transmission.
 */

class FixedWidthError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'FixedWidthError';
        this.details = details;
    }
}

const TYPE = Object.freeze({
    A: 'A',     // alphabetic — left justified, space padded, upper-cased
    AN: 'AN',   // alphanumeric — left justified, space padded, upper-cased
    N: 'N',     // numeric — right justified, zero padded
    D8: 'D8',   // date YYYYMMDD
    D6: 'D6',   // date MMDDYY
});

/**
 * Refuse a layout whose fields overlap or run past the record.
 *
 * A mistranscribed column position is the classic CATAIR integration failure and
 * it is completely detectable here, before anything is transmitted.
 */
function validateLayout(layout) {
    const { name, recordLength, fields } = layout;
    if (!recordLength || recordLength < 1) throw new FixedWidthError(`layout '${name}' has no recordLength`);

    const occupied = new Array(recordLength + 1).fill(null);
    for (const f of fields) {
        if (!f.name) throw new FixedWidthError(`layout '${name}' has an unnamed field`);
        if (f.start < 1) throw new FixedWidthError(`layout '${name}' field '${f.name}' starts before column 1`);
        const end = f.start + f.length - 1;
        if (end > recordLength) {
            throw new FixedWidthError(
                `layout '${name}' field '${f.name}' runs to column ${end}, past the ${recordLength}-column record`,
            );
        }
        for (let col = f.start; col <= end; col += 1) {
            if (occupied[col]) {
                throw new FixedWidthError(
                    `layout '${name}' field '${f.name}' overlaps '${occupied[col]}' at column ${col}`,
                );
            }
            occupied[col] = f.name;
        }
    }
    return true;
}

const pad = (s, len, char, right) => (right
    ? String(s).padEnd(len, char)
    : String(s).padStart(len, char));

function formatDate(value, type) {
    if (value === null || value === undefined || value === '') return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) throw new FixedWidthError(`'${value}' is not a valid date`);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return type === TYPE.D6 ? `${mm}${dd}${String(yyyy % 100).padStart(2, '0')}` : `${yyyy}${mm}${dd}`;
}

/** Render one field to exactly `length` characters. */
function renderField(field, rawValue) {
    const { name, length, type = TYPE.AN, decimals = 0, required = false, truncate = true } = field;
    let value = rawValue === undefined ? field.value : rawValue;

    if (value === null || value === undefined || value === '') {
        if (required) throw new FixedWidthError(`field '${name}' is required but empty`, { field: name });
        // An absent field is spaces for text and zeros for numbers — never a
        // partially-filled field, which would misalign everything after it.
        return pad('', length, type === TYPE.N ? '0' : ' ', type !== TYPE.N);
    }

    if (type === TYPE.D8 || type === TYPE.D6) {
        const formatted = formatDate(value, type);
        if (formatted.length !== length) {
            throw new FixedWidthError(`field '${name}' expects a ${length}-character date, got ${formatted.length}`, { field: name });
        }
        return formatted;
    }

    if (type === TYPE.N) {
        const n = Number(value);
        if (!Number.isFinite(n)) throw new FixedWidthError(`field '${name}' must be numeric, got '${value}'`, { field: name });
        if (n < 0) throw new FixedWidthError(`field '${name}' cannot be negative`, { field: name, value: n });
        // Implied decimals: 1234.56 with decimals:2 becomes 123456.
        const scaled = decimals > 0 ? Math.round(n * 10 ** decimals) : Math.round(n);
        const digits = String(scaled);
        if (digits.length > length) {
            // Never truncate a number. See the module header.
            throw new FixedWidthError(
                `field '${name}' value ${value} needs ${digits.length} digits but the field is ${length} wide — `
                + 'truncating would understate the declaration',
                { field: name, value, required_width: digits.length, available: length },
            );
        }
        return pad(digits, length, '0', false);
    }

    let text = String(value).toUpperCase();
    if (type === TYPE.A) text = text.replace(/[^A-Z ]/g, '');
    if (text.length > length) {
        if (!truncate) {
            throw new FixedWidthError(`field '${name}' is ${text.length} characters but the field is ${length} wide`, { field: name });
        }
        text = text.slice(0, length);
    }
    return pad(text, length, ' ', true);
}

/**
 * Compose one record from a layout and a value bag.
 * @returns {string} exactly `recordLength` characters
 */
function composeRecord(layout, values = {}) {
    validateLayout(layout);
    const buffer = new Array(layout.recordLength).fill(' ');

    for (const field of layout.fields) {
        const rendered = renderField(field, values[field.name]);
        for (let k = 0; k < field.length; k += 1) {
            buffer[field.start - 1 + k] = rendered[k];
        }
    }

    const record = buffer.join('');
    if (record.length !== layout.recordLength) {
        throw new FixedWidthError(`composed record is ${record.length} characters, expected ${layout.recordLength}`);
    }
    return record;
}

/** Compose a multi-record message. Records are newline-separated. */
function composeMessage(records) {
    return records
        .map(({ layout, values }) => composeRecord(layout, values))
        .join('\n');
}

/**
 * Read a fixed-width record back into a value bag — used to parse response
 * messages, which arrive in the same format.
 */
function parseRecord(layout, record) {
    const out = {};
    for (const field of layout.fields) {
        const slice = record.slice(field.start - 1, field.start - 1 + field.length);
        if (field.type === TYPE.N) {
            const digits = slice.replace(/\D/g, '');
            const n = digits === '' ? null : Number(digits);
            out[field.name] = n === null ? null : (field.decimals ? n / 10 ** field.decimals : n);
        } else {
            const trimmed = slice.trim();
            out[field.name] = trimmed === '' ? null : trimmed;
        }
    }
    return out;
}

/** Split a received message into records and identify each by its identifier field. */
function parseMessage(lines, layoutsByRecordId, { recordIdField = 'recordId' } = {}) {
    const records = String(lines).split(/\r?\n/).filter((l) => l.trim() !== '');
    return records.map((record) => {
        // The record identifier is conventionally the first field, so it can be
        // read before the layout is known.
        const id = record.slice(0, 2).trim();
        const layout = layoutsByRecordId[id];
        if (!layout) return { record_id: id, unparsed: record };
        return { record_id: id, layout: layout.name, ...parseRecord(layout, record), [recordIdField]: id };
    });
}

module.exports = {
    TYPE,
    FixedWidthError,
    validateLayout,
    renderField,
    composeRecord,
    composeMessage,
    parseRecord,
    parseMessage,
    formatDate,
};
