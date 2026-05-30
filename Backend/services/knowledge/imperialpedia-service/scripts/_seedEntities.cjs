/* Seed the imperialpedia.entities table with a realistic knowledge-graph dataset
   (companies / countries / industries / technologies). Idempotent (upsert by type+slug).
   Run: node scripts/_seedEntities.cjs */
const db = require('../models');

const company = (slug, name, industry, country, founded_year, headquarters, employees, website, technologies, competitors, category, description, tags) =>
  ({ slug, name, industry, country, category, description, tags, founded_year, headquarters, employees, website, technologies, competitors,
     image: `https://picsum.photos/seed/${slug}/800/450` });

const country = (slug, name, capital, region, population, gdp, currency, official_language, industries, technologies, description, tags) =>
  ({ slug, name, category: region, description, tags, capital, region, population, gdp, currency, official_language, industries, technologies,
     image: `https://picsum.photos/seed/${slug}/800/450` });

const industry = (slug, name, sector, global_market_size, growth_rate, top_countries, key_companies, related_technologies, description, tags) =>
  ({ slug, name, category: sector, description, tags, sector, global_market_size, growth_rate, top_countries, key_companies, related_technologies,
     image: `https://picsum.photos/seed/${slug}/800/450` });

const technology = (slug, name, category, invented_year, applications, use_cases, key_companies, related_technologies, description, tags) =>
  ({ slug, name, category, description, tags, invented_year, applications, use_cases, key_companies, related_technologies,
     image: `https://picsum.photos/seed/${slug}/800/450` });

