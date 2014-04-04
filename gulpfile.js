// Include gulp
var gulp        = require('gulp'),

/*---------------------------------------------------------------------------------------------
 * Gulp plugins.
 ---------------------------------------------------------------------------------------------*/
    gutil       = require('gulp-util'),
    rename      = require('gulp-rename'),
    notify      = require('gulp-notify'),
    scss        = require('gulp-sass'),
    //graph       = require('gulp-sass-graph'),
    imagemin    = require('gulp-imagemin'),
    watch       = require('gulp-watch'),
    plumber     = require('gulp-plumber'),
    jshint      = require('gulp-jshint'),
    map         = require('map-stream'),
    uglify      = require('gulp-uglify'),
    livereload  = require('gulp-livereload'),
    lr          = require('tiny-lr'),
    server      = lr(),
    path        = ''
    //browserSync = require('browser-sync'),
    //concat   = require('gulp-concat'),
    ;


/*---------------------------------------------------------------------------------------------
 * Input, Output paths and environment variables.
 ---------------------------------------------------------------------------------------------*/
    var input_paths = {
        images:  [path + 'src/img/**/*.jpg', path + 'src/img/**/*.png', path + 'src/img/**/*.gif', '!images/min{,/**}'],
        scripts: [path + 'src/js/**/*.js', '!scripts/min{,/**}'],
        styles:  [path + 'src/scss/**/*.scss', '!' + path + 'src/scss/partials{,/**}']
    }

    var output_paths = {
        images:  path + 'dist/img',
        scripts: path + 'dist/js',
        styles:  path + 'dist/css'
    }

    var template_paths = {
        html: ['**/*.html', '**/*.twig']
    }

    //var DEV_URL = 'dev.gulp.com';


/*---------------------------------------------------------------------------------------------
 * Plugin options.
 ---------------------------------------------------------------------------------------------*/

    // Sass
    var scss_options = {
        outputStyle: 'compressed', // variables - https://github.com/andrew/node-sass
        errLogToConsole: false,
        onError: function(err) {
            notify().write(err);                    // Growl it.
            console.log(gutil.colors.red(err));      // Log the occurred error.
            process.stdout.write('\x07');          // Beep boop the terminal.
        }
    };

    // JS Uglify
    var uglify_options = {}

    // Notifications
    var notify_options = {
        message: "<%= file.relative %>"
    };

    // jsHint error notification
    var custErr = map(function (file, cb, err) {
        if (!file.jshint.success) {

            notify().write(file.path);      // Growl it.
            process.stdout.write('\x07');   // Beep boop the terminal.

            // console.log(' ' +file.path + ': line ' + err.line + ', col ' + err.character + ', code ' + err.code + ', ' + err.reason);
        }
        cb(null, file);
    });


/*---------------------------------------------------------------------------------------------
 * Gulp Tasks.
 ---------------------------------------------------------------------------------------------*/
    gulp.task( 'styles', function() {

        // Compile and minify scss.
        return gulp.src( input_paths.styles )
            .pipe( scss( scss_options ) )
            // .pipe( rename( function ( path ) {
            //  path.dirname = path.dirname.replace( path + '', '' );
            // } ) )
            .pipe( gulp.dest( output_paths.styles ) )
            .pipe( notify( notify_options ) );

    });

    gulp.task( 'scripts', function() {

        // Minify JavaScript (except vendor scripts)
        return gulp.src( input_paths.scripts )
            .pipe( uglify( uglify_options ) )
            .pipe( rename( function ( path ) {
                //path.dirname = path.dirname.replace( path + '', '' );
                path.basename += '.min';
            }))
            .pipe( gulp.dest( output_paths.scripts ) )
            .pipe( notify( notify_options ) );

    });

    gulp.task( 'images', function() {

        // Minify and copy all JavaScript (except vendor scripts)
        return gulp.src( input_paths.images )
            .pipe(imagemin())
            .pipe( rename( function ( path ) {
                //path.dirname = path.dirname.replace( path + '', '' );
                path.basename += '.min';
            }))
            .pipe( gulp.dest( output_paths.images ) )
            .pipe( notify( notify_options ) );

    });

    // gulp.task('browser-sync', function() {
    //     browserSync.init([output_paths.styles + '**/*.css', output_paths.scripts + '**/*.min.js'], {
    //      proxy: {
    //          host: DEV_URL
    //      }
    //     });
    // });




    gulp.task('watch', ['styles', 'scripts', 'images'], function () {

        server.listen(35729, function (err) {               // Livereload - requires browser plugin
            if (err) { return console.log(err) };
        });

        // Watch HTML
        gulp.src(template_paths.html, { read: false })      // Template source (html, php, twig, etc)
            .pipe(watch())                                  // Watches for file changes
            .pipe(livereload(server))                       // Reload the page
            .pipe( notify( notify_options ) );              // Notify what file was changed

        // Watch SCSS
        //return watch({glob: input_paths.styles, emitOnGlob: false})
        gulp.src(input_paths.styles, { read: false })
            .pipe(plumber())                                // Keeps pipes working after error event
            .pipe(watch())                              // Watches for file changes
            .pipe(scss( scss_options ))                     // SCSS compiler
            .pipe( gulp.dest( output_paths.styles ) )       // Output destination
            .pipe(livereload(server))                       // Reload the page
            .pipe( notify( notify_options ) );              // Notify what file was changed

        // Watch JS
        gulp.src(input_paths.scripts)
            //.pipe(plumber())                              // Keeps pipes working after error event // Not needed here as pipes flow freely
            .pipe(watch())                                  // Watchs for files changed
            .pipe(jshint())                                 // Check JS for errors
            .pipe(jshint.reporter('jshint-stylish'))        // Make any errors report all stylish like
            .pipe(custErr)                                  // Custom notifications for errors (terminal beep and notification)
            .pipe(uglify(uglify_options))                   // Minimize the JS files
            .pipe( rename( function ( path ) {              // Add .min extention
                path.basename += '.min';
            }))
            .pipe(gulp.dest(output_paths.scripts))          // Output destination
            .pipe(livereload(server))                       // Reload the page
            .pipe(notify( notify_options ));                // Notify what was changed

        // Minimize IMGs
        gulp.src( input_paths.images )
            .pipe(imagemin())                               // Minify images
            .pipe( rename( function ( path ) {              // Add .min to minified images
                path.basename += '.min';
            }))
            .pipe( gulp.dest( output_paths.images ) )       // Output destination
            .pipe( notify( notify_options ) );              // Notify what was changed

    });

    // Run this to compile
    gulp.task( 'compile', ['scripts', 'styles', 'images'] );

    // The default task (called when you run `gulp` from cli)
    gulp.task( 'default', [] );
