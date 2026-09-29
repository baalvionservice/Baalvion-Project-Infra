/**
 * Link Validation Script
 * Checks all <Link to="..."> usages against defined routes in App.tsx
 * Run with: npx ts-node scripts/validate-links.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  line: number;
  link: string;
  status: 'valid' | 'invalid' | 'dynamic';
}

// Extract routes from App.tsx
function extractRoutes(appContent: string): Set<string> {
  const routes = new Set<string>();
  
  // Match Route path attributes
  const routeRegex = /path=["']([^"']+)["']/g;
  let match;
  
  while ((match = routeRegex.exec(appContent)) !== null) {
    const routePath = match[1];
    routes.add(routePath);
    
    // Also add with leading slash if not present
    if (!routePath.startsWith('/')) {
      routes.add('/' + routePath);
    }
  }
  
  // Add root route
  routes.add('/');
  
  // Build nested routes (e.g., /app + dashboard = /app/dashboard)
  const nestedPaths = new Map<string, string[]>();
  const layoutRegex = /path=["']([^"']+)["'][^>]*element=\{<[^>]+Layout/g;
  
  // Find parent routes with layouts
  const parentRoutes = ['/app', '/admin'];
  const childRoutes: string[] = [];
  
  routes.forEach(route => {
    if (route !== '/' && !route.startsWith('/app') && !route.startsWith('/admin') && !route.includes('*')) {
      // These are likely child routes
      if (!route.startsWith('/')) {
        childRoutes.push(route);
      }
    }
  });
  
  // Add combined routes
  parentRoutes.forEach(parent => {
    routes.add(parent);
    childRoutes.forEach(child => {
      if (!child.startsWith('/')) {
        routes.add(`${parent}/${child}`);
      }
    });
  });
  
  return routes;
}

// Extract Link usages from a file
function extractLinks(content: string, filePath: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const lines = content.split('\n');
  
  // Match Link to="..." patterns
  const linkRegex = /<Link[^>]*to=["']([^"']+)["']/g;
  
  lines.forEach((line, index) => {
    let match;
    const lineRegex = /<Link[^>]*to=["']([^"']+)["']/g;
    
    while ((match = lineRegex.exec(line)) !== null) {
      const link = match[1];
      results.push({
        file: filePath,
        line: index + 1,
        link,
        status: 'valid' // Will be updated later
      });
    }
  });
  
  // Also check navigate() calls
  const navigateRegex = /navigate\(["']([^"']+)["']\)/g;
  lines.forEach((line, index) => {
    let match;
    const lineRegex = /navigate\(["']([^"']+)["']\)/g;
    
    while ((match = lineRegex.exec(line)) !== null) {
      const link = match[1];
      results.push({
        file: filePath,
        line: index + 1,
        link,
        status: 'valid'
      });
    }
  });
  
  return results;
}

// Recursively find all TSX files
function findTsxFiles(dir: string, files: string[] = []): string[] {
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
function isValidLink(link: string, routes: Set<string>): 'valid' | 'invalid' | 'dynamic' {
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
  
  // Check if it's a sub-path of a valid route (for index routes)
  for (const route of routes) {
    if (link === route || link.startsWith(route + '/')) {
      return 'valid';
    }
  }
  
  // Check for parameterized routes (e.g., /users/:id)
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
function validateLinks(): void {
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
  const allResults: ValidationResult[] = [];
  
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
}

// Run validation
validateLinks();
