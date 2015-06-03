var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var react = require('gulp-react');
var runSequence = require('run-sequence');
var express = require('express');
var plumber = require('gulp-plumber');
var jshint = require('gulp-jshint');

var servePort = 8000;

var paths = {
  html: 'app/index.html',
  js: ['app/**/*.js', 'app/**/*.jsx'],
  entries: 'app/main.jsx',
  jsOut: 'main.js',
  build: 'build/'
};

var bundlerOptions = {
  entries: paths.entries,
  transform: [reactify],
  debug: true,
  cache: {}, packageCache: {}, fullPaths: true
};

var jshintConfig = {
  node: true,
  browser: true,
  devel: true,
  bitwise: true,
  camelcase: true,
  curly: true,
  eqeqeq: true,
  immed: true,
  latedef: true,
  newcap: true,
  noarg: true,
  noempty: true,
  undef: true,
  strict: true,
  trailing: true,
  indent: 2
};

var logAndEnd = function(error) {
  gutil.log('Error:', error.toString());
  this.emit('end');
};

gulp.task('clean', function(cb) {
  del([paths.build], cb);
});

gulp.task('html', function() {
  gulp.src(paths.html).pipe(gulp.dest(paths.build));
});

gulp.task('lint', function() {
  gulp.src(paths.js)
    .pipe(react())
    .pipe(jshint(jshintConfig))
    .pipe(jshint.reporter('default'));
});

gulp.task('js', function() {
  var bundler = browserify(bundlerOptions);
  plumber(logAndEnd)
    .pipe(bundler.bundle())
    .pipe(source(paths.jsOut))
    .pipe(gulp.dest(paths.build))
});

gulp.task('html-js', ['html', 'js']);

gulp.task('build', function(cb) {
  runSequence('clean', ['html', 'lint', 'js'], cb);
});

gulp.task('serve', ['build'], function(cb) {
  var server = express();
  server.use(express.static(paths.build));
  server.listen(servePort, function() {
    gutil.log('Serving at http://localhost:' + servePort);
    cb();
  });
});

gulp.task('watch', ['build'], function() {
  gulp.watch(paths.html, ['html']);
  gulp.watch(paths.js, ['lint']);
  var bundler = browserify(bundlerOptions);
  var watcher = watchify(bundler, {delay: 1});
  watcher.on('update', function() {
    gutil.log('Updated.');
    plumber(logAndEnd)
      .pipe(watcher.bundle())
      .pipe(source(paths.jsOut))
      .pipe(gulp.dest(paths.build));
  })
    .bundle()
    .pipe(source(paths.jsOut))
    .pipe(gulp.dest(paths.build));
});

gulp.task('wserve', ['watch', 'serve']);
