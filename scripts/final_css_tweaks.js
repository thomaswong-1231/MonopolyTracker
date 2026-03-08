const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Remove Logo Border and Enlarge (Zoom in)
css = css.replace(/border: 4px solid var\(--color-dark-blue\);/g, 'border: 0;');
css = css.replace(/width: 140px;\n  height: 140px;/g, 'width: 160px;\n  height: 160px;');

// 2. Increase Banner Height (~50px)
css = css.replace(/max-height: 180px;/g, 'max-height: 230px;');

fs.writeFileSync(cssPath, css);
console.log('Processed latest CSS tweaks for logo and banner.');
