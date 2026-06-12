'use strict';
const { screen } = require('./sanctionsClient');

describe('sanctionsClient provider routing', () => {
    test('routes to the OpenSanctions adapter when provider=opensanctions', async () => {
        const adapter = {
            screen: jest.fn(async () => ({ status: 'CONFIRMED_MATCH', confidence: 0.92, matches: [{ listName: 'OFAC-SDN' }] })),
        };
        const out = await screen({ name: 'Acme Trading', country: 'IR', tenantId: 't1' }, { provider: 'opensanctions', adapter });
        expect(adapter.screen).toHaveBeenCalledWith({ name: 'Acme Trading', country: 'IR', tenantId: 't1' });
        expect(out.status).toBe('CONFIRMED_MATCH');
        expect(out.matches[0].listName).toBe('OFAC-SDN');
    });

    test('an unavailable OpenSanctions engine THROWS (fail-closed, never CLEAR)', async () => {
        const adapter = { screen: jest.fn(async () => { throw new Error('yente unreachable'); }) };
        await expect(screen({ name: 'X' }, { provider: 'opensanctions', adapter })).rejects.toThrow('yente unreachable');
    });

    test('DEFAULT risk-service path POSTs name/country to /api/v1/sanctions/screen', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'CLEAR', confidence: 0, matches: [] }),
        });
        try {
            const out = await screen(
                { name: 'Acme Trading', country: 'IN' },
                { provider: 'risk-service', url: 'http://risk.test' },
            );
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
            expect(calledUrl).toBe('http://risk.test/api/v1/sanctions/screen');
            expect(calledInit.method).toBe('POST');
            expect(JSON.parse(calledInit.body)).toEqual({ name: 'Acme Trading', country: 'IN' });
            expect(out.status).toBe('CLEAR');
        } finally {
            fetchSpy.mockRestore();
        }
    });
});
