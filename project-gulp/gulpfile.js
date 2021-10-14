let project_folder = require('path').basename(__dirname); // Папка в которую будут компилироваться файлы
let source_folder = "#src"; // Папка из которой надо брать исходники

let fs = require('fs'); // Переменная для обработки шрифтов

let path = {
    build: {  //Пути куда GULP будет выгружать уже готовые файлы
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder+"/js/",
        img: project_folder+"/img/",
        fonts: project_folder+"/fonts/"
    },
    src: {  //Пути откуда забираем файлы
        html: [source_folder+"/*.html", "!" + source_folder + "/_*.html",],
        css: source_folder+"/scss/style.scss",
        js: source_folder+"/js/script.js",
        img: source_folder+"/img/**/*.{jpg, png, svg, gif, ico, webp}", // 2 звездочки - это то что мы будем слушать все подпапки / 1 звёздочка все файлы, а точка расширение
        fonts: source_folder+"/fonts/*.ttf",
    },
    watch: {  //Пути файлов которые надо слушать и в этот же момент выполнять
        html: source_folder+"/**/*.html", // Слушаем все подпапки где html
        css: source_folder+"/scss/**/*.scss",
        js: source_folder+"/js/**/*.js",
        img: source_folder+"/img/**/*.{jpg, png, svg, gif, ico, webp}",
    },
    clean: "./" + project_folder + "/"//Удаление папки когда каждый раз будем запускать gulp
}

let {src, dest} = require('gulp'),
    gulp = require('gulp'), // Сам Gulp
    browsersync = require('browser-sync').create(), // Автообновление в браузере
    fileinclude = require('gulp-file-include'), // собираем несколько файлов в 1
    del = require('del'), // Удаление папки dist
    scss = require('gulp-sass')(require('sass')), // Подключение Scss
    autoprefixer = require('gulp-autoprefixer'), //Добавление гендерных префиксов при компиляции
    group_media = require('gulp-group-css-media-queries'), //Собираем все медиазапросы в одно место
    clean_css = require('gulp-clean-css'), // Чистит и сжимает css
    rename = require('gulp-rename'), // Заменяем обычное название на минифицированное
    uglify = require('gulp-uglify-es').default, // Компилятор минифицированого файла js
    imagemin = require('gulp-imagemin'), // Сжатие изображений
    webp = require('gulp-webp'), // Перевод изображений в webp
    webphtml = require('gulp-webp-html'), // удобсто использования webp в html
    webpcss = require("gulp-webpcss"), // удобсто использования webp в сss
    svgSprite = require('gulp-svg-sprite'), // удобсто для svg
    ttf2woff = require('gulp-ttf2woff'), // Конвертер шрифтов ttf
    ttf2woff2 = require('gulp-ttf2woff2'), // Конвертер шрифтов ttf
    fonter = require('gulp-fonter'); // Конвертер шрифтов otf
     
function browserSync() { //Подключили плагин browsersync
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },
        port: 3000,
        notify: false
    })
}
function html () { // Написали функцию для работы с HTML файлом
    return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

function css () {
    return src(path.src.css)
    .pipe(
        scss({
            outputStyle: "expanded"
        })
    )
    .pipe(
        group_media()
    )
    .pipe(
        autoprefixer({
            overrideBrowserslist: ['last 5 versions'],
            cascade: true
        })
    )
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(
        rename({
            extname: ".min.css"
        })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

function js () { // Написали функцию для работы с HTML файлом
    return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(
        uglify()
    )
    .pipe(
        rename({
            extname: ".min.js"
        })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}
function images () { // Написали функцию для работы с HTML файлом
    return src(path.src.img)
    .pipe(
        webp({
            quality: 70
        })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
        imagemin({
            progressive: true,
            svgPlugins: [{ removeViewBox: false }],
            interlaced: true,
            optimizationLevel: 3 // От 0 до 7
        })
    )
    .pipe(fileinclude())
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

function fonts () {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}
gulp.task('otf2ttf', function() {
    return src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts/'));
})

gulp.task('svgSprite', function() {
    return gulp.src([source_folder + '/iconsprite/*.svg'])
    .pipe(svgSprite({
        mode: {
            stack: {
                sprite: "../icons/icons.svg",
                example: true
            } 
        },
    }
    ))
    .pipe(dest(path.build.img))
})

function fontsStyle() {
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
        if (items) {
            let c_fontname;
            for (var i = 0; i < items.length; i++) {
                let fontname = items[i].split('.');
                fontname = fontname[0];
                if (c_fontname != fontname) {
                    fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                }
                c_fontname = fontname;
            }
        }
    })
    }
}
    
function cb() { }

function watchFiles () { //функция для отслеживания (Работает как лайвсервер)
    gulp.watch([path.watch.html],html);
    gulp.watch([path.watch.css],css);
    gulp.watch([path.watch.css],js);
    gulp.watch([path.watch.img],images);
}

function clean () { //Функция для удаления скомпилированой папки
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
