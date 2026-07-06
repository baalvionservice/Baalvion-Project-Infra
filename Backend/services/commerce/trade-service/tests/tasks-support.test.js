'use strict';
const request = require('supertest');
const app = require('../index');
const { gatewayHeaders } = require('./helpers/gatewayAuth');

const demo = gatewayHeaders({ userId: 'u-demo', orgId: 'T-JEST-DEMO', roles: ['client'] });
const other = gatewayHeaders({ userId: 'u-other', orgId: 'T-JEST-OTHER', roles: ['client'] });
const admin = gatewayHeaders({ userId: 'u-admin', orgId: 'T-JEST-ADMIN', roles: ['admin'] });

describe('tasks (tenant isolation + lifecycle)', () => {
    let taskId;

    it('blocks anonymous reads (401)', async () => {
        const r = await request(app).get('/v1/tasks');
        expect(r.status).toBe(401);
    });

    it('creates a task under the caller tenant, stamping tenant_id server-side', async () => {
        const r = await request(app).post('/v1/tasks').set(demo)
            .send({ tenant_id: 'SPOOFED', title: 'Follow up with buyer', priority: 'high', assigned_to_user_id: 'u-demo' });
        expect(r.status).toBe(201);
        expect(r.body.data.tenant_id).toBe('T-JEST-DEMO');
        expect(r.body.data.status).toBe('open');
        taskId = r.body.data.id;
    });

    it('hides the task from another tenant (404)', async () => {
        const r = await request(app).get(`/v1/tasks/${taskId}`).set(other);
        expect(r.status).toBe(404);
    });

    it('does not leak it in another tenant list', async () => {
        const r = await request(app).get('/v1/tasks').set(other);
        expect(r.status).toBe(200);
        const leaked = (r.body.data.items || []).some((t) => String(t.id) === String(taskId));
        expect(leaked).toBe(false);
    });

    it('allows the owning tenant to read and complete it', async () => {
        const get = await request(app).get(`/v1/tasks/${taskId}`).set(demo);
        expect(get.status).toBe(200);

        const complete = await request(app).patch(`/v1/tasks/${taskId}/complete`).set(demo);
        expect(complete.status).toBe(200);
        expect(complete.body.data.status).toBe('completed');
        expect(complete.body.data.completed_at).toBeTruthy();
    });

    it('lets admin bypass tenant scoping', async () => {
        const r = await request(app).get(`/v1/tasks/${taskId}`).set(admin);
        expect(r.status).toBe(200);
    });

    afterAll(async () => {
        const db = require('../models');
        await db.Task.destroy({ where: { title: 'Follow up with buyer' } });
    });
});

describe('support tickets (tenant isolation + thread)', () => {
    let ticketId;

    it('blocks anonymous reads (401)', async () => {
        const r = await request(app).get('/v1/support_tickets');
        expect(r.status).toBe(401);
    });

    it('creates a ticket under the caller tenant, stamping tenant_id server-side', async () => {
        const r = await request(app).post('/v1/support_tickets').set(demo)
            .send({ tenant_id: 'SPOOFED', subject: 'Cannot download invoice', category: 'billing' });
        expect(r.status).toBe(201);
        expect(r.body.data.tenant_id).toBe('T-JEST-DEMO');
        expect(r.body.data.status).toBe('open');
        ticketId = r.body.data.id;
    });

    it('hides the ticket from another tenant (404)', async () => {
        const r = await request(app).get(`/v1/support_tickets/${ticketId}`).set(other);
        expect(r.status).toBe(404);
    });

    it('adds a threaded reply visible on the owning tenant read', async () => {
        const reply = await request(app).post(`/v1/support_tickets/${ticketId}/messages`).set(demo)
            .send({ body: 'Looking into this now.' });
        expect(reply.status).toBe(201);

        const get = await request(app).get(`/v1/support_tickets/${ticketId}`).set(demo);
        expect(get.status).toBe(200);
        expect(get.body.data.messages.some((m) => m.body === 'Looking into this now.')).toBe(true);
    });

    it('rejects replies to another tenant\'s ticket', async () => {
        const r = await request(app).post(`/v1/support_tickets/${ticketId}/messages`).set(other)
            .send({ body: 'should not be allowed' });
        expect(r.status).toBe(404);
    });

    it('updates status and stamps resolved_at on resolve', async () => {
        const r = await request(app).patch(`/v1/support_tickets/${ticketId}/status`).set(demo)
            .send({ status: 'resolved' });
        expect(r.status).toBe(200);
        expect(r.body.data.status).toBe('resolved');
        expect(r.body.data.resolved_at).toBeTruthy();
    });

    afterAll(async () => {
        const db = require('../models');
        await db.SupportTicket.destroy({ where: { subject: 'Cannot download invoice' } });
    });
});
