const gulp = require('gulp');
const size = require('gulp-size');
const babel = require('gulp-babel');
const terser = require('gulp-terser');
const del = require('del');
const browserSync = require('browser-sync').create();

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
// HTML output to tmp
gulp.task('html', () => {
    return gulp.src(paths.srcHTML)
    .pipe(size({ title: 'html' }))   // logs file size
        .pipe(gulp.dest(paths.tmp));
});
// CSS output to tmp
gulp.task('css', () => {
    return gulp.src(paths.srcCSS)
        .pipe(size({ title: 'css' }))   // logs file size
        .pipe(gulp.dest(paths.tmp));
});
// JS output to tmp
gulp.task('js', () => {
    return gulp.src(paths.srcJS)
        .pipe(babel())                      // transpiles js
        .pipe(terser())                     // minifies js
        .pipe(size({ title: 'scripts' }))   // logs file size
        .pipe(gulp.dest(paths.tmp));
});
// Copy task runs html/css/js to tmp tasks
gulp.task('copy', gulp.series('html', 'css', 'js'));
// Empty output directories with del
gulp.task('clean', (done) => {
    del(['tmp/*', 'dist/*']);
    done();
});


// BUILD / SERVE / WATCH - GULP TASKS
// Build
gulp.task('default', gulp.series('copy', 'js'));

// Serve site and watch js
gulp.task('serve', () => {
    browserSync.init({
        server: paths.tmp,
        port: 8000
    });

    gulp.watch(paths.srcJS, gulp.series('js-watch'));
});

// Build site, output js, serve (and watch js)
gulp.task('build:serve', gulp.series('copy', 'js', 'serve'));

// Series 'js-watch' after 'js' completes before browserSync reload
gulp.task('js-watch', gulp.series('js'), (done) => {
    browserSync.reload();
    done();
});



