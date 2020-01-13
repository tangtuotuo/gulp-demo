const fs = require('fs');
const gulp = require('gulp');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
const webpack = require('webpack-stream');
const named = require('vinyl-named');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const sass = require('gulp-sass');
const minifycss = require('gulp-minify-css');
const sassImport = require('gulp-sass-import');
const autofx = require('gulp-autoprefixer');
const config = require('./config/config');
const runSequence = require('run-sequence');
const fileinclude = require('gulp-file-include');
const clean = require('gulp-clean');
const pump = require('pump');
const webpackDev = require('./config/webpack.dev.conf.js');
const webpackPro = require('./config/webpack.pro.conf.js');
let entry;//定义入口
//先遍历文件夹
let dirs = fs.readdirSync('./config/');
let isEntry = dirs.filter((value, index) => {
    return value == "entry.js";
})
if (isEntry.length > 0) {
    entry = require('./config/entry');
} else {
    let json = {
        entry: "home.html"
    };
    fs.writeFileSync('./config/entry.js', `exports.entry = ${JSON.stringify(json)}`);
    entry = require('./config/entry');
}
//删除dist文件
gulp.task('clean', function (cb) {
    pump([
        gulp.src('dist'),
        clean()
    ], cb)
})

gulp.task('webpack', function () {
   
    return gulp.src('./src/js/*.js')
        .pipe(named())
        .pipe(webpack(webpackDev))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js'))
});
//打包html
gulp.task('html', function () {

    gulp.src(['./src/pages/*.html', '!./src/pages/include/**.html'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest('./dist/pages'));
});
gulp.task('sass', function () {
    return gulp
        .src(['./src/*.scss', './src/scss/*.scss'])
        .pipe(sassImport())
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(autofx(config.autofx))
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('./dist/css'))
        // .pipe(reload({ stream: true }));
})
//打包公共文件
gulp.task('assets', function () {
    return gulp.src('./src/assets/**/*')
        .pipe(gulp.dest('./dist/assets'))
});

gulp.task('browser', function () {
    browserSync.init({
        server: {
            baseDir: './dist',
            index: '/pages/' + entry.entry.entry
        },
        open: 'external',
        injectChanges: true
    });

    // 监听文件变化，执行相应任务
    gulp.watch('./src/**/*.scss', ['sass']).on('change', reload);
    gulp.watch('./src/*.scss', ['sass']).on('change', reload);
    gulp.watch('./src/pages/**/*.html', ['html']).on('change', reload);
    gulp.watch('./src/assets/**/*', ['assets']).on('change', reload);
    gulp.watch('./src/js/*.js').on('change', reload);
    gulp.watch('./src/**/*.js').on('change', reload);
})

gulp.task('dev', (cb) => {
    // console.log('process dev == ',process)
    runSequence('clean', [
        'webpack', 'html', 'sass', 'assets', 'browser'
    ], cb)
})

gulp.task('pack-js', function () {
    return gulp.src('./src/js/*.js')
        .pipe(named())
        .pipe(webpack(webpackPro))
        .pipe(gulp.dest('./dist/js'))
});
gulp.task('pack-sass', function () {
    return gulp
        .src('./src/scss/*.scss')
        .pipe(sassImport())
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(autofx(config.autofx))
        .pipe(minifycss())
        .pipe(gulp.dest('./dist/css'))
        .pipe(reload({ stream: true }));
})

// 打包生产
gulp.task('build', (cb) => {
    // console.log('process build == ',process)
    runSequence('clean', [
        'pack-js',
        'html',
        'pack-sass',
        'assets'
    ], cb)
})