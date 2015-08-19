'use strict';

var gulp = tars.packages.gulp;
var gutil = tars.packages.gutil;
var handlebars = tars.packages.gulpHandlebars;
var replace = tars.packages.replace;
var through2 = tars.packages.through2;
var fs = require('fs');
var notify = tars.packages.notify;
var notifier = tars.helpers.notifier;
var browserSync = tars.packages.browserSync;

var handlebarsOptions = {
        batch: ['./markup/modules'],
        helpers: require('../../helpers/handlebars-helpers')
    };
var patterns = [];


function concatModulesData() {
    var dataEntry;
    var readyModulesData;

    try {
        dataEntry = fs.readFileSync('./dev/temp/modulesData.js', 'utf8');
    } catch (er) {
        dataEntry = false;
    }

    if (dataEntry) {
        eval('readyModulesData = {' + dataEntry + '}');
    } else {
        readyModulesData = '{}';
    }

    return readyModulesData;
}

if (!tars.flags.ie8) {
    patterns.push(
        {
            match: '<link href="%=staticPrefix=%css/main_ie8%=hash=%%=min=%.css" rel="stylesheet" type="text/css">',
            replacement: ''
        }
    );
}

if (tars.flags.min || tars.flags.release) {
    patterns.push(
        {
            match: '%=min=%',
            replacement: '.min'
        }
    );
} else {
    patterns.push(
        {
            match: '%=min=%',
            replacement: ''
        }
    );
}

if (tars.flags.release) {
    patterns.push(
        {
            match: '%=hash=%',
            replacement: tars.options.build.hash
        }
    );
} else {
    patterns.push(
        {
            match: '%=hash=%',
            replacement: ''
        }
    );
}

patterns.push(
    {
        match: '%=staticPrefix=%',
        replacement: tars.config.staticPrefix
    }
);

/**
 * Handlebars compilation of pages templates.
 * Templates with _ prefix won't be compiled
 */
module.exports = function () {
    return gulp.task('html:compile-templates', function (cb) {
        var modulesData
        var error;

        try {
            modulesData = concatModulesData();
        } catch (er) {
            error = er;
            modulesData = false;
        }

        return gulp.src(['./markup/pages/**/*.html', '!./markup/pages/**/_*.html',
                         './markup/pages/**/*.hbs', '!./markup/pages/**/_*.hbs'])
            .pipe(
                modulesData
                    ? handlebars(modulesData, handlebarsOptions)
                    : through2.obj(
                        function () {
                            console.log(gutil.colors.red('An error occurred with data-files!'));
                            this.emit('error', error);
                        }
                    )
            )
            .on('error', notify.onError(function (error) {
                return '\nAn error occurred while compiling handlebars.\nLook in the console for details.\n' + error;
            }))
            .on('error', function () {
                this.emit('end');
            })
            .pipe(replace({
                patterns: patterns,
                usePrefix: false
            }))
            .on('error', notify.onError(function (error) {
                return '\nAn error occurred while replacing placeholdres.\nLook in the console for details.\n' + error;
            }))
            .pipe(gulp.dest('./dev/'))
            .pipe(browserSync.reload({ stream: true }))
            .pipe(
                notifier('Templates\'ve been compiled')
            );
    });
};