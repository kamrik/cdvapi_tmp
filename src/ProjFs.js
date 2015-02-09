// Simple FS with some convenience properties
// - Refer to files relative to a root specified during creation
// - Parent dirs don't need to exist, will be created if needed
// - maybe later - caching / tagging / transactivity

/* jshint unused: false */
var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var __ = require('underscore');

exports = ProjFs;
function ProjFs(root) {
    this.root = normalizePath(root);
}

// Methods
ProjFs.prototype.resolve = resolve;
function resolve(p /* , p2, p3... */) {
    var args = __.toArray(arguments);
    args = [this.root].concat(args);
    var absPath = path.resolve.apply(path, args);

    if (absPath.indexOf(this.root) !== 0)
        throw new Error('Path ' + p + ' could not be resolved as ProjFs internal path under ' + this.root);
    return absPath;
}

ProjFs.prototype.exists = exists;
function exists(p) {
    return fs.existsSync(this.resolve(p));

}


ProjFs.prototype._ensureDirExists = _ensureDirExists;
function _ensureDirExists(p) {
    if (!this.exists(p))
        shell.mkdir('-p', this.resolve(p));

}

ProjFs.prototype._ensureParentExists = _ensureParentExists;
function _ensureParentExists(p) {
    var parent = path.dirname(p);
    this._ensureDirExists(parent);

}

ProjFs.prototype.read = read;
function read(filePath, binary) {
    var p = path.resolve(this.root, filePath);
    // TODO: do we ever need to read binary files this way
    if (binary)
        return fs.readFileSync(p);
    else
        return fs.readFileSync(p, 'utf8');
}

ProjFs.prototype.write = write;
function write(filePath, data) {
    fs.writeFileSync(this.resolve(filePath), data);

}

ProjFs.prototype.add = add;
function add (from, toDir, newName) {
    newName = newName || path.basename(from);
    this._ensureDirExists(toDir);
    shell.cp(from, this.resolve(toDir, newName));
}

ProjFs.prototype.cp = cp;
function cp (from, toDir, newName) {
    newName = newName || path.basename(from);
    this._ensureDirExists(toDir);
    shell.cp(this.resolve(from), this.resolve(toDir, newName));
}

ProjFs.prototype.rm = rm;
function rm(p) {
    shell.rm('-rf', this.resolve(p));
    // TODO: remove parent dirs if empty
}

ProjFs.prototype.mv = mv;
function mv (from, to) {
    shell.mv(this.resolve(from), this.resolve(to));
}

// ## Utility functions
function normalizePath(p) {
    return path.resolve(path.normalize(p));
}


function test() {
    var pfs = new ProjFs('/tmp/tstfs');
    pfs.rm('.');
    pfs.add('/Users/kamrik/tmp/ttt.html', 'www/js');
    pfs.cp('www/js/ttt.html', 'www');
    pfs.rm('www/js');
    var txt = pfs.read('www/ttt.html');
    pfs.write('www/newfile.txt', 'HelloWorld');
    console.log(txt.slice(0,10));
}

// test();

