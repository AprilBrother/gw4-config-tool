const gulp = require('gulp');

gulp.task('lib', function () {
  gulp.src([
    'node_modules/jquery-ui-dist/jquery-ui.min.*'
  ]).pipe(gulp.dest('js/jquery-ui'));

  gulp.src([
    'node_modules/jquery/dist/jquery.js'
  ]).pipe(gulp.dest('js'));

  return gulp.src([
    'node_modules/purecss/build/pure-min.css'
  ]).pipe(gulp.dest('css'))

    /*
  return gulp.src([
    'node_modules/marked/marked.min.js',
    'node_modules/mermaid/dist/mermaid.min.js',
    'node_modules/katex/dist/katex.min.js'
  ]).pipe(gulp.dest('js'));
  */
});

