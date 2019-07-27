// TODO: 构建样式
const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const less = require('gulp-less');
const rename = require('gulp-rename');
// const autoprefixer = require('gulp-autoprefixer');
const postcss = require('gulp-postcss');
const plumber = require('gulp-plumber');
// const packageJSON = require('./package.json');
const findThemes = require('./builder/utils/find-themes');

const configPath = {
  src: './src',
  dist: './dist',
  styles: './src/styles',
  themes: './dist/themes',
}
const plumberOptions = {
  inherit: true,
  errorHandler(error) {
    if (!error) {
      return;
    }
    console.log(`\x1B[31m[${error.plugin}] [${error.name}] : ${error.message.replace(__dirname, '')}\x1B[39m`);
    this.emit('end');
  }
};

const configLess = {
  // 主题目录
  themeDir: configPath.styles + '/themes',
  // common样式文件入口
  common: configPath.styles +  '/common/index.less',
  // 全量样式文件入口
  all: configPath.styles + '/export/index.less',
  // less编译插件
  plugin: [{
    install(ls, pluginManager, functions) {
      functions.add('px2rem', options => `${options.value / 75}rem`);
    }
  }]
};


/**
 * 获取样式皮肤
 * */
function getThemes() {
  const themeDir = path.join(__dirname, configLess.themeDir);
  const themes = fs.readdirSync(themeDir);
  const themesObj = [];

  themes.forEach(theme => {
    if (path.extname(theme) !== '.less') {
      return;
    }
    themesObj.push({
      name: path.basename(theme, '.less'),
      content: fs.readFileSync(path.join(themeDir, theme).toString())
    });
  });
  return themesObj;
}

/**
 * 构建核心样式
 * */
function buildCommon() {
  return gulp
    .src([configLess.common])
    .pipe(plumber(plumberOptions))
    .pipe(findThemes({
      task: 'buildCommon',
      root: path.join(__dirname, configPath.src),
      common: path.join(__dirname, configLess.common),
      themes: getThemes()
    }))
    .pipe(less({
      plugins: configLess.plugin
    }))
    .pipe(postcss())
    .pipe(cleanCSS())
    .pipe(rename(options => {
      console.log('buildCommon -------')
      console.log(options)
      options.dirname = options.basename.slice(0, options.basename.search('-'));
      options.basename = options.basename.slice(options.basename.search('-') + 1);
      console.log(options)
    }))
    .pipe(gulp.dest(configPath.themes));
}

/**
 * 构建全量样式
 * */
function buildAll() {
  return gulp
    .src([configLess.all])
    .pipe(plumber(plumberOptions))
    .pipe(findThemes({
      task: 'buildAll',
      root: path.join(__dirname, configPath.src),
      all: path.join(__dirname, configLess.all),
      themes: getThemes()
    }))
    .pipe(less({
      plugins: configLess.plugin
    }))
    .pipe(postcss())
    .pipe(cleanCSS())
    .pipe(rename(options => {
      console.log('buildAll -------')
      console.log(options)
      options.dirname = options.basename.slice(0, options.basename.search('-'));
      options.basename = options.basename.slice(options.basename.search('-') + 1);
      console.log(options)
    }))
    .pipe(gulp.dest(configPath.themes));
}

/**
 * 构建组件样式
 * */
function buildComponents() {
  return gulp
    .src([configPath.styles + '/components/!(index).less'])
    .pipe(plumber(plumberOptions))
    .pipe(findThemes({
      root: path.join(__dirname, configPath.src),
      themes: getThemes()
    }))
    .pipe(less({
      plugins: configLess.plugin
    }))
    .pipe(postcss())
    .pipe(cleanCSS())
    .pipe(rename(options => {
      console.log('buildComponents -------')
      console.log(options)
      options.dirname = `${options.basename.slice(0, options.basename.search('-'))}`;
      options.basename = options.basename.slice(options.basename.search('-') + 1);
      console.log(options)
    }))
    .pipe(gulp.dest(configPath.themes));
}


function copyFiles() {
  return gulp
    .src([configPath.styles + '/fonts/**/*'])
    .pipe(gulp.dest(configPath.themes + '/fonts'));
}

/** TODO 优化* */
function copyImages() {
  return gulp
    .src([configPath.styles + '/images/*.*'])
    .pipe(gulp.dest(configPath.themes + '/images'));
}
function copyImagesDefault() {
  return gulp
    .src([configPath.styles + '/images/default/**/*'])
    .pipe(gulp.dest(configPath.themes + '/default/images'));
}
function copyImagesBlack() {
  return gulp
    .src([configPath.styles + '/images/black/**/*'])
    .pipe(gulp.dest(configPath.themes + '/black/images'));
}

function watch() {
  gulp.watch([
    configPath.src + '/**/*.less'
  ], gulp.parallel('default'));
}

gulp.task('default', gulp.parallel(buildCommon, buildAll, buildComponents, copyFiles, copyImages, copyImagesDefault, copyImagesBlack));
// gulp.task('default', gulp.parallel(buildCommon));
// gulp.task('default', gulp.parallel(buildCommon, buildAll, buildComponents));

gulp.task('watch', gulp.series('default', watch));