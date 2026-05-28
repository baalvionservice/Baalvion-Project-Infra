const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// NOTE: This per-service `npm install` helper is the legacy (pre-pnpm) flow. The
// canonical install is now `corepack pnpm install` at the repo root (build model:
// Option A — pnpm workspace). Services already migrated to the workspace (e.g.
// about-service, which declares `@baalvion/*: workspace:*`) are intentionally NOT
// listed here — standalone `npm install` cannot resolve the workspace protocol.
const backends = [
];

const frontends = [
    'Frontend/about-baalvion-main',
    'Frontend/AmariseMaisonAvenue-main',
    'Frontend/Baalvion-Jobs-Portal-main',
    'Frontend/brand-connector-main',
    'Frontend/company-unified-Dashboard-main',
    'Frontend/controlthemarket-main',
    'Frontend/Imperialpedia-main',
    'Frontend/IR-Baalvion-main',
    'Frontend/Mining.Baalvion-main',
    'Frontend/Proxy-BaalvionStack',
    'Frontend/admin-platform',
];

const target = process.argv[2] || 'all';
const dirs = target === 'backends' ? backends : target === 'frontends' ? frontends : [...backends, ...frontends];

let failed = [];

for (const dir of dirs) {
    const full = path.join(root, dir);
    if (!fs.existsSync(path.join(full, 'package.json'))) {
        console.log(`\x1b[33mSKIP\x1b[0m ${dir} (no package.json)`);
        continue;
    }
    const nodeModules = path.join(full, 'node_modules');
    if (fs.existsSync(nodeModules)) {
        console.log(`\x1b[32mALREADY\x1b[0m ${dir}`);
        continue;
    }
    console.log(`\x1b[36mINSTALLING\x1b[0m ${dir}`);
    try {
        execSync('npm install --prefer-offline', { cwd: full, stdio: 'inherit' });
        console.log(`\x1b[32mDONE\x1b[0m ${dir}`);
    } catch (err) {
        console.error(`\x1b[31mFAILED\x1b[0m ${dir}: ${err.message}`);
        failed.push(dir);
    }
}

if (failed.length) {
    console.error('\n\x1b[31mFailed installs:\x1b[0m', failed.join(', '));
    process.exit(1);
} else {
    console.log('\n\x1b[32mAll installs complete.\x1b[0m');
}
