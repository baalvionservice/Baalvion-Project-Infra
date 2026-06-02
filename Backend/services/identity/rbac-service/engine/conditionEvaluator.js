'use strict';
/**
 * ABAC condition evaluator — a small, safe, dependency-free expression engine.
 *
 * A condition is a JSON AST (stored in policies.condition / role_permissions.constraints)
 * evaluated against an attribute CONTEXT shaped like:
 *
 *   {
 *     subject:  { id, roles, level, orgId, ...attributes },
 *     resource: { type, id, ...attributes },
 *     action:   'publish',
 *     env:      { ip, time, hour, mfa, ... },
 *     tenant:   { id, type, ...attributes },
 *   }
 *
 * Grammar (each node is an object with exactly one operator key):
 *   Logical : {"and":[..]} {"or":[..]} {"not": node}
 *   Compare : {"==":[a,b]} {"!=":[a,b]} {">":[a,b]} {">=":[a,b]} {"<":[a,b]} {"<=":[a,b]}
 *   Sets    : {"in":[a,b]} {"nin":[a,b]} {"contains":[a,b]}
 *   String  : {"startsWith":[a,b]} {"endsWith":[a,b]} {"regex":[a,pattern]}
 *   Presence: {"exists": a} {"empty": a}
 *   Value   : {"var":"subject.orgId"}  or  {"var":["subject.orgId","fallback"]}
 *   Literals: numbers / strings / booleans / null / arrays (resolved element-wise)
 *
 * An empty/absent condition ({} or null) evaluates to TRUE (unconditional).
 * Evaluation is pure and side-effect free; unknown operators throw ConditionError.
 */

const MAX_DEPTH = 32;

class ConditionError extends Error {
    constructor(message) { super(message); this.name = 'ConditionError'; }
}

/** Resolve a dotted attribute path ("subject.orgId") from the context. */
function getPath(ctx, path) {
    if (typeof path !== 'string' || path === '') return undefined;
    return path.split('.').reduce((acc, key) => {
        if (acc == null) return undefined;
        return acc[key];
    }, ctx);
}

const isOperatorNode = (n) => n && typeof n === 'object' && !Array.isArray(n) && Object.keys(n).length === 1;

/** Resolve an operand node to a concrete VALUE (vars, nested expressions, arrays, literals). */
function resolveValue(node, ctx, depth) {
    if (depth > MAX_DEPTH) throw new ConditionError('Condition nesting too deep');
    if (Array.isArray(node)) return node.map((el) => resolveValue(el, ctx, depth + 1));
    if (isOperatorNode(node)) {
        const op = Object.keys(node)[0];
        if (op === 'var') {
            const arg = node.var;
            if (Array.isArray(arg)) {
                const [path, fallback] = arg;
                const v = getPath(ctx, path);
                return v === undefined ? (fallback ?? null) : v;
            }
            const v = getPath(ctx, arg);
            return v === undefined ? null : v;
        }
        // Nested boolean expression used where a value is expected → coerce to bool.
        return evaluate(node, ctx, depth + 1);
    }
    return node; // literal (string/number/boolean/null)
}

const num = (v) => (typeof v === 'number' ? v : Number(v));

function compare(op, a, b) {
    switch (op) {
        case '==':  return a === b || (a != null && b != null && String(a) === String(b) && typeof a !== 'object');
        case '!=':  return !compare('==', a, b);
        case '>':   return num(a) > num(b);
        case '>=':  return num(a) >= num(b);
        case '<':   return num(a) < num(b);
        case '<=':  return num(a) <= num(b);
        case 'in':  return Array.isArray(b) ? b.includes(a) : (typeof b === 'string' ? b.includes(String(a)) : false);
        case 'nin': return !compare('in', a, b);
        case 'contains':
            if (Array.isArray(a)) return a.includes(b);
            if (typeof a === 'string') return a.includes(String(b));
            return false;
        case 'startsWith': return typeof a === 'string' && a.startsWith(String(b));
        case 'endsWith':   return typeof a === 'string' && a.endsWith(String(b));
        case 'regex':
            try { return new RegExp(String(b)).test(String(a)); } catch { return false; }
        default: throw new ConditionError(`Unknown comparison operator: ${op}`);
    }
}

/** Evaluate a condition node to a boolean. */
function evaluate(node, ctx, depth = 0) {
    if (depth > MAX_DEPTH) throw new ConditionError('Condition nesting too deep');
    // Unconditional cases.
    if (node == null) return true;
    if (typeof node === 'boolean') return node;
    if (!isOperatorNode(node)) {
        if (node && typeof node === 'object' && Object.keys(node).length === 0) return true; // {}
        throw new ConditionError('Malformed condition node');
    }

    const op = Object.keys(node)[0];
    const arg = node[op];

    switch (op) {
        case 'and': return (arg || []).every((c) => evaluate(c, ctx, depth + 1));
        case 'or':  return (arg || []).some((c) => evaluate(c, ctx, depth + 1));
        case 'not': return !evaluate(arg, ctx, depth + 1);
        case 'exists': {
            const v = resolveValue(arg, ctx, depth + 1);
            return v !== null && v !== undefined && v !== '';
        }
        case 'empty': {
            const v = resolveValue(arg, ctx, depth + 1);
            return v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
        }
        case 'var': return Boolean(resolveValue(node, ctx, depth + 1));
        case '==': case '!=': case '>': case '>=': case '<': case '<=':
        case 'in': case 'nin': case 'contains': case 'startsWith': case 'endsWith': case 'regex': {
            if (!Array.isArray(arg) || arg.length !== 2) {
                throw new ConditionError(`Operator '${op}' expects [a, b]`);
            }
            const a = resolveValue(arg[0], ctx, depth + 1);
            const b = resolveValue(arg[1], ctx, depth + 1);
            return compare(op, a, b);
        }
        default: throw new ConditionError(`Unknown operator: ${op}`);
    }
}

/** True if the condition holds. A condition that throws is treated as NON-matching. */
function matches(condition, ctx) {
    try { return evaluate(condition, ctx, 0); }
    catch { return false; }
}

module.exports = { evaluate, matches, getPath, ConditionError };
