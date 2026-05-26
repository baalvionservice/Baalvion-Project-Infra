const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

const backends = [
    'Backend/auth-service',
    'Backend/backend-Proxy-BaalvionStack',
    'Backend/jobs-service',
    'Backend/mining-service',
    'Backend/imperialpedia-service',
    'Backend/real-estate-service',
    'Backend/brand-connector-service',
    'Backend/market-service',
    'Backend/ir-service',
    'Backend/dashboard-service',
    'Backend/about-service',
    'Backend/cms-service',
    'Backend/commerce-service',
    'Backend/order-service',
    'Backend/inventory-service',
    'Backend/fulfillment-service',
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
