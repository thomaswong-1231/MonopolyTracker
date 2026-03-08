const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../app/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Remove player icon hover effect
css = css.replace(/\.clickable-card:hover\s*{[^}]*}/g, '');

// 2. Remove asset card hover effect
css = css.replace(/\.asset-property-card:hover\s*{[^}]*}/g, '');

// 3. Remove rent/buy/trade property card hover effects to be totally safe
css = css.replace(/\.rent-property-card-button:hover\s*{[^}]*}/g, '');
css = css.replace(/\.buy-property-card-button:hover\s*{[^}]*}/g, '');
css = css.replace(/\.trade-property-card-button:hover\s*{[^}]*}/g, '');
css = css.replace(/\.rent-player-card-button:hover\s*{[^}]*}/g, '');

// 4. Modify .asset-property-card-full-set to have rainbow animation statically instead of on hover
// The class is currently structured like `.asset-property-card-full-set:hover { ... }`
// We'll change it to standard `.asset-property-card-full-set` and add the animation property back
css = css.replace(/\.asset-property-card-full-set:hover\s*{([^}]*)}/g, (match, contents) => {
    // replace `animation: none;` with our rainbow shift animation, remove the transform/saturate pop since it's now static
    let newContents = contents.replace(/animation:\s*none;/, 'animation: fullSetBorderShift 3s linear infinite;');
    newContents = newContents.replace(/transform:\s*[^;]*;/, '');
    newContents = newContents.replace(/filter:\s*[^;]*;/, '');
    
    return `.asset-property-card-full-set {${newContents}}`;
});

// Since the dev server might be parsing this and we have some malformed commas from previous step
css = css.replace(/\.asset-property-card:hover,\s*\.asset-property-card-full-set:hover\s*{[^}]*}/g, '');

fs.writeFileSync(cssPath, css);
console.log('Removed hover colors and applied static full-set rainbow animation.');
