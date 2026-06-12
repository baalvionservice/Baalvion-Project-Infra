module.exports = {
    apps: [
        // ── Auth Service ─────────────────────────────────────────────────────
        {
            name: 'auth-service',
            cwd: './Backend/services/identity/auth-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3001 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Proxy Backend ────────────────────────────────────────────────────
        {
            name: 'proxy-backend',
            cwd: './Backend/services/infrastructure/proxy-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 4000 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Jobs Service ─────────────────────────────────────────────────────
        {
            name: 'jobs-service',
            cwd: './Backend/services/ecosystem/jobs-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3002 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Mining Service ───────────────────────────────────────────────────
        {
            name: 'mining-service',
            cwd: './Backend/services/ecosystem/mining-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3003 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Imperialpedia Service ────────────────────────────────────────────
        {
            name: 'imperialpedia-service',
            cwd: './Backend/services/knowledge/imperialpedia-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3004 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Real Estate Service ───────────────────────────────────────────────
        {
            name: 'real-estate-service',
            cwd: './Backend/services/ecosystem/real-estate-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3005 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Brand Connector Service ──────────────────────────────────────────
        {
            name: 'brand-connector-service',
            cwd: './Backend/services/ecosystem/brand-connector-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3006 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Market Service ───────────────────────────────────────────────────
        {
            name: 'market-service',
            cwd: './Backend/services/commerce/market-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3007 },
            log_date_format: 'HH:mm:ss',
        },
        // ── IR Service ───────────────────────────────────────────────────────
        {
            name: 'ir-service',
            cwd: './Backend/services/ecosystem/ir-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3008 },
            log_date_format: 'HH:mm:ss',
        },
        // ── CRM & Marketing Service ──────────────────────────────────────────
        // Has no own node_modules — borrows ir-service's via NODE_PATH (same precedent
        // as marketplace-service). Schema `crm`; brand-scoped (amarise-luxe).
        {
            name: 'crm-service',
            cwd: './Backend/services/ecosystem/crm-service',
            script: 'index.js',
            watch: false,
            env: {
                NODE_ENV: 'development',
                PORT: 3063,
                NODE_PATH: require('path').resolve(__dirname, 'Backend/services/ecosystem/ir-service/node_modules'),
            },
            log_date_format: 'HH:mm:ss',
        },
        // ── Dashboard Service ────────────────────────────────────────────────
        {
            name: 'dashboard-service',
            cwd: './Backend/services/platform/dashboard-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3009 },
            log_date_format: 'HH:mm:ss',
        },
        // ── About Service ────────────────────────────────────────────────────
        {
            name: 'about-service',
            cwd: './Backend/services/ecosystem/about-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3010 },
            log_date_format: 'HH:mm:ss',
        },
        // ── CMS Service ──────────────────────────────────────────────────────
        {
            name: 'cms-service',
            cwd: './Backend/services/knowledge/cms-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3011 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Commerce Service ─────────────────────────────────────────────────
        {
            name: 'commerce-service',
            cwd: './Backend/services/commerce/commerce-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3012 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Order Service ────────────────────────────────────────────────────
        {
            name: 'order-service',
            cwd: './Backend/services/commerce/order-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3013 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Inventory Service ────────────────────────────────────────────────
        {
            name: 'inventory-service',
            cwd: './Backend/services/commerce/inventory-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3014 },
            log_date_format: 'HH:mm:ss',
        },
        // ── Fulfillment Service ──────────────────────────────────────────────
        {
            name: 'fulfillment-service',
            cwd: './Backend/services/commerce/fulfillment-service',
            script: 'index.js',
            watch: false,
            env: { NODE_ENV: 'development', PORT: 3015 },
            log_date_format: 'HH:mm:ss',
        },

        // ════════════════════════════════════════════════════════════════════
        // FRONTENDS  (Windows: use npm.cmd + interpreter none)
        // ════════════════════════════════════════════════════════════════════
        {
            // Production: `next start` against the prebuilt .next output (run `npm run build` first).
            // SEO/indexing requires production mode — dev mode is unoptimized and not statically rendered.
            name: 'about-web',
            cwd: './Frontend/about-baalvion-main',
            script: './node_modules/next/dist/bin/next',
            args: 'start -p 3020',
            interpreter: 'node',
            watch: false,
            env: { NODE_ENV: 'production', PORT: '3020' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-amarise',
            cwd: './Frontend/AmariseMaisonAvenue-main',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-jobs',
            cwd: './Frontend/Baalvion-Jobs-Portal-main',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-brand',
            cwd: './Frontend/brand-connector-main',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-dashboard',
            cwd: './Frontend/company-unified-Dashboard-main',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-market',
            cwd: './Frontend/controlthemarket-main',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-imperial',
            cwd: './Frontend/Imperialpedia-main',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-ir',
            cwd: './Frontend/IR-Baalvion-main',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-mining',
            cwd: './Frontend/Mining.Baalvion-main',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-proxy',
            cwd: './Frontend/Proxy-BaalvionStack',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
        {
            name: 'fe-admin',
            cwd: './Frontend/admin-platform',
            script: 'npm.cmd',
            args: 'run dev',
            interpreter: 'none',
            watch: false,
            env: { NODE_ENV: 'development' },
            log_date_format: 'HH:mm:ss',
        },
    ],
};
