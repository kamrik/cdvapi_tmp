#!/usr/bin/env node

/*
Experimenting with minimal code that would be able to
 - create platform project (cordova platform add)
 - add a plugins to it (all at once?)
 - build and run

This is temporarily but intentionally written as if the language is Basic - all var are global.
This helps me to stay unbiased as to what data / object  structure are best to encapsulate
the whole cordova project thing.

*/

/* jshint sub:true, quotmark: false, debug:true */

var PluginInfoProvider = require('./src/PluginInfoProvider');
var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var et = require('elementtree');
var __ = require('underscore');

//var ConfigKeeper = require('./src/ConfigKeeper');
var config_changes  = require('./src/config-changes');
var mungeutil = require('./src/munge-util');

var ConfigParser  = require('./src/ConfigParser');

var events = require('./src/events');

var common = require('./src/platforms/common');

var pluginProvider = new PluginInfoProvider();
var platform = 'android';
var handler = require('./src/platforms/' + platform);



var project_dir = path.join(__dirname, 'build/platforms/', platform);
// The cfg might not be even coming from a file
// though for now we only have the ConfigParser that
var cfg = new ConfigParser(path.join(__dirname, 'build', 'config.xml'));
var wwwDir = handler.www_dir(project_dir);
var platformPluginsDir = path.join(wwwDir, 'plugins');
var installedPlugins = [];

var ParserConstructor = require('./src/platforms/' + platform + '_parser');
var parser = new ParserConstructor(project_dir);


var jsModuleObjects = [];



// copied from plugman/prepare.js - old way, not browserify
// TODO: replace with wofs and simpler paths
function copyJsModule(module, pluginInofo) {
    // Copy the plugin's files into the www directory.
    // NB: We can't always use path.* functions here, because they will use platform slashes.
    // But the path in the plugin.xml and in the cordova_plugins.js should be always forward slashes.
    var pathParts = module.src.split('/');

    var fsDirname = path.join.apply(path, pathParts.slice(0, -1));
    var fsDir = path.join(platformPluginsDir, pluginInofo.id, fsDirname);
    shell.mkdir('-p', fsDir);

    // Read in the file, prepend the cordova.define, and write it back out.
    var moduleName = pluginInofo.id + '.';
    if (module.name) {
        moduleName += module.name;
    } else {
        var result = module.src.match(/([^\/]+)\.js/);
        moduleName += result[1];
    }

    var fsPath = path.join.apply(path, pathParts);
    var scriptContent = fs.readFileSync(path.join(pluginInofo.dir, fsPath), 'utf-8').replace(/^\ufeff/, ''); // Window BOM
    if (fsPath.match(/.*\.json$/)) {
        scriptContent = 'module.exports = ' + scriptContent;
    }
    scriptContent = 'cordova.define("' + moduleName + '", function(require, exports, module) { ' + scriptContent + '\n});\n';
    fs.writeFileSync(path.join(platformPluginsDir, pluginInofo.id, fsPath), scriptContent, 'utf-8');

    // Prepare the object for cordova_plugins.json.
    var obj = {
        file: ['plugins', pluginInofo.id, module.src].join('/'),
        id: moduleName
    };
    if (module.clobbers.length > 0) {
        obj.clobbers = module.clobbers.map(function(o) { return o.target; });
    }
    if (module.merges.length > 0) {
        obj.merges = module.merges.map(function(o) { return o.target; });
    }
    if (module.runs) {
        obj.runs = true;
    }

    // Add it to the list of module objects bound for cordova_plugins.json
    jsModuleObjects.push(obj);
}


function savePluginsList() {
    // Write out moduleObjects as JSON wrapped in a cordova module to cordova_plugins.js
    var final_contents = "cordova.define('cordova/plugin_list', function(require, exports, module) {\n";
    final_contents += 'module.exports = ' + JSON.stringify(jsModuleObjects,null,'    ') + ';\n';
    final_contents += 'module.exports.metadata = \n';
    final_contents += '// TOP OF METADATA\n';
    var pluginMetadata = {};
    installedPlugins.forEach(function (p) {
        pluginMetadata[p.id] = p.version;
    });
    final_contents += JSON.stringify(pluginMetadata, null, '    ') + '\n';
    final_contents += '// BOTTOM OF METADATA\n';
    final_contents += '});'; // Close cordova.define.

    events.emit('verbose', 'Writing out cordova_plugins.js...');
    fs.writeFileSync(path.join(wwwDir, 'cordova_plugins.js'), final_contents, 'utf-8');
}


