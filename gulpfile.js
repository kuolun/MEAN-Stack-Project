var gulp = require('gulp');
var browserify = require('gulp-browserify');

gulp.task('browserify', function() {
  return gulp.
    src('./index.js').
    pipe(browserify()).
    pipe(gulp.dest('./bin'));
});

//相依於browserify，所以會先執行
gulp.task('watch', function() {
  gulp.watch(['./*.js'], ['browserify']);
});

//執行時打gulp watch，會執行對應的task
