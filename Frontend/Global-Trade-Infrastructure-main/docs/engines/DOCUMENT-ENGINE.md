# Universal Document Engine — Phase 1 (Module 5)

> **Status:** ✅ Implemented & tested (template registry + pure render engine;
> engine + registry tests green; full suite on real PostgreSQL). Admin UI
> delivered by the shared registry-driven console.
> **Principle:** *Configuration over code.* A document **type** is a template
> record — no document type is hardcoded. The renderer is pure and
> dependency-free (no `eval`, no template-injection surface). Nothing is seeded.

The Universal Document Engine turns a **template** (configuration: variables +
sections + validation + signature/QR scheme + localization + output formats) and
a **data context** into a rendered document (JSON / XML / HTML / PDF). It covers
Commercial Invoice, Packing List, Certificate of Origin, Inspection / Insurance
Certificate, Bill of Lading, Air Waybill, Purchase / Sales Order, Quotation, RFQ,
Contract and any custom type — all as templates.

---

## 1. Architecture

| Layer | File | Responsibility |
|------|------|----------------|
| Template model | `src/server/documents/template-types.ts` | Zod schemas + types for variables, sections, validation, signature, QR, labels. |
| Render engine | `src/server/documents/template-engine.ts` | Pure `validateDocumentData` + `renderDocument` (JSON/XML/HTML/PDF). |
| Template registry | `src/server/gckb/registries/document.ts` | The `document_template` GCKB entity (versioning, history, search, import, RLS). |
| Instance storage (reused) | `src/server/documents/document-service.ts` | Attach rendered output to a trade (existing `documents` table). |

The template **registry** rides the GCKB engine (no new migration). The **engine**
is a standalone pure module — identical inputs always produce identical output, so
it is fully unit-testable without a database. There is **no PDF binary library**:
`PDF` is emitted as print-ready HTML to hand to any HTML→PDF renderer downstream.

### Why the renderer is safe

Variable resolution is a single pass of `{{ path }}` interpolation over the data
context with a dotted-path resolver and HTML/XML escaping. There is **no `eval`,
`new Function`, or re-interpolation of resolved values** — a value of
`{{constructor}}` is emitted as the literal string, never executed.

---

## 2. Template model

```
DocumentTemplate {
  documentType            COMMERCIAL_INVOICE | PACKING_LIST | CERTIFICATE_OF_ORIGIN | …
  locales[] defaultLocale outputFormats[]   // PDF | HTML | JSON | XML
  variables[]   { name, type(string|number|boolean|date|array|object), required, default }
  sections[]    { id, type(text|fields|table|signature|qr), title, content?, fields?, repeatOver?, columns? }
  validations[] { field, rule(required|min|max|regex|in|nonEmpty), value, message }
  signature?    { required, standard, signatories[] }     // metadata only
  qr?           { enabled, contentTemplate, urlTemplate }  // metadata only
  labels        { [locale]: { [key]: localizedString } }   // localization
}
```

- **Variables** — typed, optionally required, validated before render.
- **Sections** — `text` (interpolated), `fields` (label/value pairs), `table`
  (`repeatOver` an array variable, `columns` interpolated per `row`), `signature`,
  `qr`.
- **Validation** — declared rules beyond required-variable checks.
- **Signature / QR** — metadata only (no signing/crypto in Phase 1).
- **Localization** — section titles and field labels resolve through
  `labels[locale]`.

Natural key: `DOCUMENTTYPE:CODE` (e.g. `COMMERCIAL_INVOICE:STD`).

---

## 3. Rendering

`renderDocument(template, data, { format, locale, hash })` → string:

| Format | Output |
|--------|--------|
| `JSON` | a structured, resolved document model (`{ documentType, locale, sections[] }`) |
| `XML`  | deterministic XML serialization of that model |
| `HTML` | semantic HTML (tables for fields/line-items, signature blocks, QR placeholders) |
| `PDF`  | print-ready HTML (`@page` stylesheet) — pass to any HTML→PDF renderer |

`validateDocumentData(template, data)` → `{ ok, errors[] }` runs first.

---

## 4. Relationships (`DOCUMENT_RELATIONSHIP_TYPES`)

```
RENDERS_CERTIFICATE  document_template → certificate_type (Module 3)
VALIDATED_BY_RULE    document_template → rule (Rule Engine)
ISSUED_VIA_WORKFLOW  document_template → workflow (Module 6)
VARIANT_OF           document_template → document_template (localized/derived variant)
```

Certificate types reference templates via `USES_DOCUMENT_TEMPLATE`; country
policies via `SUPPORTED_BY_DOCUMENT`.

---

## 5. API

The `document_template` entity is served by the generic registry routes:

| Method & path | Purpose |
|---------------|---------|
| `GET /api/gckb/document_template?keyword=&page=` | Search templates |
| `POST /api/gckb/document_template` | Create a template |
| `GET /api/gckb/document_template/{id}` · `/history` · `/versions` · `/relationships` | Read / history / edges |
| `POST …/validate` · `…/import` · `GET …/export` | Validate / import / export |

Rendering is performed in-process via `renderDocument(...)` (and output attached
to a trade through the existing `documentService.addDocument`), not via a public
HTTP route in this slice.

### OpenAPI (fragment)

```yaml
openapi: 3.0.3
info: { title: Universal Document Engine, version: "1.0" }
paths:
  /api/gckb/document_template:
    post:
      summary: Create a document template
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [name, attributes]
              properties:
                name: { type: string }
                code: { type: string }
                attributes:
                  type: object
                  required: [documentType]
                  properties:
                    documentType: { type: string }
                    locales: { type: array, items: { type: string } }
                    outputFormats: { type: array, items: { type: string, enum: [PDF, HTML, JSON, XML] } }
                    variables: { type: array, items: { type: object } }
                    sections: { type: array, items: { type: object } }
                    validations: { type: array, items: { type: object } }
                    signature: { type: object }
                    qr: { type: object }
                    labels: { type: object }
      responses: { "201": { description: Created } }
```

---

## 6. Data dictionary

`gckb_records` for `document_template`: `entityType` (`document_template`),
`recordKey` (`DOCTYPE:CODE`), `name`, `attributes` (the full template), `version`,
`status`, `organizationId`. Rendered instances use the existing `documents` table
(`tradeTransactionId`, `kind`, `version`, `url`, `hash`, `status`).

---

## 7. Events

`DOCUMENT_TEMPLATE_CREATED/UPDATED/ARCHIVED` (templates, via the GCKB engine);
`document.added` (rendered instances, via the existing document service).

---

## 8. Testing

```bash
npx vitest run src/server/documents/__tests__/template-engine.test.ts \
               src/server/gckb/__tests__/document-registry.test.ts \
               src/server/gckb/__tests__/document-template.integration.test.ts
```

- `template-engine.test.ts` — validation (required/type/rules), interpolation,
  line-item tables, localization (en/fr), JSON/XML/HTML/PDF rendering, determinism,
  and the no-`eval` safety guarantee.
- `document-registry.test.ts` — registration, key, template-schema validation, events.
- `document-template.integration.test.ts` (real PostgreSQL) — a template round-trips
  through the GCKB engine, versions, and renders from the stored definition.

---

## 9. Scope boundary

**In this module:** the template model, the pure render engine (JSON/XML/HTML/PDF),
the `document_template` registry entity, relationships, and tests; this doc.

**Reused, not duplicated:** rendered output attaches to trades via the existing
`documentService` / `documents` table.

**Deliberately not here:** no PDF binary library (PDF = print-ready HTML); no real
signing / cryptographic QR (metadata only); no seeded templates.
