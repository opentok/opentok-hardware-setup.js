var gulp = require('gulp');
var serve = require('gulp-serve');

gulp.task('serve', serve({ root: __dirname, port: 8100 }));
