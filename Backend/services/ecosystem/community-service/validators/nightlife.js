'use strict';
const { z } = require('zod');
const { httpUrl, optionalHttpUrl } = require('./httpUrl');

const vipPackageSchema = z.object({
    name: z.string().trim().min(2).max(80),
    minimumSpend: z.string().trim().min(1).max(40),
    location: z.string().trim().max(120).optional(),
    capacity: z.string().trim().max(60).optional(),
    bottles: z.string().trim().max(60).optional(),
    perks: z.array(z.string().trim().min(1).max(80)).max(12).optional().default([]),
    popular: z.boolean().optional().default(false),
});

const clubFields = {
    contactEmail: z.string().trim().email().max(320).optional().or(z.literal('').transform(() => undefined)),
    vipPackages: z.array(vipPackageSchema).max(8).optional(),
    name: z.string().trim().min(2).max(160),
    state: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    suburb: z.string().trim().max(80).optional(),
    address: z.string().trim().max(300).optional(),
    image: httpUrl(600).optional(),
    musicTypes: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
    daysOpen: z.string().trim().max(80).optional(),
    description: z.string().trim().max(4000).optional(),
    coverCharge: z.string().trim().max(120).optional(),
    vibe: z.string().trim().max(160).optional(),
    requiredRoles: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    rating: z.number().min(0).max(5).optional(),
};

const createClubSchema = z.object(clubFields);
const updateClubSchema = z.object({ ...clubFields, status: z.enum(['active', 'archived']).optional() }).partial()
    .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const bookingBase = {
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, 'Invalid phone number'),
    visitDate: isoDate,
};

const guestListSchema = z.object({
    ...bookingBase,
    males: z.coerce.number().int().min(0).max(50),
    females: z.coerce.number().int().min(0).max(50),
}).refine((d) => d.males + d.females >= 1, { message: 'At least one guest is required' });

const vipTableSchema = z.object({
    ...bookingBase,
    groupSize: z.coerce.number().int().min(1).max(50),
    tablePackage: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
});

const bookingStatusSchema = z.object({ status: z.enum(['pending', 'confirmed', 'declined', 'cancelled']) });

const roleRequirementSchema = z.object({
    roleId: z.string().max(40),
    roleName: z.string().max(120),
    qty: z.number().int().min(1).max(500),
    gender: z.enum(['Male', 'Female', 'Any']),
    minAge: z.number().int().min(18).max(80).optional(),
    maxAge: z.number().int().min(18).max(80).optional(),
}).passthrough();

const listingFields = {
    title: z.string().trim().min(5).max(240),
    type: z.enum(['Casting & Jobs', 'Events', 'Matchmaking', 'Travel']),
    location: z.string().trim().min(2).max(160),
    city: z.string().trim().min(2).max(80),
    description: z.string().trim().min(10).max(8000),
    requirements: z.array(z.string().trim().min(1).max(400)).max(30).optional(),
    contact: z.string().trim().max(200).optional(),
    date: z.string().trim().max(80).optional(),
    salary: z.string().trim().max(120).optional(),
    postedBy: z.string().trim().min(2).max(160),
    verified: z.boolean().optional(),
    minAge: z.number().int().min(18).max(80).optional(),
    maxAge: z.number().int().min(18).max(80).optional(),
    gender: z.enum(['Male', 'Female', 'Any']).optional(),
    primaryCategory: z.string().trim().max(120).optional(),
    roleRequirements: z.array(roleRequirementSchema).max(60).optional(),
    seoKeywords: z.array(z.string().trim().max(80)).max(30).optional(),
};

const createListingSchema = z.object(listingFields);
const updateListingSchema = z.object({ ...listingFields, status: z.enum(['active', 'closed', 'archived']).optional() })
    .partial().refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

const applyListingSchema = z.object({
    fullName: z.string().trim().min(2).max(160),
    phone: z.string().trim().regex(/^[+0-9 ()-]{7,20}$/, 'Invalid phone number'),
    email: z.string().trim().email().max(320).optional(),
    message: z.string().trim().max(2000).optional(),
    details: z.object({
        age: z.coerce.number().int().min(18).max(80),
        gender: z.string().trim().max(20),
        country: z.string().trim().max(80),
        state: z.string().trim().max(80),
        city: z.string().trim().max(80),
        height: z.string().trim().max(20),
        instagram: z.string().trim().max(120),
        introVideoLink: optionalHttpUrl(500),
    }).partial().optional(),
});

const applicationStatusSchema = z.object({ status: z.enum(['pending', 'shortlisted', 'accepted', 'rejected']) });

const eventFields = {
    clubId: z.string().uuid(),
    eventName: z.string().trim().min(3).max(200),
    djName: z.string().trim().max(160).optional(),
    eventDate: isoDate,
    image: httpUrl(600).optional(),
    description: z.string().trim().max(4000).optional(),
    tag: z.enum(['FREE ON GUEST LIST', 'BUY TICKETS', 'VIP TABLE', 'SOLD OUT']),
    ticketUrl: httpUrl(600).optional(),
};
const createEventSchema = z.object(eventFields);
const updateEventSchema = z.object({ ...eventFields, status: z.enum(['active', 'cancelled']) }).partial()
    .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

module.exports = {
    createEventSchema, updateEventSchema,
    createClubSchema, updateClubSchema, guestListSchema, vipTableSchema, bookingStatusSchema,
    createListingSchema, updateListingSchema, applyListingSchema, applicationStatusSchema,
};
