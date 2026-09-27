// scripts/expand-hub-content.js
// This script walks through src/app/*/page.mdx files and appends
// rich placeholder sections (TipBox, DataTable, InternalLinkList)
// to each article to provide internal linking and deeper content.

const fs = require('fs');
const path = require('path');

const APP_ROOT = path.resolve(process.cwd(), 'src/app');
const MDX_PATTERN = 'page.mdx';

function getAllHubDirs() {
  return fs
    .readdirSync(APP_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '[...slug]')
    .map((d) => d.name);
}

function appendContent(filePath, hubSlug) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Skip if already enhanced
  if (content.includes('<InternalLinkList')) return;

  const importBlock = `\nimport { TipBox } from '@/components/common/TipBox';\nimport { DataTable } from '@/components/common/DataTable';\nimport InternalLinkList from '@/components/common/InternalLinkList';\n`;

  const extra = `\n## In‑Depth Look\n\n<TipBox>\n**Pro tip:** Keep an eye on market trends and consider diversification to mitigate risk.\n</TipBox>\n\n<DataTable\n  columns={[\"Metric\", \"Value\"]}\n  rows={[\n    [\"Example\", \"123\"],\n    [\"Another\", \"456\"]\n  ]}\n  caption={\"Key metrics for ${hubSlug}\"}\n/>\n\n<InternalLinkList hub={\"${hubSlug}\"} />\n`;

  // Insert imports after existing import statements
  const lines = content.split('\n');
  let insertIdx = 0;
  while (insertIdx < lines.length && lines[insertIdx].trim().startsWith('import')) {
    insertIdx++;
  }
  lines.splice(insertIdx, 0, importBlock.trim());
  lines.push(extra.trim());
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`Enhanced ${filePath}`);
}

function main() {
  const hubs = getAllHubDirs();
  hubs.forEach((hub) => {
    const mdxPath = path.join(APP_ROOT, hub, MDX_PATTERN);
    if (fs.existsSync(mdxPath)) {
      appendContent(mdxPath, hub);
    }
  });
}

main();
