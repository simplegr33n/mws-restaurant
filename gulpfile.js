const gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
const responsive = require('gulp-responsive');
const size = require('gulp-size');
const babel = require('gulp-babel');
const terser = require('gulp-terser');
const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const del = require('del');
const browserSync = require('browser-sync').create();

const $ = gulpLoadPlugins();

const paths = {
    src: 'app/**/*', // source directory
    srcHTML: 'app/**/*.html',
    srcCSS: 'app/**/*.css',
    srcJS: 'app/**/*.js',

    tmp: 'tmp', // tmp directory
    tmpIndex: 'tmp/index.html',
    tmpCSS: 'tmp/**/*.css',
    tmpJS: 'tmp/**/*.js',

    dist: 'dist', // dist directory
    distIndex: 'dist/index.html',
    distCSS: 'dist/**/*.css',
    distJS: 'dist/**/*.js'
};

// UTILITY - GULP TASKS
// HTML output task
gulp.task('html', () => {
    return gulp.src(paths.srcHTML)
        .pipe(size({ title: 'html' }))   // logs file size
        .pipe(gulp.dest(paths.tmp));
});
// CSS output task
gulp.task('css', () => {
    return gulp.src(paths.srcCSS)
        .pipe(size({ title: 'css' }))   // logs file size
        .pipe(gulp.dest(paths.tmp));
});
// JS output task
gulp.task('js', () => {
    return gulp.src(paths.srcJS)
        .pipe(babel())                      // transpiles js
        .pipe(terser())                     // condense & minify
        .pipe(size({ title: 'scripts' }))   // logs file size
        .pipe(gulp.dest(paths.tmp));
});
// Copy task
gulp.task('copy', gulp.series('html', 'css', 'js'));
// Empty output directories task
gulp.task('clean', (done) => {
    del(['tmp/*', 'dist/*']);
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
        .pipe(gulp.dest('tmp/img'))
        .pipe(gulp.dest('dist/img'));
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
        .pipe(gulp.dest(paths.tmp));
});


// BUILD / SERVE / WATCH - GULP TASKS
// Build
gulp.task('default', gulp.series('images', 'copy'));

// Serve site and watch js
gulp.task('serve', () => {
    browserSync.init({
        server: paths.tmp,
        port: 8000
    });

    gulp.watch(paths.srcJS, gulp.series('js-watch'));
});

// Build site, output js, serve (and watch js)
gulp.task('build:serve', gulp.series('images', 'copy', 'serve'));

// Series 'js-watch' after 'js' completes before browserSync reload
gulp.task('js-watch', gulp.series('js'), (done) => {
    browserSync.reload();
    done();
});



