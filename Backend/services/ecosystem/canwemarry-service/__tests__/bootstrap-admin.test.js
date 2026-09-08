'use strict';
/**
 * The operator bootstrap.
 *
 * A fresh deployment has no administrator, and every role grant requires one — so without
 * this the admin panel and the moderation queue are both unreachable forever. The grant is
 * matched on the JWT subject because that is the only identifier an operator can know before
 * the account exists in this service at all.
 *
 * The regression these tests exist for: the grant used to live inside the "this account has
 * no roles yet" branch, so it only ever fired on an account's very first request. An operator
 * following the only workable order — register, look up your own subject, set the variable,
 * restart — was already past it, stayed a plain USER, and got no error saying why.
 */
const mockUserRole = { count: jest.fn(), create: jest.fn(), findOrCreate: jest.fn() };
const mockUser = { findOrCreate: jest.fn(), findByPk: jest.fn() };
const mockConfig = { security: { bootstrapAdminUserId: '' } };

jest.mock('../models', () => ({ User: mockUser, UserRole: mockUserRole }));
jest.mock('../config/appConfig', () => mockConfig);

const userService = require('../service/userService');
const { ROLES } = require('../domain/roles');

const LOCAL_ID = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.security.bootstrapAdminUserId = '';
    mockUser.findOrCreate.mockResolvedValue([{ id: LOCAL_ID }, true]);
    mockUserRole.findOrCreate.mockResolvedValue([{ role: ROLES.ADMIN }, true]);
});

/** Roles the call actually wrote, from both the baseline and the bootstrap paths. */
const granted = () => [
    ...mockUserRole.create.mock.calls.map((c) => c[0].role),
    ...mockUserRole.findOrCreate.mock.calls.map((c) => c[0].where.role),
];

describe('with no bootstrap subject configured', () => {
    test('a new account gets USER and nothing else', async () => {
        mockUserRole.count.mockResolvedValue(0);
        await userService.provision('42');
        expect(granted()).toEqual([ROLES.USER]);
    });

    test('an existing account gets no further grant', async () => {
        mockUserRole.count.mockResolvedValue(1);
        await userService.provision('42');
        expect(granted()).toEqual([]);
    });
});

describe('with a bootstrap subject configured', () => {
    test('the matching subject is made an administrator on first sight', async () => {
        mockConfig.security.bootstrapAdminUserId = '42';
        mockUserRole.count.mockResolvedValue(0);
        await userService.provision('42');
        expect(granted()).toEqual([ROLES.USER, ROLES.ADMIN]);
    });

    test('the grant still applies to an account that already existed', async () => {
        // The regression. This account registered before the variable was set, so it already
        // holds USER — and used to be skipped entirely.
        mockConfig.security.bootstrapAdminUserId = '42';
        mockUserRole.count.mockResolvedValue(1);
        await userService.provision('42');
        expect(granted()).toEqual([ROLES.ADMIN]);
    });

    test('re-applying it does not create a second row', async () => {
        mockConfig.security.bootstrapAdminUserId = '42';
        mockUserRole.count.mockResolvedValue(1);
        await userService.provision('42');
        // findOrCreate, not create: running every request must stay idempotent.
        expect(mockUserRole.findOrCreate).toHaveBeenCalledTimes(1);
        expect(mockUserRole.create).not.toHaveBeenCalled();
    });

    test('a different subject is not promoted', async () => {
        mockConfig.security.bootstrapAdminUserId = '42';
        mockUserRole.count.mockResolvedValue(0);
        await userService.provision('43');
        expect(granted()).toEqual([ROLES.USER]);
    });

    test('the subject is compared as a string, so a numeric id still matches', async () => {
        // auth-service issues `sub` as a bigint STRING; an operator pasting 42 into the env
        // must not silently fail to match.
        mockConfig.security.bootstrapAdminUserId = '42';
        mockUserRole.count.mockResolvedValue(0);
        await userService.provision(42);
        expect(granted()).toContain(ROLES.ADMIN);
    });
});
