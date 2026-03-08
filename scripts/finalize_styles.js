const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Make background more cream/warm off-white to fit vintage aesthetic
css = css.replace(/--page-bg: #cfdacb;/g, '--page-bg: #f8f6e6;'); 
// Also adjust surface color slightly lighter to contrast with the new bg
css = css.replace(/--surface: #fdfaf2;/g, '--surface: #fffcfa;');

// 2. Fix highlight color (the hover borders that were neon blue)
css = css.replace(/border-color: #93c5fd;/g, 'border-color: var(--color-focus-red);');
css = css.replace(/border: 1px solid #bfdbfe;/g, 'border: 2px solid var(--surface-border);');

// 3. Fix Player Profile Top Color Bar
// The current implementation places it as a tiny absolute bar or an awkward block. Let's make it the actual solid background of the top header area of the card.
css = css.replace(/\.dashboard-player-list .player-color-bar {[\s\S]*?}/, `.dashboard-player-list .player-color-bar {\n  inset: 0 0 auto 0;\n  width: 100%;\n  height: 24px;\n  border-bottom: 2px solid var(--surface-border);\n}`);

// Remove the top padding from the card padding since we have the bar now visually occupying it
css = css.replace(/padding-top: 26px;/g, 'padding-top: 36px;');

fs.writeFileSync(cssPath, css);
console.log('Final style refinements applied.');
