import fs from 'fs';
import path from 'path';

const projectRoot = '/Users/wade/Desktop/Baalvion-Project-Infra-main/Frontend/Imperialpedia-main';
const appDir = path.join(projectRoot, 'src', 'app');
const componentsDir = path.join(projectRoot, 'src', 'components', 'pages');
const templatePath = path.join(componentsDir, 'BankingHub.tsx');

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/g)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

if (!fs.existsSync(templatePath)) {
  console.error('Template BankingHub.tsx not found at', templatePath);
  process.exit(1);
}

const templateContent = fs.readFileSync(templatePath, 'utf8');

const requiredFolders = [
  'family-budget','fed','financial-calculators','financial-intelligence','financial-tools','fiscal-policy','gdp','global','government','credit-cards','cryptocurrency','affiliate-disclosure','app-reviews','authors','auto-loans','banking-reviews','brokers','budget-rules','budgeting-apps','budgeting-basics','advanced-budgeting'
];

for (const folder of requiredFolders) {
  const componentName = `${toPascalCase(folder)}Hub.tsx`;
  const componentPath = path.join(componentsDir, componentName);
  if (fs.existsSync(componentPath)) {
    console.log(`✅ ${componentName} already exists`);
    continue;
  }
  let newContent = templateContent.replace(/BankingHub/g, `${toPascalCase(folder)}Hub`);
  newContent = newContent.replace(/export default function BankingHub/, `export default function ${toPascalCase(folder)}Hub`);
  fs.writeFileSync(componentPath, newContent, 'utf8');
  console.log(`🛠️ Created ${componentName}`);
}
