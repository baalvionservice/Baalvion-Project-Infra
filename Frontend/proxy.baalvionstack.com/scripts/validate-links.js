/**
 * Link Validation Script (JavaScript version for direct Node.js execution)
 * Checks all <Link to="..."> usages against defined routes in App.tsx
 * Run with: node scripts/validate-links.js
 */

const fs = require('fs');
const path = require('path');

// Extract routes from App.tsx
function extractRoutes(appContent) {
  const routes = new Set();
  
  // Match Route path attributes
  const routeRegex = /path=["']([^"']+)["']/g;
  let match;
  
  while ((match = routeRegex.exec(appContent)) !== null) {
    const routePath = match[1];
    routes.add(routePath.startsWith('/') ? routePath : '/' + routePath);
  }
  
  // Add root route
  routes.add('/');
  
  // Known parent routes for nested route building
  const parentRoutes = ['/app', '/admin'];
  const childRoutes = ['dashboard', 'proxies', 'presets', 'sub-users', 'analytics', 'billing', 'api-keys', 'settings', 'users', 'plans', 'providers', 'routing', 'abuse', 'health', 'tickets'];
  
  parentRoutes.forEach(parent => {
    routes.add(parent);
    childRoutes.forEach(child => {
      routes.add(`${parent}/${child}`);
    });
  });
  
  return routes;
}

// Extract Link usages from a file
function extractLinks(content, filePath) {
  const results = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match Link to="..." patterns
    const linkMatches = line.matchAll(/<Link[^>]*to=["']([^"']+)["']/g);
    for (const match of linkMatches) {
      results.push({
        file: filePath,
        line: index + 1,
        link: match[1],
        status: 'valid'
      });
    }
    
    // Match navigate() calls
    const navMatches = line.matchAll(/navigate\(["']([^"']+)["']\)/g);
    for (const match of navMatches) {
      results.push({
        file: filePath,
        line: index + 1,
        link: match[1],
        status: 'valid'
      });
    }
  });
  
  return results;
}

// Recursively find all TSX files
function findTsxFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      findTsxFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Check if a link matches any route
function isValidLink(link, routes) {
  // Dynamic links with variables
  if (link.includes('${') || link.includes('`')) {
    return 'dynamic';
  }
  
  // External links
  if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('mailto:')) {
    return 'valid';
  }
  
  // Hash links
  if (link.startsWith('#')) {
    return 'valid';
  }
  
  // Check exact match
  if (routes.has(link)) {
    return 'valid';
  }
  
  // Check if link starts with a valid route
  for (const route of routes) {
    if (link === route) {
      return 'valid';
    }
  }
  
  // Check for parameterized routes
  for (const route of routes) {
    if (route.includes(':')) {
      const routePattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      if (regex.test(link)) {
        return 'valid';
      }
    }
  }
  
  return 'invalid';
}

// Main validation function
function validateLinks() {
  const srcDir = path.resolve(__dirname, '../src');
  const appTsxPath = path.resolve(srcDir, 'App.tsx');
  
  // Check if App.tsx exists
  if (!fs.existsSync(appTsxPath)) {
    console.error('❌ Could not find App.tsx at:', appTsxPath);
    process.exit(1);
  }
  
  // Extract routes
  const appContent = fs.readFileSync(appTsxPath, 'utf-8');
  const routes = extractRoutes(appContent);
  
  console.log('\n📍 Detected Routes:');
  console.log('─'.repeat(50));
  Array.from(routes).sort().forEach(route => {
    console.log(`   ${route}`);
  });
  console.log('─'.repeat(50));
  
  // Find all TSX files
  const tsxFiles = findTsxFiles(srcDir);
  
  // Extract and validate all links
  const allResults = [];
  
  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const links = extractLinks(content, path.relative(srcDir, file));
    
    for (const result of links) {
      result.status = isValidLink(result.link, routes);
      allResults.push(result);
    }
  }
  
  // Report results
  const invalidLinks = allResults.filter(r => r.status === 'invalid');
  const dynamicLinks = allResults.filter(r => r.status === 'dynamic');
  const validLinks = allResults.filter(r => r.status === 'valid');
  
  console.log('\n📊 Link Validation Summary:');
  console.log('─'.repeat(50));
  console.log(`   ✅ Valid links:   ${validLinks.length}`);
  console.log(`   ⚠️  Dynamic links: ${dynamicLinks.length}`);
  console.log(`   ❌ Invalid links: ${invalidLinks.length}`);
  console.log('─'.repeat(50));
  
  if (invalidLinks.length > 0) {
    console.log('\n❌ INVALID LINKS FOUND:');
    console.log('═'.repeat(50));
    
    invalidLinks.forEach(result => {
      console.log(`\n   File: ${result.file}`);
      console.log(`   Line: ${result.line}`);
      console.log(`   Link: "${result.link}"`);
    });
    
    console.log('\n');
    console.log('═'.repeat(50));
    console.log('⚠️  Fix the above links before deploying!');
    console.log('═'.repeat(50));
    process.exit(1);
  }
  
  if (dynamicLinks.length > 0) {
    console.log('\n⚠️  Dynamic links (verify manually):');
    dynamicLinks.forEach(result => {
      console.log(`   ${result.file}:${result.line} → ${result.link}`);
    });
  }
  
  console.log('\n✅ All links are valid!\n');
  process.exit(0);
}

// Run validation
validateLinks();
