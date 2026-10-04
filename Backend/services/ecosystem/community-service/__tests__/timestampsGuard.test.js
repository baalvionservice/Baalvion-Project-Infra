'use strict';
// Sequelize exposes timestamps as createdAt/updatedAt on instances; reading `row.created_at`
// silently yields undefined (and every API date came back missing). Guard the modules that
// serialise model rows.
const fs = require('fs');
const path = require('path');

const FILES = [
    'service/nightlifeService.js', 'service/gigsService.js', 'service/bountyService.js', 'service/eduService.js',
    'service/kycService.js', 'service/notifyEvents.js', 'service/notify.js', 'service/mediaService.js',
    'routes/notificationRoutes.js', 'routes/mediaRoutes.js',
];

describe('model timestamp property reads', () => {
    it.each(FILES)('%s never reads row.created_at / row.updated_at', (file) => {
        const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        const bad = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /\b[a-zA-Z_]+\.(created_at|updated_at)\b/.test(l) && !/where\.created_at/.test(l));
        expect(bad).toEqual([]);
    });
});

describe('audit hook registration', () => {
    it('is mounted once, in routes/v1.js, and nowhere else (it would log each action once per router)', () => {
        const dir = path.join(__dirname, '..', 'routes');
        const users = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).filter((f) => /auditAdmin\)|use\(.+auditAdmin/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
        expect(users).toEqual(['v1.js']);
    });
});
