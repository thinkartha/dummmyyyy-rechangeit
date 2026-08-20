const gulp = require('gulp');
const { baseDir, browserSync } = require('./utils.js');

/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
|  Integration
=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-*/
// Ship integration/api-client.js as-is so pages can import it as an ES module.
//
// It is deliberately not part of the rollup bundle pipeline in gulp.json: that
// pipeline concatenates and transpiles into IIFE bundles, and this file is an ES
// module the browser loads directly. Copying keeps one implementation shared by
// the browser and by any Node tooling that imports the same path.

gulp.task('integration', () =>
  gulp
    .src('integration/*.js')
    .pipe(gulp.dest(`${baseDir}/assets/js/integration`))
    .pipe(browserSync.stream())
);
