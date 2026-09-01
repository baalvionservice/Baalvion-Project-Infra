// scripts/generate-missing-hub-content.js
// Scans hub directories under src/app and ensures each hub component has placeholder KEY_TERMS, FAQS, and PRODUCT_TOPICS.
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const appDir = path.resolve(repoRoot, 'src', 'app');
const componentsDir = path.resolve(repoRoot, 'src', 'components', 'pages');

function fileContains(filePath, identifier) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(identifier);
}

function toPascalCase(str) {
  return str.split(/[-_]/g).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function generateKeyTerms(topic) {
  const terms = [
    { term: `${topic} Basics`, definition: `An overview of ${topic.toLowerCase()} fundamentals, covering core concepts and why they matter.` },
    { term: `Advanced ${topic}`, definition: `Deep dive into advanced aspects of ${topic.toLowerCase()}, including strategies and best practices.` },
    { term: `${topic} Fees`, definition: `Explanation of typical fees associated with ${topic.toLowerCase()} and how to minimize them.` },
    { term: `${topic} Benefits`, definition: `Key advantages of using ${topic.toLowerCase()} for personal finance management.` },
    { term: `${topic} Risks`, definition: `Potential risks and pitfalls to watch out for when dealing with ${topic.toLowerCase()}.` },
  ];
  const arr = terms.map(t => `  { term: \"${t.term}\", definition: \"${t.definition}\", href: \"/${topic.toLowerCase()}\" },`).join('\n');
  return `const ${topic.toUpperCase()}_KEY_TERMS: KeyTermItem[] = [\n${arr}\n];`;
}

function generateFaqs(topic) {
  const faqs = [
    { q: `What is ${topic}?`, a: `${topic} is a financial product/service that helps you manage your money effectively.` },
    { q: `How does ${topic} work?`, a: `${topic} works by providing features such as ... (brief description).` },
    { q: `Who should consider ${topic}?`, a: `Anyone looking to improve their ${topic.toLowerCase()} situation can benefit.` },
    { q: `What are common fees for ${topic}?`, a: `Typical fees include ... and can often be avoided with ...` },
    { q: `How to compare ${topic} options?`, a: `Look at interest rates, fees, features, and user reviews to decide.` },
  ];
  const arr = faqs.map(f => `  { question: \"${f.q}\", answer: \"${f.a}\", link: { label: \"Learn more about ${topic}\", href: \"/${topic.toLowerCase()}\" } },`).join('\n');
  return `const ${topic.toUpperCase()}_FAQS: FaqItem[] = [\n${arr}\n];`;
}

function generateProductTopics(topic) {
  const products = [
    { slug: `${topic.toLowerCase()}`, label: `${topic} Overview`, icon: 'Star' },
    { slug: `${topic.toLowerCase()}-tips`, label: `${topic} Tips`, icon: 'Star' },
    { slug: `${topic.toLowerCase()}-reviews`, label: `${topic} Reviews`, icon: 'Star' },
  ];
  const arr = products.map(p => `  { slug: \"${p.slug}\", label: \"${p.label}\", icon: ${p.icon} },`).join('\n');
  return `const ${topic.toUpperCase()}_PRODUCT_TOPICS: Array<{ slug: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [\n${arr}\n];`;
}

function processHub(folderName) {
  const componentFile = path.join(componentsDir, `${toPascalCase(folderName)}Hub.tsx`);
  if (!fs.existsSync(componentFile)) {
    console.warn(`Component file not found for hub ${folderName}: ${componentFile}`);
    return;
  }
  const topic = toPascalCase(folderName);
  const additions = [];
  if (!fileContains(componentFile, `${topic.toUpperCase()}_KEY_TERMS`)) additions.push(generateKeyTerms(topic));
  if (!fileContains(componentFile, `${topic.toUpperCase()}_FAQS`)) additions.push(generateFaqs(topic));
  if (!fileContains(componentFile, `${topic.toUpperCase()}_PRODUCT_TOPICS`)) additions.push(generateProductTopics(topic));
  if (additions.length === 0) return;

  const content = fs.readFileSync(componentFile, 'utf8');
  const lines = content.split('\n');
  let insertIdx = lines.findIndex(l => !l.startsWith('import'));
  if (insertIdx === -1) insertIdx = lines.length;
  const before = lines.slice(0, insertIdx).join('\n');
  const after = lines.slice(insertIdx).join('\n');
  const newContent = [before, ...additions, after].join('\n\n');
  fs.writeFileSync(componentFile, newContent, 'utf8');
  console.log(`Updated ${componentFile} with missing sections.`);
}

// Directories to ignore (utility & config dirs)
const exclude = new Set([
  'api', 'components', 'layout', 'error.tsx', 'not-found.tsx', 'robots.ts',
  'sitemap.xml', 'feed.xml', 'globals.css', 'page.tsx'
]);

const dirs = fs.readdirSync(appDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && !exclude.has(d.name))
  .map(d => d.name);

for (const dir of dirs) processHub(dir);

console.log('Missing hub content generation completed.');
