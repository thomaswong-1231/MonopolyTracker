const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Logo Styling: Enlarge and add a border
// Target `.brand-image`
css = css.replace(/\.brand-image {[\s\S]*?}/, `.brand-image {\n  width: 140px;\n  height: 140px;\n  border-radius: 0px;\n  object-fit: contain;\n  object-position: center center;\n  background: transparent;\n  border: 4px solid var(--color-dark-blue);\n  box-shadow: none;\n  padding: 4px;\n}`);

// Target `.brand` container slightly to handle the larger image nicely
css = css.replace(/\.brand-logo {[\s\S]*?}/, `.brand-logo {\n  display: inline-flex;\n  align-items: center;\n  gap: 16px;\n  padding: 6px 4px;\n}`);

// 2. Banner/Hero Styling: Ensure landscape format
// Because we're using a single image, we need to constrain the container height significantly.
css = css.replace(/\.cover-hero {[\s\S]*?}/, `.cover-hero {\n  position: relative;\n  min-height: 120px;\n  max-height: 180px;\n  border-radius: 0;\n  overflow: hidden;\n  background: var(--page-bg);\n  border: 4px solid var(--color-dark-blue);\n}`);

css = css.replace(/\.cover-hero-image {[\s\S]*?}/, `.cover-hero-image {\n  min-height: 120px;\n  max-height: 180px;\n  aspect-ratio: auto;\n  width: 100%;\n  margin-left: 0;\n  margin-right: 0;\n  background: transparent;\n  border: 0;\n  box-shadow: none;\n  border-radius: 0;\n  overflow: hidden;\n}`);

// Make sure the image acts as a cover or fill without warping
css = css.replace(/\.cover-hero-photo {[\s\S]*?}/, `.cover-hero-photo {\n  width: 100%;\n  height: 100%;\n  min-height: 120px;\n  max-height: 180px;\n  object-fit: cover;\n  object-position: center center;\n  transform: none;\n  display: block;\n  background: transparent;\n}`);

fs.writeFileSync(cssPath, css);
console.log('Appended logo and banner fixes.');
