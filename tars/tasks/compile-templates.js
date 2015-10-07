'use strict';

var gulp = tars.packages.gulp;
var gutil = tars.packages.gutil;
var handlebars = tars.packages.gulpHandlebars;
var replace = tars.packages.replace;
var plumber = tars.packages.plumber;
var through2 = tars.packages.through2;
var fs = require('fs');
var notifier = tars.helpers.notifier;
var browserSync = tars.packages.browserSync;

var handlebarsOptions = {
        batch: ['./markup/modules'],
        helpers: require('./helpers/handlebars-helpers.js')
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

if (!tars.flags.ie8 && !tars.flags.ie) {
    patterns.push(
        {
            match: '<link href="%=staticPrefix=%css/main_ie8%=hash=%%=min=%.css" rel="stylesheet" type="text/css">',
            replacement: ''
        }
    );
}

if (!tars.flags.ie9 && !tars.flags.ie) {
    patterns.push(
        {
            match: '<link href="%=staticPrefix=%css/main_ie9%=hash=%%=min=%.css" rel="stylesheet" type="text/css">',
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
            .pipe(plumber({
                    errorHandler: function (error) {
                        notifier.error('An error occurred while compiling handlebars.', error);
                        this.emit('end');
                    }
            }))
            .pipe(
                modulesData
                    ? handlebars(modulesData, handlebarsOptions)
                    : through2.obj(
                        function () {
                            this.emit('error', new Error('An error occurred with data-files!\n' + error));
                        }
                    )
            )
            .pipe(replace({
                patterns: patterns,
                usePrefix: false
            }))
            .pipe(gulp.dest('./dev/'))
            .pipe(browserSync.reload({ stream: true }))
            .pipe(
                notifier.success('Templates\'ve been compiled')
            );
    });
};
