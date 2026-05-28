import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';

const root = "D:/researchflow-os/researchflow extension/src";

function getFiles(dir) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) results = results.concat(getFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) results.push(full);
  }
  return results;
}

function resolveRelative(fromFile, importPath) {
  const dir = dirname(fromFile);
  return join(dir, importPath).replace(/\\/g, '/');
}

function toAlias(absPath) {
  const p = absPath.replace(/\\/g, '/');
  if (p.startsWith(root + '/ui/components/')) {
    return '@components/' + p.slice((root + '/ui/components/').length);
  }
  if (p.startsWith(root + '/storage/')) {
    return '@storage/' + p.slice((root + '/storage/').length);
  }
  if (p.startsWith(root + '/core/')) {
    return '@core/' + p.slice((root + '/core/').length);
  }
  if (p.startsWith(root + '/hooks/')) {
    return '@hooks/' + p.slice((root + '/hooks/').length);
  }
  if (p.startsWith(root + '/features/')) {
    return '@features/' + p.slice((root + '/features/').length);
  }
  if (p.startsWith(root + '/')) {
    return '@/' + p.slice((root + '/').length);
  }
  return null;
}

const files = getFiles(root);
let changed = 0;
let totalReplacements = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  let modified = false;

  // Match import/export from with relative paths
  const re = /((?:import|export)\s+(?:(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+))['"](\.\.?\/[^'"]*)['"]/g;

  let newContent = content.replace(re, (match, prefix, importPath) => {
    const resolved = resolveRelative(file, importPath);
    const alias = toAlias(resolved);
    if (alias) {
      totalReplacements++;
      modified = true;
      return prefix + "'" + alias + "'";
    }
    return match;
  });

  if (modified) {
    writeFileSync(file, newContent, 'utf8');
    changed++;
    console.log('Modified:', relative(root, file));
  }
}

console.log(`\nTotal: ${changed} files modified, ${totalReplacements} imports changed`);
