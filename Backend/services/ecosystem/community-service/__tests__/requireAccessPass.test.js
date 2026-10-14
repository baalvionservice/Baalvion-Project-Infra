'use strict';
// appConfig insists on JWT_PUBLIC_KEY at load time, which CI does not set; this test only needs the pass settings.
jest.mock('../config/appConfig', () => ({ accessPass: { enforce: true, priceUsd: 50 } }));
jest.mock('../models', () => ({ sequelize: { query: jest.fn() } }));
const { sequelize } = require('../models');
const config = require('../config/appConfig');
const { clearCache } = require('../service/accessPass');
const { requireAccessPass } = require('../middleware/requireAccessPass');

const run = async (req) => { let out; await requireAccessPass(req, {}, (e) => { out = e || 'ok'; }); return out; };

describe('requireAccessPass', () => {
    beforeEach(() => { sequelize.query.mockReset(); clearCache(); config.accessPass.enforce = true; });

    it('rejects a signed-out caller with 401', async () => {
        const err = await run({});
        expect(err.statusCode).toBe(401);
        expect(sequelize.query).not.toHaveBeenCalled();
    });

    it('rejects a signed-in caller with no pass with 402 and the price', async () => {
        sequelize.query.mockResolvedValue([]);
        const err = await run({ auth: { userId: 'u1', roles: ['user'] } });
        expect(err.statusCode).toBe(402);
        expect(err.code).toBe('ACCESS_PASS_REQUIRED');
        expect(err.details.priceUsd).toBe(config.accessPass.priceUsd);
    });

    it('lets a holder of an active pass through', async () => {
        sequelize.query.mockResolvedValue([{ '?column?': 1 }]);
        expect(await run({ auth: { userId: 'u2', roles: ['user'] } })).toBe('ok');
    });

    it('lets platform admins through without a database lookup', async () => {
        expect(await run({ auth: { userId: 'a1', roles: ['super_admin'] } })).toBe('ok');
        expect(sequelize.query).not.toHaveBeenCalled();
    });

    it('does nothing when enforcement is switched off', async () => {
        config.accessPass.enforce = false;
        expect(await run({})).toBe('ok');
    });
});
