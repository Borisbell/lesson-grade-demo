const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// dist is the source and the deployable output of this dependency-free demo.
const root = path.resolve(__dirname, '../dist');
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not supported: ${file}`);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile()) files.push(file);
  }
}
walk(root);
if (!fs.statSync(path.join(root, 'index.html')).isFile()) throw new Error('Missing dist/index.html');

function checkReference(source, raw) {
  if (!raw || /^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(raw)) return;
  if (raw.startsWith('/')) throw new Error(`Root-relative URL breaks project Pages: ${raw} in ${source}`);
  const reference = decodeURIComponent(raw.split(/[?#]/)[0]);
  if (!reference) return;
  const target = path.resolve(path.dirname(source), reference);
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
    throw new Error(`Missing or unsafe local file: ${raw} in ${source}`);
  }
}

for (const file of files) {
  if (fs.statSync(file).size >= 100 * 1024 * 1024) throw new Error(`File exceeds Pages limit: ${file}`);
  const extension = path.extname(file);
  if (extension === '.js') execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (extension === '.html' || extension === '.css') {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) checkReference(file, match[1]);
    for (const match of source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) checkReference(file, match[1]);
  }
  if (extension === '.js') {
    const source = fs.readFileSync(file, 'utf8');
    // Check complete static asset strings; concatenated variant names are tested by the flow checks.
    for (const match of source.matchAll(/["'](assets\/[\w./-]+\.(?:svg|png|mp4|mp3|woff))["']/g)) checkReference(file, match[1]);
  }
}
fs.writeFileSync(path.join(root, '.nojekyll'), '');
const bytes = files.reduce((total, file) => total + fs.statSync(file).size, 0);
console.log(`Build ready: dist/ (${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MiB). All local references and JavaScript syntax checked.`);