// Copied from cordova/prepare
function textMatch(elm1, elm2) {
    var text1 = elm1.text ? elm1.text.replace(/\s+/, '') : '',
        text2 = elm2.text ? elm2.text.replace(/\s+/, '') : '';
    return (text1 === '' || text1 === text2);
}

var BLACKLIST = ['platform', 'feature'];
var SINGLETONS = ['content', 'author'];
function mergeXml(src, dest, platform, clobber) {
    // Do nothing for blacklisted tags.
    if (BLACKLIST.indexOf(src.tag) != -1) return;

    //Handle attributes
    Object.getOwnPropertyNames(src.attrib).forEach(function (attribute) {
        if (clobber || !dest.attrib[attribute]) {
            dest.attrib[attribute] = src.attrib[attribute];
        }
    });
    //Handle text
    if (src.text && (clobber || !dest.text)) {
        dest.text = src.text;
    }
    //Handle platform
    if (platform) {
        src.findall('platform[@name="' + platform + '"]').forEach(function (platformElement) {
            platformElement.getchildren().forEach(mergeChild);
        });
    }

    //Handle children
    src.getchildren().forEach(mergeChild);

    function mergeChild (srcChild) {
        var srcTag = srcChild.tag,
            destChild = new et.Element(srcTag),
            foundChild,
            query = srcTag + '',
            shouldMerge = true;

        if (BLACKLIST.indexOf(srcTag) === -1) {
            if (SINGLETONS.indexOf(srcTag) !== -1) {
                foundChild = dest.find(query);
                if (foundChild) {
                    destChild = foundChild;
                    dest.remove(0, destChild);
                }
            } else {
                //Check for an exact match and if you find one don't add
                Object.getOwnPropertyNames(srcChild.attrib).forEach(function (attribute) {
                    query += '[@' + attribute + '="' + srcChild.attrib[attribute] + '"]';
                });
                foundChild = dest.find(query);
                if (foundChild && textMatch(srcChild, foundChild)) {
                    destChild = foundChild;
                    dest.remove(0, destChild);
                    shouldMerge = false;
                }
            }

            mergeXml(srcChild, destChild, platform, clobber && shouldMerge);
            dest.append(destChild);
        }
    }
}



