'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

build.rig.addPreBuildTask(
  build.subTask('generate-build-info', function generateBuildInfo(_gulp, _buildConfig, done) {
    require('./scripts/generate-build-info.js');
    done();
  })
);

build.rig.addPreBuildTask(
  build.subTask('generate-icons', function generateIcons(_gulp, _buildConfig, done) {
    try {
      require('./scripts/generate-icons.js');
    } catch (err) {
      console.warn('[generate-icons] Skipped icon regeneration:', err instanceof Error ? err.message : err);
    }
    done();
  })
);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

build.initialize(require('gulp'));