const DATA = {
  company: [
    company('nvidia', 'NVIDIA', 'semiconductors', 'united-states', 1993, 'Santa Clara, CA', 29600, 'https://nvidia.com', ['generative-ai', 'graphics-processing', 'machine-learning'], ['amd', 'intel'], 'Technology', 'Global leader in accelerated computing and the GPUs powering the AI revolution.', ['AI', 'chips', 'growth']),
    company('amd', 'AMD', 'semiconductors', 'united-states', 1969, 'Santa Clara, CA', 26000, 'https://amd.com', ['graphics-processing', 'machine-learning'], ['nvidia', 'intel'], 'Technology', 'Designer of high-performance CPUs and GPUs for data center, gaming, and AI.', ['chips', 'cpu', 'gpu']),
    company('intel', 'Intel', 'semiconductors', 'united-states', 1968, 'Santa Clara, CA', 124800, 'https://intel.com', ['graphics-processing'], ['nvidia', 'amd', 'tsmc'], 'Technology', 'One of the world’s largest semiconductor manufacturers and x86 pioneer.', ['chips', 'foundry', 'legacy']),
    company('tsmc', 'TSMC', 'semiconductors', 'taiwan', 1987, 'Hsinchu, Taiwan', 76000, 'https://tsmc.com', ['graphics-processing'], ['intel', 'samsung'], 'Technology', 'The world’s largest dedicated semiconductor foundry, fabricating most advanced chips.', ['foundry', 'chips', 'supply-chain']),
    company('apple', 'Apple', 'consumer-electronics', 'united-states', 1976, 'Cupertino, CA', 161000, 'https://apple.com', ['machine-learning'], ['microsoft', 'alphabet'], 'Technology', 'Designs consumer hardware, software, and services around a tightly integrated ecosystem.', ['hardware', 'ecosystem', 'brand']),
    company('microsoft', 'Microsoft', 'cloud-computing', 'united-states', 1975, 'Redmond, WA', 221000, 'https://microsoft.com', ['cloud-computing', 'generative-ai'], ['alphabet', 'amazon'], 'Technology', 'Enterprise software, the Azure cloud, and a leading investor in generative AI.', ['cloud', 'ai', 'enterprise']),
    company('alphabet', 'Alphabet', 'internet', 'united-states', 1998, 'Mountain View, CA', 182000, 'https://abc.xyz', ['machine-learning', 'cloud-computing', 'generative-ai'], ['microsoft', 'amazon'], 'Technology', 'Parent of Google — search, advertising, Android, and Google Cloud.', ['search', 'ads', 'ai']),
    company('amazon', 'Amazon', 'e-commerce', 'united-states', 1994, 'Seattle, WA', 1525000, 'https://amazon.com', ['cloud-computing', 'machine-learning'], ['microsoft', 'alphabet'], 'Technology', 'Global e-commerce and the dominant cloud provider via AWS.', ['cloud', 'retail', 'logistics']),
    company('tesla', 'Tesla', 'electric-vehicles', 'united-states', 2003, 'Austin, TX', 140000, 'https://tesla.com', ['lithium-ion-battery', 'machine-learning'], ['byd', 'volkswagen'], 'Automotive', 'Electric vehicles, energy storage, and an aggressive bet on autonomy.', ['ev', 'energy', 'autonomy']),
    company('openai', 'OpenAI', 'artificial-intelligence', 'united-states', 2015, 'San Francisco, CA', 1700, 'https://openai.com', ['generative-ai', 'machine-learning'], ['alphabet', 'anthropic'], 'Technology', 'AI research lab behind GPT and a defining force in generative AI.', ['ai', 'research', 'llm']),
  ],
  country: [
    country('united-states', 'United States', 'Washington, D.C.', 'North America', 331900000, '$27.4T', 'USD', 'English', ['semiconductors', 'artificial-intelligence', 'cloud-computing', 'fintech'], ['generative-ai', 'cloud-computing'], 'The world’s largest economy and the center of gravity for technology and capital markets.', ['economy', 'tech', 'reserve-currency']),
    country('china', 'China', 'Beijing', 'Asia', 1412000000, '$17.9T', 'CNY', 'Mandarin', ['semiconductors', 'electric-vehicles', 'fintech'], ['5g', 'machine-learning'], 'The world’s manufacturing powerhouse and second-largest economy.', ['manufacturing', 'ev', 'scale']),
    country('germany', 'Germany', 'Berlin', 'Europe', 84000000, '$4.5T', 'EUR', 'German', ['electric-vehicles', 'biotechnology'], ['lithium-ion-battery'], 'Europe’s largest economy, anchored by engineering, automotive, and exports.', ['engineering', 'exports', 'eu']),
    country('japan', 'Japan', 'Tokyo', 'Asia', 125700000, '$4.2T', 'JPY', 'Japanese', ['semiconductors', 'electric-vehicles'], ['graphics-processing'], 'A high-tech, export-driven economy known for precision manufacturing and robotics.', ['robotics', 'precision', 'exports']),
    country('india', 'India', 'New Delhi', 'Asia', 1428000000, '$3.7T', 'INR', 'Hindi', ['fintech', 'cloud-computing'], ['machine-learning', '5g'], 'The world’s most populous nation and a fast-growing services and software hub.', ['growth', 'software', 'demographics']),
    country('united-kingdom', 'United Kingdom', 'London', 'Europe', 67000000, '$3.3T', 'GBP', 'English', ['fintech', 'biotechnology'], ['machine-learning'], 'A global financial center with strengths in finance, science, and creative industries.', ['finance', 'science', 'services']),
  ],
  industry: [
    industry('semiconductors', 'Semiconductors', 'Technology', '$600B', '8.2% CAGR', ['united-states', 'taiwan', 'japan'], ['nvidia', 'tsmc', 'intel', 'amd'], ['graphics-processing', 'machine-learning'], 'The foundational industry producing the chips behind all modern computing.', ['chips', 'foundational', 'cyclical']),
    industry('artificial-intelligence', 'Artificial Intelligence', 'Technology', '$240B', '36% CAGR', ['united-states', 'china', 'united-kingdom'], ['openai', 'alphabet', 'microsoft', 'nvidia'], ['generative-ai', 'machine-learning'], 'Software and systems that learn from data — the fastest-growing technology sector.', ['ai', 'hyper-growth', 'platform']),
    industry('cloud-computing', 'Cloud Computing', 'Technology', '$680B', '17% CAGR', ['united-states', 'china', 'india'], ['amazon', 'microsoft', 'alphabet'], ['cloud-computing', 'machine-learning'], 'On-demand compute, storage, and services delivered over the internet.', ['cloud', 'infrastructure', 'recurring']),
    industry('electric-vehicles', 'Electric Vehicles', 'Automotive', '$500B', '18% CAGR', ['china', 'united-states', 'germany'], ['tesla', 'byd'], ['lithium-ion-battery'], 'Battery-powered vehicles reshaping the automotive and energy industries.', ['ev', 'energy-transition', 'capex']),
    industry('biotechnology', 'Biotechnology', 'Healthcare', '$1.4T', '12% CAGR', ['united-states', 'germany', 'united-kingdom'], [], ['machine-learning'], 'Engineering biology for medicine, agriculture, and materials.', ['biotech', 'r&d', 'long-cycle']),
    industry('fintech', 'Fintech', 'Financial Services', '$310B', '17% CAGR', ['united-states', 'china', 'india'], [], ['blockchain', 'machine-learning'], 'Technology reinventing payments, lending, and financial infrastructure.', ['payments', 'disruption', 'regulation']),
  ],
  technology: [
    technology('generative-ai', 'Generative AI', 'Artificial Intelligence', 2017, ['content creation', 'coding assistants', 'search'], ['chatbots', 'image generation', 'summarization'], ['openai', 'alphabet', 'nvidia'], ['machine-learning', 'graphics-processing'], 'Models that generate text, images, and code, built on the transformer architecture.', ['ai', 'llm', 'transformer']),
    technology('machine-learning', 'Machine Learning', 'Artificial Intelligence', 1959, ['prediction', 'recommendation', 'vision'], ['fraud detection', 'personalization', 'forecasting'], ['alphabet', 'amazon', 'nvidia'], ['generative-ai'], 'Algorithms that learn patterns from data without explicit programming.', ['ai', 'data', 'foundational']),
    technology('graphics-processing', 'Graphics Processing (GPU)', 'Computing Hardware', 1999, ['gaming', 'ai training', 'rendering'], ['parallel compute', 'deep learning', 'simulation'], ['nvidia', 'amd'], ['machine-learning'], 'Massively parallel processors that became the workhorse of AI training.', ['gpu', 'parallel', 'ai-infra']),
    technology('cloud-computing', 'Cloud Computing', 'Infrastructure', 2006, ['hosting', 'storage', 'ai services'], ['scalable apps', 'big data', 'devops'], ['amazon', 'microsoft', 'alphabet'], ['machine-learning'], 'Elastic, on-demand compute and storage delivered as a metered service.', ['cloud', 'scale', 'opex']),
    technology('quantum-computing', 'Quantum Computing', 'Computing Hardware', 1998, ['cryptography', 'materials', 'optimization'], ['drug discovery', 'logistics', 'simulation'], ['alphabet', 'microsoft'], ['machine-learning'], 'Computation exploiting superposition and entanglement for intractable problems.', ['quantum', 'frontier', 'research']),
    technology('blockchain', 'Blockchain', 'Distributed Systems', 2009, ['payments', 'settlement', 'provenance'], ['stablecoins', 'tokenization', 'smart contracts'], [], ['machine-learning'], 'Distributed, tamper-evident ledgers underpinning crypto and tokenized assets.', ['crypto', 'ledger', 'web3']),
    technology('5g', '5G', 'Telecommunications', 2019, ['mobile', 'iot', 'fixed wireless'], ['low latency', 'edge compute', 'connected devices'], [], ['machine-learning'], 'Fifth-generation cellular networks delivering high bandwidth and low latency.', ['telecom', 'connectivity', 'edge']),
    technology('lithium-ion-battery', 'Lithium-Ion Battery', 'Energy Storage', 1991, ['ev', 'grid storage', 'electronics'], ['electric vehicles', 'renewables', 'mobile devices'], ['tesla'], [], 'Rechargeable energy storage enabling the shift to electric mobility and renewables.', ['battery', 'energy', 'ev']),
  ],
};

async function main() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
  await db.sequelize.sync();
  let n = 0;
  for (const [type, items] of Object.entries(DATA)) {
    for (const it of items) {
      const { name, slug, description, category, country: ctry, industry: ind, image, tags, ...attrs } = it;
      const base = { type, name, slug, description, category, country: ctry || null, industry: ind || null, image, tags: tags || [], attributes: attrs };
      const [row, created] = await db.Entity.findOrCreate({ where: { type, slug }, defaults: base });
      if (!created) await row.update(base);
      n++;
    }
  }
  console.log(JSON.stringify({ ok: true, seeded: n }));
  process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
