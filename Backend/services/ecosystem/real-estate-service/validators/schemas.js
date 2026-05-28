const { z } = require('zod');

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createPropertySchema = z.object({
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    property_type: z.enum(['residential', 'commercial', 'land', 'industrial', 'luxury']).default('residential'),
    listing_type: z.enum(['sale', 'rent', 'lease']).default('sale'),
    price: z.number().positive(),
    currency: z.string().length(3).default('INR'),
    negotiable: z.boolean().default(true),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    area_sqft: z.number().positive().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    floors: z.number().int().min(0).optional(),
    parking_spaces: z.number().int().min(0).default(0),
    year_built: z.number().int().min(1800).max(2100).optional(),
    amenities: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    images: z.array(z.object({ url: z.string().url(), caption: z.string().optional() })).default([]),
    virtual_tour_url: z.string().url().optional(),
    agent_id: z.coerce.number().int().positive().optional(),
});

const updatePropertySchema = createPropertySchema.partial();

const addImagesSchema = z.object({
    images: z.array(z.object({ url: z.string().url(), caption: z.string().optional() })).min(1),
});

const addDocumentSchema = z.object({
    document_type: z.string().max(100).optional(),
    name: z.string().min(1).max(255),
    url: z.string().url(),
    size_bytes: z.number().int().positive().optional(),
    is_public: z.boolean().default(false),
});

const createAgentSchema = z.object({
    full_name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    avatar_url: z.string().url().optional(),
    license_number: z.string().max(100).optional(),
    specialization: z.string().max(100).optional(),
    experience_years: z.number().int().min(0).default(0),
    bio: z.string().optional(),
});

const updateAgentSchema = createAgentSchema.partial();

const createViewingSchema = z.object({
    property_id: z.coerce.number().int().positive(),
    scheduled_at: z.string().datetime(),
    duration_minutes: z.number().int().min(15).default(60),
    type: z.enum(['in_person', 'virtual']).default('in_person'),
    notes: z.string().optional(),
    agent_id: z.coerce.number().int().positive().optional(),
});

const updateViewingSchema = z.object({
    status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']).optional(),
    feedback: z.string().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    notes: z.string().optional(),
});

const createInquirySchema = z.object({
    property_id: z.coerce.number().int().positive(),
    name: z.string().min(1).max(255),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    message: z.string().min(1),
    inquiry_type: z.enum(['general', 'price', 'viewing', 'details']).default('general'),
});

const updateInquirySchema = z.object({
    status: z.enum(['read', 'responded', 'closed']).optional(),
    response: z.string().optional(),
});

module.exports = {
    paginationSchema,
    createPropertySchema,
    updatePropertySchema,
    addImagesSchema,
    addDocumentSchema,
    createAgentSchema,
    updateAgentSchema,
    createViewingSchema,
    updateViewingSchema,
    createInquirySchema,
    updateInquirySchema,
};
