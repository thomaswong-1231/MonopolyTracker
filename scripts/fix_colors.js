const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Better background to blend with cards
css = css.replace(/--page-bg: #cce3d8;/g, '--page-bg: #cfdacb;'); // more muted, vintage green

// 2. Fix .nav-link colors
css = css.replace(/\.nav-link\.active {[\s\S]*?}/, `.nav-link.active {\n  background: var(--surface-border);\n  color: var(--surface);\n  border-color: var(--surface-border);\n}`);

// 3. Fix button styling
// Previous script made an awful combo: background: var(--color-light-blue); color: var(--text-main); border: 2px solid var(--surface-border);\n  color: #fff;
css = css.replace(/background: var\(--color-light-blue\); color: var\(--text-main\); border: 2px solid var\(--surface-border\);\n  color: #fff;/g, 'background: var(--surface-border);\n  color: var(--surface);\n  border: 2px solid var(--surface-border);');

// 4. Fix .player-money-box
css = css.replace(/background: #eaf2ff;/g, 'background: var(--surface);');
css = css.replace(/border: 1px solid #bfdbfe;/g, 'border: 2px solid var(--surface-border);');

// 5. General button fixes
css = css.replace(/\.button-muted:hover:not\(\[disabled\]\) {[\s\S]*?}/, `.button-muted:hover:not([disabled]) {\n  background: var(--page-bg);\n}`);
css = css.replace(/\.button-white:hover:not\(\[disabled\]\) {[\s\S]*?}/, `.button-white:hover:not([disabled]) {\n  background: var(--page-bg);\n}`);
css = css.replace(/border-color: #2563eb;/g, 'border-color: var(--surface-border);');
css = css.replace(/color: #1d4ed8;/g, 'color: var(--text-main);');

fs.writeFileSync(cssPath, css);
console.log('Colors fixed successfully.');
