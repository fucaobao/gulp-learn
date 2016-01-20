var gulp = require('gulp');
var	gulpSequence = require('gulp-sequence');//按顺序执行
var uglify = require('gulp-uglify');	   	//压缩JS
var minifyCss = require('gulp-minify-css');	//压缩CSS
var sass = require('gulp-ruby-sass');       //编译sass/scss文件，，不会编译_开头的scss/sass文件
var imagemin = require('gulp-imagemin');   	//压缩图片
var concat = require('gulp-concat');       	//合并文件
var jshint = require('gulp-jshint');       	//检测JS语法
var htmlmin = require('gulp-htmlmin');      //压缩HTML
var map = require('map-stream');
var del = require('del');                   //删除文件
var rename = require('gulp-rename');	   	//修改文件名
var md5 = require('gulp-md5-plus');         //MD5
var fs = require('fs');             		//文件操作
var mkdirp = require('mkdirp');             //递归新建文件夹
var walk = require('./walk')('./canvas');
var paths = {
    js: walk.js,
    css: walk.css,
    image: walk.image,
    html: walk.html,
    other: walk.other,
    dest: 'assets'
};
var getTimestamp = function(){
	var dt = new Date();
    var y = dt.getFullYear(),
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
    del(paths.dest, callback);
});

var myReporter = map(function(file, cb) {
	var parent = paths.dest + '/report/';
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
        .pipe(gulp.dest(function(file){
            var base = file.base,
                cwd = file.cwd;
            return paths.dest + '/' + base.substring(cwd.length + 1);
        }))
        .pipe(md5(10, 'canvas' + '/index_test.html'));
});
gulp.task('css', function () {
    return sass(paths.css)
        .pipe(minifyCss())
        .pipe(gulp.dest(function(file){
            var base = file.base,
                cwd = file.cwd;
            if(base.indexOf(cwd) === -1){
                return paths.dest + '/' + base; 
            }
            return paths.dest + '/' + base.substring(cwd.length + 1);
        }));
});
gulp.task('image', function () {
    return gulp.src(paths.image)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.dest + '/image'));
});
gulp.task('html', function () {
    return gulp.src(paths.html)
        .pipe(htmlmin())
        .pipe(gulp.dest(paths.dest));
});
gulp.task('other', function () {
    return gulp.src(paths.other)
        .pipe(gulp.dest(function(file){
            var base = file.base,
                cwd = file.cwd;
            return paths.dest + '/' + base.substring(cwd.length + 1);
        }));
});
gulp.task('watch', function() {
    gulp.watch(paths.js, ['js']);
    gulp.watch(paths.css, ['css']);
    gulp.watch(paths.image, ['image']);
    gulp.watch(paths.html, ['html']);
    gulp.watch(paths.other, ['other']);
});
// gulp.task('default', ['html', 'js', 'css', 'image', 'other', 'jshint']);
gulp.task('default', gulpSequence(['clean', 'html', 'js', 'css', 'image','other']));
gulp.task('test1', function(callback){
    console.log(1);//执行了
    gulp.run('dest');
});
gulp.task('test2',['clean'], function(callback){
    console.log(2);//没有执行
    gulp.run('dest');
});