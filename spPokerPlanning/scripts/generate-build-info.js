'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkg = require('../package.json');
let commit = 'unknown';

try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  // Non-git environments fall back to "unknown".
}

const target = path.join(__dirname, '..', 'src', 'config', 'buildInfo.ts');
const content = `/** Auto-generated at build time — do not edit manually. */
export const APP_VERSION = '${pkg.version}';
export const APP_COMMIT = '${commit}';

export function getBuildLabel(): string {
  return \`v\${APP_VERSION} \\u00b7 \${APP_COMMIT}\`;
}
`;

fs.writeFileSync(target, content, 'utf8');
