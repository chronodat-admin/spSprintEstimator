'use strict';

const fs = require('fs');
const path = require('path');

const publisherPath = path.join(__dirname, '..', 'config', 'publisher.json');
const packageSolutionPath = path.join(__dirname, '..', 'config', 'package-solution.json');

const publisher = JSON.parse(fs.readFileSync(publisherPath, 'utf8'));
const packageSolution = JSON.parse(fs.readFileSync(packageSolutionPath, 'utf8'));

const mpnId =
  (process.env.CHRONODAT_MPN_ID || process.env.SPFX_MPN_ID || publisher.mpnId || '').trim();

packageSolution.solution.developer = {
  name: publisher.publisherName || 'Chronodat, LLC',
  websiteUrl: publisher.websiteUrl,
  privacyUrl: publisher.privacyUrl,
  termsOfUseUrl: publisher.termsOfUseUrl,
  mpnId: mpnId || 'Undefined-1.21.1'
};

fs.writeFileSync(packageSolutionPath, `${JSON.stringify(packageSolution, null, 2)}\n`, 'utf8');

if (!mpnId) {
  console.warn(
    '[publisher] developer.mpnId is not set. Add it to config/publisher.json or set CHRONODAT_MPN_ID before AppSource submission.'
  );
} else {
  console.log('[publisher] Applied developer metadata to config/package-solution.json');
}
