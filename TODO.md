- ConfigParser.mergePlatformSettingsInto(target, platform) or mergeRuntimeConfig in the platform base class
- Move getOrientation from preferences.js to config parser
- Plugin development case with rapid re-installation of one plugin
- Create wofs scaffold - or projfs, data in this fs is not valuable at all, can garble it with no problem
- Convert platforms/common.js to wofs (no shelljs, no create dirs)
- Convert browser and android hndlers to wofs
- Merge cordova platform parsers and plugman platform handlers (to be moved to platform repos)
- Move utils/andorid-project.js to platforms with the parsers and handlers
- Think of some better name, for now cordova-corelib
- Write gulpfiles/projects as harnesses for tests - no unit tests (or some very minimal unit tests)
- Map cli commands + arguments. Go through use cases and show corresponding use cases with the API.


## common things that will probably be used by platform parsers / handlers
 - platforms/common.js


## A bit later
 - Introduce the notion of permissions in plugins instead of relying on XML modifications for this.
   E.g.: AndroidManifest.xml:<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\" />


## Overall idea

projfs (some git like attributes)
save-points
Typical usage where we iterate on www files, a plugin and some project wide settings:
 - create project
 - add plugins except the one we are working on
 - copy heavy www assets that are not going to change (if any)
 - set icon (depending on some build logic, say different icon for debugging version)
 - set splashscreen
 -- Store savepoint X
 Iterate as:
 - revert to savepoint X
 - add the plugin under development
 - copy over web assets
 - apply my global config
