/**
 * @file server/gckb/registries/inventory.ts
 * @description Inventory registry — the "Inventory" capability of product
 * management, expressed as GCKB registry configuration. A single `inventory_item`
 * entity models a stock position: the quantity of a product (or a specific
 * variant) held at a location, with reserved / incoming quantities and reorder
 * thresholds. Because it rides the GCKB engine it inherits versioning,
 * append-only history, faceted + temporal (`asOf`) search, CSV/JSON import with
 * dry-run + rollback, export, immutable audit, domain events and Row-Level-
 * Security tenant isolation — with **no new table, migration, service or route**.
 *
 * Scope boundary: this is the master **stock-position** record, not a movement
 * ledger. Each write is a versioned snapshot of on-hand / reserved / incoming
 * quantities (full history is preserved by `gckb_revisions`), so a stock change
 * is a new version — the same "metadata, not integration" boundary the rest of
 * the GCKB observes. Nothing is seeded; real stock is loaded via the import API.
 */
import { z } from 'zod';
import { KbWriteInput } from '../types';
import {
  KbEntityDefinition,
  RelationshipTypeDescriptor,
  simpleEntity,
  slug,
} from '../entity-kit';

/** Typed relationship edges emitted by inventory records (no magic strings). */
export const INVENTORY_RELATIONSHIP_TYPES = {
  /** inventory_item → product */
  STOCK_OF: 'STOCK_OF',
  /** inventory_item → product_variant */
  STOCK_OF_VARIANT: 'STOCK_OF_VARIANT',
  /** inventory_item → point_of_entry / location (held by toRef until present) */
  STORED_AT: 'STORED_AT',
  /** inventory_item → organization (the supplier replenishing this position) */
  SUPPLIED_BY: 'SUPPLIED_BY',
} as const;

export type InventoryRelationshipType =
  (typeof INVENTORY_RELATIONSHIP_TYPES)[keyof typeof INVENTORY_RELATIONSHIP_TYPES];

const inventoryItemSchema = z
  .object({
    // What is stocked — at least one identifier is required (see refine below).
    productKey: z.string().optional(),
    variantKey: z.string().optional(),
    sku: z.string().optional(),
    // Where it is stocked.
    locationCode: z.string().min(1), // warehouse / point-of-entry / facility code
    warehouseName: z.string().optional(),
    binLocation: z.string().optional(),
    // Quantities.
    quantityOnHand: z.number().nonnegative(),
    quantityReserved: z.number().nonnegative().optional(),
    quantityIncoming: z.number().nonnegative().optional(),
    quantityAvailable: z.number().optional(), // optional precomputed snapshot (onHand − reserved)
    // Replenishment policy.
    reorderPoint: z.number().nonnegative().optional(),
    reorderQuantity: z.number().positive().optional(),
    safetyStock: z.number().nonnegative().optional(),
    unitOfMeasure: z.string().optional(), // PCS | KG | L | CARTON | …
    // Lot / batch tracking.
    lotNumber: z.string().optional(),
    serialNumbers: z.array(z.string()).optional(),
    manufacturedDate: z.string().optional(),
    expiryDate: z.string().optional(),
    // Domain status, distinct from the record lifecycle status.
    stockStatus: z.string().optional(), // IN_STOCK | LOW_STOCK | OUT_OF_STOCK | BACKORDER | DISCONTINUED
  })
  .refine((d) => Boolean(d.productKey || d.variantKey || d.sku), {
    message: 'one of productKey, variantKey or sku is required',
    path: ['productKey'],
  });

/**
 * Natural key: the stocked item (variantKey › sku › productKey › code › slug)
 * pinned to its location, so the same SKU can be stocked in many warehouses and
 * each position is its own versioned record.
 */
function inventoryKey(i: KbWriteInput): string {
  const a = i.attributes ?? {};
  const item = a.variantKey ?? a.sku ?? a.productKey ?? i.code ?? slug(i.name);
  const loc = a.locationCode ?? 'DEFAULT';
  return `${String(item)}@${String(loc)}`.toUpperCase();
}

const inventoryRelationshipTypes: RelationshipTypeDescriptor[] = [
  { relationType: INVENTORY_RELATIONSHIP_TYPES.STOCK_OF, label: 'Stock of', toType: 'product' },
  { relationType: INVENTORY_RELATIONSHIP_TYPES.STOCK_OF_VARIANT, label: 'Stock of variant', toType: 'product_variant' },
  { relationType: INVENTORY_RELATIONSHIP_TYPES.STORED_AT, label: 'Stored at', toType: 'point_of_entry' },
  { relationType: INVENTORY_RELATIONSHIP_TYPES.SUPPLIED_BY, label: 'Supplied by', toType: 'organization' },
];

const inventoryFormFields: KbEntityDefinition['formFields'] = [
  { name: 'name', label: 'Stock position label', type: 'string', placement: 'top', required: true },
  { name: 'code', label: 'SKU / code', type: 'string', placement: 'top', description: 'Promoted, indexed identifier.' },
  { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
  { name: 'productKey', label: 'Product', type: 'string', placement: 'attributes' },
  { name: 'variantKey', label: 'Variant', type: 'string', placement: 'attributes' },
  { name: 'sku', label: 'SKU', type: 'string', placement: 'attributes' },
  { name: 'locationCode', label: 'Location code', type: 'string', placement: 'attributes', required: true },
  { name: 'warehouseName', label: 'Warehouse', type: 'string', placement: 'attributes' },
  { name: 'binLocation', label: 'Bin location', type: 'string', placement: 'attributes' },
  { name: 'quantityOnHand', label: 'Quantity on hand', type: 'number', placement: 'attributes', required: true },
  { name: 'quantityReserved', label: 'Quantity reserved', type: 'number', placement: 'attributes' },
  { name: 'quantityIncoming', label: 'Quantity incoming', type: 'number', placement: 'attributes' },
  { name: 'reorderPoint', label: 'Reorder point', type: 'number', placement: 'attributes' },
  { name: 'reorderQuantity', label: 'Reorder quantity', type: 'number', placement: 'attributes' },
  { name: 'safetyStock', label: 'Safety stock', type: 'number', placement: 'attributes' },
  { name: 'unitOfMeasure', label: 'Unit of measure', type: 'string', placement: 'attributes' },
  { name: 'lotNumber', label: 'Lot / batch number', type: 'string', placement: 'attributes' },
  { name: 'expiryDate', label: 'Expiry date', type: 'date', placement: 'attributes' },
  { name: 'stockStatus', label: 'Stock status', type: 'enum', placement: 'attributes', options: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'BACKORDER', 'DISCONTINUED'] },
];

export const inventoryEntities: KbEntityDefinition[] = [
  simpleEntity({
    entityType: 'inventory_item',
    label: 'Inventory Item',
    description: 'A versioned stock position: the on-hand / reserved / incoming quantity of a product or variant at a location, with reorder thresholds and lot/expiry tracking.',
    domain: 'inventory',
    countryScoped: false,
    schema: inventoryItemSchema,
    recordKey: inventoryKey,
    events: { created: 'INVENTORY_ITEM_CREATED', updated: 'INVENTORY_ITEM_UPDATED', archived: 'INVENTORY_ITEM_ARCHIVED' },
    formFields: inventoryFormFields,
    relationshipTypes: inventoryRelationshipTypes,
  }),
];
