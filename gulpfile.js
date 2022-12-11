var gulp = require('gulp');
var clean = require('gulp-clean');
var autoprefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var htmlmin = require('gulp-htmlmin');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');

// Set the browser that you want to support
const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10',
];

// Gulp task to minify CSS files
gulp.task('pack-sass', function () {
    return (
        gulp
            .src('./assets/sass/styles.scss')
            // Compile SASS files
            .pipe(
                sass({
                    outputStyle: 'nested',
                    precision: 10,
                    includePaths: ['.'],
                    onError: console.error.bind(console, 'Sass error:'),
                })
            )
            // Auto-prefix css styles for cross browser compatibility
            .pipe(autoprefixer({ browsers: AUTOPREFIXER_BROWSERS }))
            // Minify the file
            .pipe(csso())
            // Output
            .pipe(gulp.dest('./build/css'))
    );
});

// Gulp task to minify CSS files
gulp.task('pack-css', function () {
    return gulp.src('assets/css/**/*.css').pipe(gulp.dest('./build/css'));
});

// Gulp task to minify JavaScript files
gulp.task('pack-js', function () {
    return (
        gulp
            .src('./assets/js/**/*.js')
            // Minify the file
            .pipe(uglify())
            // Output
            .pipe(gulp.dest('./build/js'))
    );
});

// Gulp task to minify HTML files
gulp.task('pack-html', function () {
    return gulp
        .src(['./assets/**/*.html'])
        .pipe(
            htmlmin({
                collapseWhitespace: true,
                removeComments: true,
            })
        )
        .pipe(gulp.dest('./build'));
});

// Clean output directory
gulp.task('clean', () =>
    gulp.src('build', { read: false, allowEmpty: true }).pipe(clean())
);

// Gulp task to minify all files
gulp.task('default', gulp.series('clean', 'pack-css', 'pack-js', 'pack-html'));
