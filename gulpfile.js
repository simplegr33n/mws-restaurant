const gulp = require('gulp');
const responsive = require('gulp-responsive');
const size = require('gulp-size');
const babel = require('gulp-babel');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const stripCssComments = require('gulp-strip-css-comments');
const buffer = require('vinyl-buffer');
const del = require('del');
const browserSync = require('browser-sync').create();


const $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*'],
    replaceString: /\bgulp[\-.]/,
    lazy: true,
    camelize: true
});
const reload = browserSync.reload;

let dev = true; // toggle development state

// UTILITY - GULP TASKS
// HTML output task
gulp.task('html', () => {
    return gulp.src('app/*.html')
        .pipe(htmlmin({
            removeComments: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true
        }))
        .pipe(size({ title: 'html' }))   // logs file size
        .pipe(gulp.dest('.tmp'));
});
// CSS output task
gulp.task('css', () => {
    return gulp.src('app/css/*.css')
        .pipe(stripCssComments()) // Strips comments from CSS
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe(
            $.autoprefixer({ browsers: ["> 1%", "last 2 versions", "Firefox ESR"] })
        )
        .pipe($.if(dev, $.sourcemaps.write()))
        .pipe(size({ title: 'css' }))   // logs file size
        .pipe(gulp.dest('.tmp/css'))
        .pipe(reload({ stream: true }));

});
// JS output task
gulp.task('js', () => {
    return gulp.src('app/js/*.js')
        .pipe(babel())                      // transpiles js
        .pipe(terser())                     // condense & minify
        .pipe(size({ title: 'scripts' }))   // logs file size
        .pipe(gulp.dest('.tmp/js'));
});
// Copy task
gulp.task('copy', gulp.series('html', 'css', 'js'));
// Empty output directories task
gulp.task('clean', (done) => {
    del(['.tmp/*', 'dist/*']);
    done();
});
// Responsive Image Build task
gulp.task('images', () => {
    return gulp.src('app/img/*.jpg')
        .pipe(responsive({
            '*.jpg': [
                { width: 300, rename: { suffix: '-300w' }, },
                { width: 400, rename: { suffix: '-400w' }, },
                { width: 600, rename: { suffix: '-600w' }, },
                { width: 800, rename: { suffix: '-800w' }, }
            ]
        }, {
                quality: 30,
                progressive: true,
                withMetadata: false,
            }))
        .pipe(gulp.dest('.tmp/img'))
        .pipe(gulp.dest('dist/img'));
});

// Copy Static Images
gulp.task('static-images', function () {
    return gulp.src('app/img/static/**')
      .pipe(gulp.dest('.tmp/img/static'))
      .pipe(gulp.dest('dist/img/static'));
  });

// Service Worker task
gulp.task('sw', () => {
    var bundler = browserify('./app/sw.js');

    return bundler
        .transform(babelify)    // transpiles to ES5
        .bundle()               // combines code
        .pipe(source('sw.js'))  // get text stream; set destination filename
        .pipe(buffer())         // buffer stream for use with terser
        .pipe(terser())         // condense & minify
        .pipe(size())           // logs file size
        .pipe(gulp.dest('.tmp'));
});


// BUILD / SERVE / WATCH - GULP TASKS
// Build
gulp.task('default', gulp.series('images', 'copy'));

// Serve site and watch js
gulp.task('serve', () => {
    browserSync.init({
        server: '.tmp',
        port: 8000
    });

    gulp.watch('app/js/*.js', gulp.series('js-watch'));
});

// Build site, output js, serve (and watch js)
gulp.task('build:serve', gulp.series('images', 'copy', 'serve'));

// Series 'js-watch' after 'js' completes before browserSync reload
gulp.task('js-watch', gulp.series('js'), (done) => {
    browserSync.reload();
    done();
});



