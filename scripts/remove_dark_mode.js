const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Remove Dark Mode support by deleting html.theme-dark block completely
css = css.replace(/html\.theme-dark [^{]*?\{[\s\S]*?}/g, ''); // this regex isn't perfect for nested rules or multiple blocks. Instead, let's remove everything after the first `html.theme-dark` declaration since it usually sits at the end of the file.

const darkIndex = css.indexOf('html.theme-dark');
if (darkIndex !== -1) {
    const originalLength = css.length;
    css = css.substring(0, darkIndex).trim(); // Truncate the file at the start of dark mode blocks
    console.log(`Truncated file at dark mode (removed ~${originalLength - css.length} characters)`);
}

// 2. Fix Left Side border-radius
css = css.replace(/border-radius: 14px 0 0 14px;/g, 'border-radius: 0;');
css = css.replace(/border-radius: 14px 14px 0 0;/g, 'border-radius: 0;');

fs.writeFileSync(cssPath, css);
console.log('Processed CSS dark mode removal and border adjustments.');
