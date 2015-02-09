run pre hooks
fetch the plugins
validate variables are given (missingVariables)

for each plugin and for each platform
plugman.raw.install(platform, platformRoot, path.basename(dir), pluginsDir, options) {
    possiblyFetch()
    runInstall() {
        if already installed, return;
        check version against <engine> tags (if possible);
        verify (again) that required variables are given;
        call install deps

    }

    hooks before_plugin_install

    handleInstall() {
        // Fill actionstack and execute it.
        var sourceFiles = pluginInfo.getSourceFiles(platform);
        var headerFiles = pluginInfo.getHeaderFiles(platform);
        var resourceFiles = pluginInfo.getResourceFiles(platform);
        var frameworkFiles = pluginInfo.getFrameworks(platform);
        var libFiles = pluginInfo.getLibFiles(platform);

        push 'install' for the above in this order to action stack
        actions.process(platform, project_dir)

        display plugin info sections - pluginInfo.getInfo(platform) // comments to be shown after install
    }

    hooks after_plugin_install

}
run_post_hooks()


####### New install flow

## Thoughts
Plugins are given as dir and plugin_config = {link:true, variables:{x:10},  }  #TODO - better struct for this
Maybe common variables for all of them?
Maybe a list of ['path/to', {path:'path/to', link:true, variables:vars}, 'another/path']
Allow addPluginsFrom(path) ?


## The flow

Load pluginInfo for all plugins

#per platform:

PlatformProject.install(pluginInfoProvider):
    Possibly check some constraints (dependencies, compatibility to target platfor(s))
    validate variables are ok for all plugins (should be done per platform)
    EXT?: Check <engine> tags against platform version(s)

hooks before_plugin_install

Handle insall for all the files / assets
Run prepare ?
Save/update metadata in project
commit

?display plugin info

hooks after_plugin_install














