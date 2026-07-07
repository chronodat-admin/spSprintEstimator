'use strict';

const { execSync } = require('child_process');
const path = require('path');

const script = path.join(__dirname, '..', 'store-assets', 'generate-icons.py');

try {
  execSync(`python "${script}"`, { stdio: 'inherit' });
} catch {
  execSync(`py "${script}"`, { stdio: 'inherit' });
}
