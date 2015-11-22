var gulp = require('gulp');
var	gulpSequence = require('gulp-sequence');//按顺序执行
var uglify = require('gulp-uglify');	   	//压缩JS
var minifyCss = require('gulp-minify-css');	//压缩CSS
var imagemin = require('gulp-imagemin');   	//压缩图片
var concat = require('gulp-concat');       	//合并文件
var jshint = require('gulp-jshint');       	//合并文件
var map = require('map-stream');
var del = require('del');				   	//删除文件
var rename = require('gulp-rename');	   	//修改文件名
var rev = require('gulp-rev');             	//MD5
var fs = require('fs');             		//文件操作
var mkdirp = require('mkdirp');             //递归新建文件夹
var paths = {
    js: ['./canvas/js/*.js'],
    css: ['./canvas/css/*.css'],
    images: ['./canvas/images/*.*'],
    page: ['./canvas/*.html'],
    build: 'build'
};
var getTimestamp = function(){
	var dt = new Date();
        y = dt.getFullYear(),
        M = dt.getMonth() + 1,
        d = dt.getDate(),
        h = dt.getHours(),
        m = dt.getMinutes(),
        sec = dt.getSeconds(),
        minsec = dt.getMilliseconds();
        while (String(minsec).length < 3) {
            minsec = "0" + minsec;
        }
        return String(y) + _addPrefix(M) + _addPrefix(d) + _addPrefix(h) + _addPrefix(m) + _addPrefix(sec) + minsec;

    	function _addPrefix(num) {
            return num < 10 ? '0' + num : num;
        }
};
var getFileName = function(path){
    var suffix = '.txt',
        prefix = '/report-';
    if(!path){
        return prefix + getTimestamp() + suffix;
    }
    var indexL = path.lastIndexOf('/'),
        indexR = path.lastIndexOf('\\');
    if(indexL === -1 && indexR === -1){
        return prefix + getTimestamp() + suffix;
    } else if(indexL !== -1){
        return prefix + path.substring(indexL + 1) + suffix;
    } else {
        return prefix + path.substring(indexR + 1) + suffix;
    }
};
gulp.task('clean', function (callback) {
    del(paths.build, callback);
});

var myReporter = map(function(file, cb) {
	var parent = paths.build + '/report/';
    mkdirp(parent, function(err, callback) {
        if (!file.jshint.success) {
            var filename = parent + getFileName(file.path);
            file.jshint.results.forEach(function(err) {
                if (err) {
                    fs.appendFile(filename, 'file:'+ err.file + ', line ' + err.error.line + ', col ' + err.error.character + ', code ' + err.error.code + ', ' + err.error.reason + '\n');
                }
            });
        }
        cb(null, file);
    });
});
gulp.task('jshint', function () {
    return gulp.src(paths.js)
        .pipe(jshint())
        .pipe(myReporter);
        // .pipe(jshint.reporter('default'));
});
gulp.task('js', function () {
    return gulp.src(paths.js)
        .pipe(uglify())
        .pipe(gulp.dest(paths.build + '/js'));
});
gulp.task('css', function () {
    return gulp.src(paths.css)
        .pipe(minifyCss())
        .pipe(gulp.dest(paths.build + '/css'));
});
gulp.task('images', function () {
    return gulp.src(paths.images)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.build + '/images'));
});
gulp.task('page', function () {
    return gulp.src(paths.page)
        .pipe(gulp.dest(paths.build));
});
gulp.task('watch', function() {
    gulp.watch(paths.js, ['js']);
    gulp.watch(paths.css, ['css']);
    gulp.watch(paths.images, ['images']);
    gulp.watch(paths.page, ['page']);
});
gulp.task('default', ['js', 'css', 'images', 'page', 'jshint']);
// gulp.task('default', gulpSequence('clean', ['js', 'css', 'images', 'page']));
gulp.task('test1', function(callback){
    console.log(1);//执行了
    gulp.run('build');
});
gulp.task('test2',['clean'], function(callback){
    console.log(2);//没有执行
    gulp.run('build');
});