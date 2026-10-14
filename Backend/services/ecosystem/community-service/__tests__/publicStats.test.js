'use strict';
jest.mock('../models', () => ({
    sequelize: { query: jest.fn() },
    NightClub: { count: jest.fn().mockResolvedValue(3) },
    LocalListing: { count: jest.fn().mockResolvedValue(2) },
    ClubEvent: { count: jest.fn().mockResolvedValue(1) },
}));
const db = require('../models');
const { publicStats } = require('../service/nightlifeService');

describe('publicStats people counts', () => {
    it('reports real head counts alongside the club numbers', async () => {
        db.sequelize.query.mockResolvedValue([[{ n: 7 }]]);
        const s = await publicStats();
        expect(s).toMatchObject({ clubs: 3, openListings: 2, upcomingEvents: 1, members: 7, sellers: 7, passHolders: 7, staff: 7 });
    });

    it('returns null for a count it cannot read instead of inventing one', async () => {
        db.sequelize.query.mockImplementation(async (sql) => {
            if (sql.includes('staff_members')) throw new Error('no access');
            return [[{ n: 4 }]];
        });
        const s = await publicStats();
        expect(s.staff).toBeNull();
        expect(s.members).toBe(4);
    });
});
