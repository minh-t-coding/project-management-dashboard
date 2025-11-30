const fs = require('fs');
const path = require('path');

const patches = [
  {
    moduleName: '@angular/common',
    target: path.join(__dirname, '..', 'node_modules', '@angular', 'common', 'index.d.ts'),
    source: path.join(__dirname, '..', 'patches', 'angular-common-index.d.ts')
  }
];

const copied = [];

patches.forEach((patch) => {
  try {
    if (!fs.existsSync(patch.target) && fs.existsSync(patch.source)) {
      fs.mkdirSync(path.dirname(patch.target), { recursive: true });
      fs.copyFileSync(patch.source, patch.target);
      copied.push(patch.moduleName);
    }
  } catch (error) {
    console.warn(`[fix-angular-types] Failed to patch ${patch.moduleName}:`, error.message);
  }
});

if (copied.length) {
  console.log(`[fix-angular-types] Restored missing declaration files for: ${copied.join(', ')}`);
}
