const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Root variables
css = css.replace(/:root {[\s\S]*?}/, `:root {
  --page-bg: #cce3d8;
  --text-main: #1a365d;
  --surface: #fdfaf2;
  --surface-border: #1a365d;
  --color-dark-blue: #1a365d;
  --color-light-blue: #a2d2ff;
  --color-focus-red: #da291c;
}`);

// 2. Fonts
css = css.replace(/font-family: Inter, system-ui, -apple-system, sans-serif;/g, `font-family: var(--font-jost), 'Futura', sans-serif;`);
css = css.replace(/font-family: "Avenir Next", "Segoe UI", "Inter", system-ui, -apple-system, sans-serif;/g, `font-family: var(--font-josefin), 'Kabel', sans-serif;`);
css = css.replace(/font-family:[^;]+;/g, (match) => {
  if (match.includes('monospace')) return match;
  if (match.includes('var(--font-')) return match;
  return `font-family: var(--font-jost), 'Futura', sans-serif;`;
});

// Update specific font weights to match available or typical weights for these styles
css = css.replace(/font-weight: 800;/g, 'font-weight: 700;');
css = css.replace(/font-weight: 900;/g, 'font-weight: 700;');

// 3. Colors and Backgrounds
// Cover Hero changes
css = css.replace(/background: radial-gradient[^;]+;/g, 'background: #fdfaf2;');
css = css.replace(/background: conic-gradient[^;]+;/g, 'background: none;');
css = css.replace(/background: linear-gradient[^;]+;/g, 'background: var(--surface);');

// 4. Border Radius
css = css.replace(/border-radius: [0-9]+px;/g, 'border-radius: 0px;');
css = css.replace(/border-radius: 999px;/g, 'border-radius: 0;');
css = css.replace(/border-radius: [0-9]+rem;/g, 'border-radius: 0;');

// 5. Shadows
css = css.replace(/box-shadow: [^;]+;/g, 'box-shadow: 4px 4px 0px var(--surface-border);');
css = css.replace(/box-shadow: none;/g, 'box-shadow: none;');
// reset inset shadows if any
css = css.replace(/box-shadow: inset [^;]+;/g, 'box-shadow: none;');

// 6. Borders
// Ensure elements have solid borders
css = css.replace(/border: 1px solid #cbd5e1;/g, 'border: 2px solid var(--surface-border);');
css = css.replace(/border: 1px solid #d1d5db;/g, 'border: 2px solid var(--surface-border);');
css = css.replace(/border: 1px solid var\(--surface-border\);/g, 'border: 2px solid var(--surface-border);');
css = css.replace(/border: 1px solid #e5e7eb;/g, 'border: 2px solid var(--surface-border);');

// 7. Buttons
// Muted buttons -> white
// Primary buttons -> light blue or dark blue
css = css.replace(/background: #2563eb;/g, 'background: var(--color-light-blue); color: var(--text-main); border: 2px solid var(--surface-border);');

// 8. Animations
// Disable glowing/spinning things that feel modern
css = css.replace(/animation: [^;]+;/g, 'animation: none;');

// Write back
fs.writeFileSync(cssPath, css);
console.log('CSS transformed successfully.');
