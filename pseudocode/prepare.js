// Prepare, combined form cordova & plugman

run_pre_hooks()
forEach(platform) {
    cp p/cordova/default.xml -> parser.config_xml() or use project root config.xml
    // For android it exists and is copied to res/xml/config.xml

    parser.update_www();

    plugman.prepare = require (browserify?)
    plugman.prepare(platformPath, platform, plugins_dir, null, true, pluginInfoProvider) {
        // Go over the prepare queue and apply the config munges for each plugin
        // that has been (un)installed.
        config_changes.process(...platformJson....)
        // For uninstalled plugins remove js files
        rm -rf p/../www/plugins/<plugin_id>

        for each installed and dependent plugin {
            pluginMetadata[pliginId] = pluginVersion
            // Copy www assets described in <asset> tags.
            for asset in pluginInfo.getAssets(platform)
                common.asset.install(asset, pluginDir, wwwDir);

            // MK: from here copypaste as is
            for jsModule in pluginInfo.getJsModules(platform) {
                // mangle jsModule file contents to wrap it in cordova.define()
                scriptContent = 'cordova.define("' + moduleName + '", function(require, exports, module) { ' + scriptContent + '\n});\n';
                fs.writeFileSync(path.join(platformPluginsDir, plugin_id, fsPath), scriptContent, 'utf-8');
                moduleObjects.push({file:filePath, id:moduleName, clobbers/merges:[], runs:true});
            }
        }

        // Write out moduleObjects as JSON wrapped in a cordova module to cordova_plugins.js
        fs.writeFileSync(path.join(wwwDir, 'cordova_plugins.js'), final_contents, 'utf-8');

    }

    munger.reapply_global_munge(cumulative munge from plugins/ios.json);

    // Update platform config.xml based on top level config.xml
    _mergeXml(top_cfg_xml -> platform_cfg_xml, platform); // written to platforms/android/res/xml/config.xml
    // move this to be part of the copy step above (verify plugman prepare doesn't use config xml)


    parser.update_project(cfg);
    run_post_hooks()
}
