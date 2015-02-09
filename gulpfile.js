/*

Experimental app for testing cordova-corelib

Cordova project is created under ./build/ and treated as a build artifact.
`gulp clean` removes the build directory.
`gulp recreate` creates it afresh.

*/


/////// SETTINGS ////////////

// Plugins can't be stores in package.josn right now.
//  - They are published to plugin registry rather than npm.
//  - They don't list their dependency plugins in their package.json.
//    This might even be impossible because dependencies can be platform specific.
var pluginDirs = [
    'node_moduels',
    //'/Users/kamrik/app/cordova/cordova-plugin-test-framework',
    //'/Users/kamrik/app/cordova/cordova-plugin-dialogs',
    ];

// Platform to use for run/emulate. Alternatively, create tasks like runios, runandroid.
var testPlatform = 'browser';


var path = require('path');
var fs = require('fs');
var del = require('del');

var pkg = require('./package.json');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var buildDir = path.join(__dirname, 'build');


//////////////////////// TASKS /////////////////////////////

// All cordova-lib calls (except "cordova create") must be done from within
// the cordova project dir because cordova-lib determines projectRoot from
// process.cwd() in cordova-lib/src/cordova/util.js:isCordova()

gulp.task('jshint', function() {
    gulp.src('./app/www/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('clean', function(cb) {
    // Alternative package for cleaning is gulp-rimraf
    del(['build'], cb);
});


// Create the cordova project under ./build/. This version doesn't use cordova
// create, instead just links config.xml and www/
gulp.task('recreate', ['clean'], function() {
    // TODO: remove "uri" when cordova-lib 0.21.7 is released.
    var srcDir = path.join(__dirname, 'app');

    fs.mkdirSync(buildDir);
    process.chdir(buildDir);

    fs.symlinkSync(path.join('..', 'app', 'config.xml'), 'config.xml');
    fs.symlinkSync(path.join('..', 'app', 'www'), 'www');
    // We could alternatively copy www and then watch it to copy changes.
    // Useful if using SASS CoffeeScrite etc.


    fs.mkdirSync(path.join(buildDir, 'plugins'));
});
