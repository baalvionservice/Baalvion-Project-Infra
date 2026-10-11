'use strict';
// Platform user ids are issued by the auth service as numbers (token sub "134"), not UUIDs.
// A UUID-typed user column makes every request for such a user fail in Postgres with
// "invalid input syntax for type uuid", while tests that use UUID-shaped ids still pass.
const fs = require('fs');
const path = require('path');

const USER_COLUMN = /(^|_)(user_id|sender_id|owner_id|student_id|admin_id|actor_id|assigned_to|created_by|reviewed_by|paid_by|granted_by|user_a_id|user_b_id|thread_user_id|author_user_id|[a-z]+_by_user_id|actor_user_id|target_user_id|reviewed_by_user_id)$/;

describe('user-id columns', () => {
    const dir = path.join(__dirname, '..', 'models');
    const offenders = [];
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js')) {
        const src = fs.readFileSync(path.join(dir, file), 'utf8');
        for (const m of src.matchAll(/^\s*([a-z_]+):\s*\{\s*type:\s*DataTypes\.UUID\b/gm)) {
            if (USER_COLUMN.test(m[1])) offenders.push(`${file}: ${m[1]}`);
        }
    }
    it('are strings, never UUIDs', () => {
        expect(offenders).toEqual([]);
    });
});
