let project_folder = "dist"; // Папка в которую будут компилироваться файлы
let sourse_folder = "#src" // Папка из которой надо брать исходники

let path = {
    build: {  //Пути куда GULP будет выгружать уже готовые файлы
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder+"/js/",
        img: project_folder+"/img/",
        fonts: project_folder+"/fonts/"
    },
    src: {  //Пути откуда забираем файлы
        html: [sourse_folder+"/*.html", "!" + sourse_folder + "/_*.html",],
        css: sourse_folder+"/scss/style.scss",
        js: sourse_folder+"/js/script.js",
        img: sourse_folder+"/img/**/*.{jpg, png, svg, gif, ico, webp}", // 2 звездочки - это то что мы будем слушать все подпапки / 1 звёздочка все файлы, а точка расширение
        fonts: sourse_folder+"/fonts/*.ttf",
    },
    watch: {  //Пути файлов которые надо слушать и в этот же момент выполнять
        html: sourse_folder+"/**/*.html", // Слушаем все подпапки где html
        css: sourse_folder+"/scss/**/*.scss",
        js: sourse_folder+"/js/**/*.js",
        img: sourse_folder+"/img/**/*.{jpg, png, svg, gif, ico, webp}",
    },
    clean: "./" + project_folder + "/"//Удаление папки когда каждый раз будем запускать gulp
}

let {src, dest} = require('gulp');
    gulp = require('gulp'); // Сам Gulp
    browsersync = require('browser-sync').create(); // Автообновление в браузере
    fileinclude = require('gulp-file-include'); // собираем несколько файлов в 1
    del = require('del'); // Удаление папки dist
    scss = require('gulp-sass')(require('sass')); // Подключение Scss
    autoprefixer = require('gulp-autoprefixer'); //Добавление гендерных префиксов при компиляции
    group_media = require('gulp-group-css-media-queries'); //Собираем все медиазапросы в одно место
    clean_css = require('gulp-clean-css'); // Чистит и сжимает css
    rename = require('gulp-rename'); // Заменяем обычное название на минифицированное
    uglify = require('gulp-uglify-es').default; // Компилятор минифицированого файла js
    imagemin = require('gulp-imagemin'); // Компилятор минифицированого файла js
    
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

function watchFiles () { //функция для отслеживания (Работает как лайвсервер)
    gulp.watch([path.watch.html],html);
    gulp.watch([path.watch.css],css);
    gulp.watch([path.watch.css],js);
    gulp.watch([path.watch.img],images);
}

function clean () { //Функция для удаления скомпилированой папки
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
