const { z } = require('zod');

// Mineral Listing schemas
const createListingSchema = z.object({
    category_id: z.number().int().positive().optional(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    mineral_name: z.string().min(1).max(255),
    grade: z.string().max(100).optional(),
    purity: z.number().min(0).max(100).optional(),
    origin_country: z.string().max(100).optional(),
    quantity: z.number().positive(),
    unit: z.enum(['MT', 'KG', 'LB', 'OZ']).default('MT'),
    price_per_unit: z.number().positive(),
    currency: z.string().max(10).default('USD'),
    min_order_quantity: z.number().positive().optional(),
    certifications: z.array(z.string()).default([]),
    images: z.array(z.string().url()).default([]),
    documents: z.array(z.string().url()).default([]),
    shipping_terms: z.string().max(100).optional(),
    incoterms: z.string().max(50).optional(),
});

const updateListingSchema = z.object({
    category_id: z.number().int().positive().optional(),
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    mineral_name: z.string().min(1).max(255).optional(),
    grade: z.string().max(100).optional(),
    purity: z.number().min(0).max(100).optional(),
    origin_country: z.string().max(100).optional(),
    quantity: z.number().positive().optional(),
    unit: z.enum(['MT', 'KG', 'LB', 'OZ']).optional(),
    price_per_unit: z.number().positive().optional(),
    currency: z.string().max(10).optional(),
    min_order_quantity: z.number().positive().optional(),
    certifications: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    documents: z.array(z.string().url()).optional(),
    shipping_terms: z.string().max(100).optional(),
    incoterms: z.string().max(50).optional(),
});

// RFQ schemas
const createRfqSchema = z.object({
    listing_id: z.number().int().positive().optional(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    mineral_name: z.string().max(255).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().max(50).optional(),
    target_price: z.number().positive().optional(),
    currency: z.string().max(10).default('USD'),
    delivery_country: z.string().max(100).optional(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateRfqSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    mineral_name: z.string().max(255).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().max(50).optional(),
    target_price: z.number().positive().optional(),
    currency: z.string().max(10).optional(),
    delivery_country: z.string().max(100).optional(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.enum(['open', 'closed', 'awarded', 'cancelled']).optional(),
});

// Bid schemas
const createBidSchema = z.object({
    price_per_unit: z.number().positive(),
    currency: z.string().max(10).default('USD'),
    quantity: z.number().positive(),
    lead_time_days: z.number().int().positive().optional(),
    notes: z.string().optional(),
    valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateBidSchema = z.object({
    status: z.enum(['submitted', 'accepted', 'rejected', 'withdrawn']),
});

// Order schemas
const createOrderSchema = z.object({
    seller_id: z.number().int().positive(),
    listing_id: z.number().int().positive().optional(),
    bid_id: z.number().int().positive().optional(),
    quantity: z.number().positive(),
    unit: z.string().max(50).optional(),
    unit_price: z.number().positive(),
    currency: z.string().max(10).default('USD'),
    payment_method: z.string().max(50).optional(),
    shipping_address: z.record(z.any()).optional(),
    delivery_terms: z.string().max(100).optional(),
    notes: z.string().optional(),
}).refine(data => data.listing_id || data.bid_id, {
    message: 'Either listing_id or bid_id is required',
});

const updateOrderSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed']).optional(),
    payment_status: z.enum(['unpaid', 'partial', 'paid', 'refunded']).optional(),
    payment_method: z.string().max(50).optional(),
    shipping_address: z.record(z.any()).optional(),
    delivery_terms: z.string().max(100).optional(),
    notes: z.string().optional(),
});

// Logistics schemas
const createShipmentSchema = z.object({
    order_id: z.number().int().positive(),
    carrier_name: z.string().max(255).optional(),
    tracking_number: z.string().max(255).optional(),
    transport_mode: z.enum(['sea', 'air', 'rail', 'truck', 'multimodal']).default('sea'),
    origin_country: z.string().max(100).optional(),
    destination_country: z.string().max(100).optional(),
    origin_port: z.string().max(255).optional(),
    destination_port: z.string().max(255).optional(),
    estimated_departure: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    estimated_arrival: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    weight_kg: z.number().positive().optional(),
    volume_cbm: z.number().positive().optional(),
    freight_cost: z.number().positive().optional(),
    currency: z.string().max(10).default('USD'),
});

const updateShipmentSchema = z.object({
    carrier_name: z.string().max(255).optional(),
    tracking_number: z.string().max(255).optional(),
    transport_mode: z.enum(['sea', 'air', 'rail', 'truck', 'multimodal']).optional(),
    status: z.enum(['pending', 'booked', 'in_transit', 'customs', 'delivered']).optional(),
    actual_departure: z.string().datetime().optional(),
    actual_arrival: z.string().datetime().optional(),
    weight_kg: z.number().positive().optional(),
    volume_cbm: z.number().positive().optional(),
    freight_cost: z.number().positive().optional(),
});

const addCheckpointSchema = z.object({
    location: z.string().min(1),
    status: z.string().min(1),
    timestamp: z.string().datetime().optional(),
    notes: z.string().optional(),
});

// Dispute schemas
const createDisputeSchema = z.object({
    order_id: z.number().int().positive(),
    type: z.enum(['quality', 'quantity', 'delivery', 'payment', 'fraud']).optional(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    evidence_urls: z.array(z.string().url()).default([]),
});

const updateDisputeSchema = z.object({
    status: z.enum(['open', 'under_review', 'resolved', 'escalated', 'closed']).optional(),
    resolution: z.string().optional(),
});

// Warehouse schemas
const createWarehouseSchema = z.object({
    name: z.string().min(1).max(255),
    country: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    address: z.string().optional(),
    capacity_mt: z.number().positive().optional(),
    manager_id: z.number().int().positive().optional(),
    certifications: z.array(z.string()).default([]),
});

const updateWarehouseSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    country: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    address: z.string().optional(),
    capacity_mt: z.number().positive().optional(),
    current_stock_mt: z.number().min(0).optional(),
    manager_id: z.number().int().positive().optional(),
    status: z.enum(['active', 'inactive', 'maintenance']).optional(),
    certifications: z.array(z.string()).optional(),
});

// Pagination
const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
    createListingSchema,
    updateListingSchema,
    createRfqSchema,
    updateRfqSchema,
    createBidSchema,
    updateBidSchema,
    createOrderSchema,
    updateOrderSchema,
    createShipmentSchema,
    updateShipmentSchema,
    addCheckpointSchema,
    createDisputeSchema,
    updateDisputeSchema,
    createWarehouseSchema,
    updateWarehouseSchema,
    paginationSchema,
};
