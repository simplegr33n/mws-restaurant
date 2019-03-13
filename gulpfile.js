// gulp clean = clean tmp and dist
// gulp dist:serve = build and serve dist
// gulp tmp:serve = build and serve tmp

const gulp = require('gulp');
const responsive = require('gulp-responsive');
const size = require('gulp-size');
const babel = require('gulp-babel');
const htmlmin = require('gulp-htmlmin');
const cssnano = require('gulp-cssnano');
const terser = require('gulp-terser');
const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const stripCssComments = require('gulp-strip-css-comments');
const buffer = require('vinyl-buffer');
const del = require('del');
const browserSync = require('browser-sync').create();
const lazypipe = require('lazypipe');


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
    del(['.tmp/*.jpeg', 'dist/*.jpeg', 'dist/static/*', '.tmp/static/*']);
    done();
});

// Copy Static Images
gulp.task('static-images', () => {
    return gulp.src('app/img/static/**')
        .pipe(gulp.dest('.tmp/img/static'))
        .pipe(gulp.dest('dist/img/static'));
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

// Service Worker task
gulp.task('sw', () => {
    var bundler = browserify('./app/sw.js');

    return bundler
        .transform(babelify, { sourceMaps: true })    // transpiles to ES5
        .bundle()               // combines code
        .pipe(source('sw.js'))  // get text stream; set destination filename
        .pipe(buffer())         // buffer stream for use with terser
        .pipe(terser())         // condense & minify
        .pipe(size())           // logs file size
        .pipe(gulp.dest('.tmp'));
});


// BUILD / SERVE / WATCH - GULP TASKS
// Build
// Serve site and watch js
gulp.task('serve', () => {
    browserSync.init({
        server: '.tmp',
        port: 8000
    });

    gulp.watch('app/js/*.js', gulp.series('js-watch'));
});

// .tmp Serve/Watch
gulp.task('tmp', () => {
    browserSync.init({
        server: '.tmp',
        port: 8000
    });

    gulp.watch('.tmp/js/*.js', gulp.series('js-watch', reload));
});

// .tmp - Build site, output js, serve (and watch js)
gulp.task('tmp:serve', gulp.series('images', 'copy', 'tmp'));


// Series 'js-watch' after 'js' completes before browserSync reload
gulp.task('js-watch', gulp.series('js'), (done) => {
    browserSync.reload();
    done();
});


// BUILD / SERVE fully optimized site
// Scan HTML, optimise HTML/CSS/JS
gulp.task('html:dist', function () {

    return gulp.src('app/*.html')
        .pipe($.size({ title: 'html (pre)' }))
        .pipe($.useref({},
            lazypipe().pipe($.sourcemaps.init)
        ))
        .pipe($.if('*.css', $.size({ title: 'styles (pre)' })))
        .pipe($.if('*.css', cssnano()))
        .pipe($.if('*.css', $.size({ title: 'styles (post) ' })))
        .pipe($.if('*.css', $.autoprefixer()))
        .pipe($.if('*.js', $.babel()))
        .pipe($.if('*.js', $.size({ title: 'scripts (pre)' })))
        .pipe($.if('*.js', terser()))
        .pipe($.if('*.js', $.size({ title: 'scripts (post) ' })))
        .pipe($.sourcemaps.write('.'))
        .pipe($.if('*.html', $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            minifyJS: { compress: { drop_console: true } },
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true
        })))

        .pipe($.if('*.html', $.size({ title: 'html (post) ', showFiles: false })))
        .pipe(gulp.dest('dist'));
});

// Optimize Service Worker
gulp.task('sw:dist', function () {
    var bundler = browserify('./app/sw.js', { debug: true }); // ['1.js', '2.js']

    return bundler
        .transform(babelify, { sourceMaps: true })  // required for 'import'
        .bundle()               // concat
        .pipe(source('sw.js'))  // get text stream w/ destination filename
        .pipe(buffer())         // required to use stream w/ other plugins
        .pipe($.size({ title: 'Service Worker (before)' }))
        .pipe($.sourcemaps.init({ loadMaps: true }))
        .pipe(terser())         // minify
        .pipe($.size({ title: 'Service Worker (after) ' }))
        .pipe($.sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
});

// CSS output task for dist
gulp.task('css:dist', () => {
    return gulp.src('app/css/*.css')
        .pipe(stripCssComments()) // Strips comments from CSS
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe(cssnano())
        .pipe(
            $.autoprefixer({ browsers: ["> 1%", "last 2 versions", "Firefox ESR"] })
        )
        .pipe($.if(dev, $.sourcemaps.write()))
        .pipe(size({ title: 'css' }))   // logs file size
        .pipe(gulp.dest('dist/css'))
        .pipe(reload({ stream: true }));

});
// JS output task for dist
gulp.task('js:dist', () => {
    return gulp.src('app/js/*.js')
        .pipe(babel())                      // transpiles js
        .pipe(terser())                     // condense & minify
        .pipe(size({ title: 'scripts' }))   // logs file size
        .pipe(gulp.dest('dist/js'));
});

// Build production files, the default task
gulp.task('default', gulp.series('clean', 'static-images', 'images', 'html:dist', 'css:dist', 'js:dist', 'sw:dist'), (done) => {
    done();
});

gulp.task('dist', function () {
    browserSync.init({
        server: 'dist',
        port: 8000
    });

    gulp.watch(['app/*.html'], gulp.series('html:dist', reload));
    gulp.watch(['app/css/*.css'], gulp.series('html:dist', reload));
    gulp.watch(['app/js/*.js'], gulp.series('html:dist', reload));
    gulp.watch(['app/sw.js'], gulp.series('sw', reload));
});

// .dist - Build site, output js, serve (and watch js)
gulp.task('dist:serve', gulp.series('default', 'dist'));
