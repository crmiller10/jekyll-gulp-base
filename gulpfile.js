var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var size        = require('gulp-size'); //shows the size of the entire project or files
var prefix      = require('gulp-autoprefixer');
var imagemin    = require('gulp-imagemin');
var pngquant    = require('imagemin-pngquant');
var cp          = require('child_process');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var plumber = require('gulp-plumber');

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'main_js', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('app/_scss/*.scss')
        .pipe(plumber())
        // .pipe(sass({
        //     includePaths: ['scss'],
        //     onError: browserSync.notify
        // }))
        // .pipe(sass())
        // .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('_site/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(size())
        .pipe(gulp.dest('app/css'));
});

// js
gulp.task('main_js', function() {
    gulp.src([
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'app/js/main.js'
        ])
        .pipe(plumber())
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('_site/js'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(size())
        .pipe(gulp.dest('app/js'));
});

// images
gulp.task('image', function() {
    gulp.src('app/img/**')
        .pipe(imagemin({
                progressive: true,
                optimizationLevel: 1,
                svgoPlugins: [
                    {removeViewBox: false},
                    {removeDoctype: true},
                    {removeComments: true},
                    {cleanupNumericValues:
                        {floatPrecision: 2}
                    },
                    {convertColors: {
                            names2hex: false,
                            rgb2hex: false
                        }
                    }],
                use: [pngquant()]
            }
        ))
        .pipe(gulp.dest('_site/img'))
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('app/_scss/**/*.scss', ['sass']);
    gulp.watch('app/js/main.js', ['main_js']);
    // gulp.watch('app/img/**',['image']);

    gulp.watch(['app/*.html', 'app/_layouts/*.html', 'app/_includes/**'], ['jekyll-rebuild']);

});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
