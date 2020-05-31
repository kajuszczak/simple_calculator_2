const distDir = require('path').basename(__dirname)
const srcDir = 'src'

const fs = require('fs')

const path = {
    build: {
        html: `${distDir}/`,
        css: `${distDir}/css/`,
        js: `${distDir}/js/`,
        img: `${distDir}/img/`,
        fonts: `${distDir}/fonts/`,
    },
    src: {
        html: [`${srcDir}/*.html`, `!${srcDir}/_*.html`],
        css: `${srcDir}/assets/scss/main.scss`,
        js: `${srcDir}/js/index.js`,
        img: srcDir + '/assets/img/**/*.+(png|jpg|svg|gif|ico|webp)',
        fonts: `${srcDir}/assets/fonts/*.ttf`,
    },
    watch: {
        html: `${srcDir}/**/*.html`,
        css: `${srcDir}/assets/scss/**/*.scss`,
        js: `${srcDir}/js/**/*.js`,
        img: srcDir + '/assets/img/**/*.+(png|jpg|svg|gif|ico|webp)'
    },
    clean: `./${distDir}/`

}

const { src, dest } = require('gulp')
const gulp = require('gulp')
const browserSync = require('browser-sync').create()
const fileInclude = require('gulp-file-include')
const del = require('del')
const scss = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const mqpacker = require('gulp-group-css-media-queries')
const cleanCss = require('gulp-clean-css')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify-es').default;
const babel = require("gulp-babel")
const imageMin = require('gulp-imagemin')
const webp = require('gulp-webp')
const webpHtml = require('gulp-webp-html')
const webpCss = require('gulp-webp-css')
const svgSprite = require('gulp-svg-sprite')
const ttf2woff = require('gulp-ttf2woff')
const ttf2woff2 = require('gulp-ttf2woff2')
const fonter = require('gulp-fonter')

function browsersync() {
    browserSync.init({
        server: {
            baseDir: `./${distDir}/`
        },
        port: 3000,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileInclude())
        .pipe(webpHtml())
        .pipe(dest(path.build.html))
        .pipe(browserSync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileInclude())
        .pipe(babel())
        .pipe(dest(path.build.js))
        .pipe(babel())
        .pipe(uglify())
        .pipe(
            rename({
                extname: '.min.js'
            }))
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(mqpacker())
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 5 versions'],
                cascade: true
            }))
        .pipe(webpCss())
        .pipe(dest(path.build.css))
        .pipe(cleanCss())
        .pipe(
            rename({
                extname: '.min.css'
            }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(webp({
            quality: 70
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imageMin([
            imageMin.gifsicle({ interlaced: true }),
            imageMin.mozjpeg({ progressive: true }),
            imageMin.optipng({ optimizationLevel: 3 }),
            imageMin.svgo({
                plugins: [
                    { removeViewBox: false }
                ]
            })
        ]))
        .pipe(dest(path.build.img))
        .pipe(browserSync.stream())
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('svgSprite', function () {
    return gulp.src([`${srcDir}/assets/img/svg/*.svg`])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../icons/icons.svg',
                    example: true
                }
            }
        }))
        .pipe(dest(path.build.img))
})

gulp.task('otf', function () {
    return src([`${srcDir}/assets/**/*.otf`])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(`${srcDir}/assets/fonts`))
})

function fontsStyle() {

    let file_content = fs.readFileSync(srcDir + '/assets/scss/_fonts.scss');
    if (file_content == '') {
        fs.writeFile(srcDir + '/assets/scss/_fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(srcDir + '/assets/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}

function watchFiles() {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], images)
}

function clean() {
    return del(path.clean)
}

const build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle)
const watch = gulp.parallel(build, watchFiles, browsersync)
const clear = gulp.series(clean)

exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.img = images
exports.js = js
exports.scss = scss
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch
exports.clear = clear