// plugins is a PluginInfoProvider (not yet, currently it's only a list)
function install(plugins) {

    // Copy the default config.xml
    // It should just sit at parser.config_xml() from the beginning, savepoints should take care of it all
    var defaultRuntimeConfigFile = path.join(project_dir, 'cordova', 'defaults.xml');
    shell.cp('-f', defaultRuntimeConfigFile, parser.config_xml());


    // Install plugins into this platform project
    // NEXT2: check some constraints (dependencies, compatibility to target platfor(s))
    // NEXT1: validate variables are ok for all plugins (should be done per platform)
    // NEXT2: Check <engine> tags against platform version(s)

    // NEXT1: hooks before_plugin_install (context is the project object)

    // Handle install for all the files / assets
    var p = plugins[0];
    var sourceFiles = p.getSourceFiles(platform);
    var headerFiles = p.getHeaderFiles(platform);
    var resourceFiles = p.getResourceFiles(platform);
    var frameworkFiles = p.getFrameworks(platform);
    var libFiles = p.getLibFiles(platform);
    var assetFiles = p.getAssets(platform);


    var installer = handler['source-file'].install;
    sourceFiles.forEach(function(item) {
        installer(item, p.dir, project_dir, p.id, {});
    });

    installer = handler['header-file'].install;
    headerFiles.forEach(function(item) {
        installer(item, p.dir, project_dir, p.id, {});
    });

    installer = handler['resource-file'].install;
    resourceFiles.forEach(function(item) {
        installer(item, p.dir, project_dir, p.id, {});
    });

    installer = handler['framework'].install;
    frameworkFiles.forEach(function(item) {
        installer(item, p.dir, project_dir, p.id, {});
    });

    installer = handler['lib-file'].install;
    libFiles.forEach(function(item) {
        installer(item, p.dir, project_dir, p.id, {});
    });

    // This was originally part of prepare
    // Need to either redo on each prepare, or put in a staging www dir
    // that will be later copied into the real www dir on each prepare / www update.
    assetFiles.forEach(function(item) {
        common.asset.install(item, p.dir, wwwDir); // use plugins_wwww for this
    });

    // Save/update metadata in project
    installedPlugins.push(p);

    // Do js magic for plugins (part of prepare)
    var jsModules = p.getJsModules(platform);
    jsModules.forEach(function(jsModule) {
        // addJsModule(jsModule)
        copyJsModule(jsModule, p);
    });

    savePluginsList();  // this one should also go into plugins_www


    // ## Do config magic for plugins
    // config-changes.PlatformMunger does a lot of things that are too smart
    // It caches and writes its own files (via ConfigKeeper)
    // Keeps track of how many plugins wanted the same change and deals with uninstallation
    // Shorten it
    // Move some of the logic into platforms - the plist stuff and windows manifests stuff
    var munge = {files:{}};
    var munger = new config_changes.PlatformMunger(platform, project_dir, '', {save:__.noop}, pluginProvider); //
    plugins.forEach(function(p){
        var plugin_munge = munger.generate_plugin_config_munge(p.dir, p.vars);  // TODO: vars is not part of PluginInfo, make sure we get is from somewhere
        mungeutil.increment_munge(munge, plugin_munge);
    });

    // Apply the munge
    for (var file in munge.files) {
        munger.apply_file_munge(file, munge.files[file]); // Should be overrideable by the platform, generic apply_xml_munge, for ios either framework of xml.
    }

    munger.save_all();

    // Save a copy of parser.config_xml() at this point. With all changes from plugins, but no changes merged from project config.

    // TODO: Solve the plugin development case where a single plugin needs to be removed and reinstalled quickly.


    //  ------ All of the above might be way less frequent than the below
    // This is the non-plugin part of prepare, shouldn't probably not be here at all, run later
    //  - Do config magic based on config.xml (versionCode etc)
    //        keep some plugins .. config.xml with plugins munges applied, or reapply them
    //    cp p/cordova/default.xml -> parser.config_xml() or use project root config.xml
    //    // Update platform config.xml based on top level config.xml
    //    _mergeXml(top_cfg_xml -> platform_cfg_xml, platform); // written to platforms/android/res/xml/config.xml
    // prj.mergeRuntimeConfig(cfg) // Should the runtime config just be a file to copy with no merging, maybe with merges per platform?
    var platform_cfg = new ConfigParser(parser.config_xml());
    mergeXml(cfg.doc.getroot(), platform_cfg.doc.getroot(), platform, true);
    platform_cfg.write();

    // Update all the project files
    parser.update_from_config(cfg)
    //  - Copy / update web files (including from plugins? or cache the plugins part of this somewhere)
    //    parser.update_www(); // nukes www, must be changed or called before anything else that writes to www. use plugins_www
    shell.cp('-rf', path.join(__dirname, 'build', 'www', '*'), parser.www_dir());
    // Copy over stock platform www assets (cordova.js)
    shell.cp('-rf', path.join(project_dir, 'platform_www', '*'), parser.www_dir());


    // Sync/serialize project info to a file in wofs (if needed, for plugin rm and reapplying plugin munges etc maybe)
    // wofs.write();

    // NEXT2: display plugin info (maybe not, might be better done by user tool)
    // NEXT1: hooks after_plugin_install
}





/// Testing
events.on('log', console.log);
events.on('error', console.error);
events.on('warn', console.warn);
events.on('verbose', console.log);

var plugins_dir = 'node_modules';
// TODO: add something like all loaded to PluginProvider, or replace the provider with something else or get rid of it altogether
// we might not have any use for it if we preload all plugins

var plugins = pluginProvider.getAllWithinSearchPath(plugins_dir);
install(plugins);
debugger;


