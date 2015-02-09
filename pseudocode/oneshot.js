// All in one shot
var prj = cdv.createProject('./node_modules/cordova-android', './build')
prj.addPlugins(['./node_modules/', './src/myplugin'], {soePluginVar: 'secret'})
prj.updateProjectConfig(cfg);  // cfg is currently ConfigParser('config.xml')
prj.updateRuntimeConfig(cfg);  // Not sure if separate from ProjectConfig
prj.save()

prj.copyWww('./wwww');
prj.run()




// Slow part, runs rarely, create and add most of plugins
var prj = cdv.createProject('./node_modules/cordova-android', './build')
prj.addPlugins(['./node_modules/'])
prj.save('tag_x')  // Add a git style tag

// Quck part - for iterating on www and a plugin currently under development
var prj = cdv.openProject('./build')
prj.rewind('tag_x')
prj.addPlugins(['./src/myplugin'])
prj.copyWww('./mywwww')  // Maybe copy in slow part and update here rsync style.
prj.updateConfig(cfg)
prj.lowLevelHackishOpInsteadOfHooks()
prj.save()

prj.run()


// Plugins have hooks that run in the same process and receive prj object as the context.
// plugin jsmodules are assembled in plugins_www which is copied to www on copyWww.

