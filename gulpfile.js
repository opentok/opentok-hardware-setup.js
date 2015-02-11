'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var serve = require('gulp-serve');
var uglify = require('gulp-uglify');
var umd   = require('gulp-umd');
var merge = require('merge-stream');

gulp.task('serve', serve({ root: __dirname, port: 8100 }));

gulp.task('default', function() {

  var js = gulp.src('js/*.js')
    .pipe(umd({
      exports: function() {
        return 'createOpentokHardwareSetupComponent';
      },
      namespace: function() {
        return 'createOpentokHardwareSetupComponent'
      }
    }))
    .pipe(gulp.dest('dist/js/'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('dist/js/'));

  var css = gulp.src('css/*.css')
    .pipe(gulp.dest('dist/css/'));

  return merge(js, css);
});
