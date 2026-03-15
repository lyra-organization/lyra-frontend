const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Ensures SWIFT_ACTIVE_COMPILATION_CONDITIONS includes "DEBUG" in all Debug
 * build configurations. Without this, #if DEBUG in AppDelegate.swift evaluates
 * to false on physical devices, causing:
 *   "No script URL provided. unsanitizedScriptURLString = (null)"
 *
 * See: https://github.com/facebook/react-native/issues/49245
 */
module.exports = function withSwiftDebugFlag(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();

    for (const key in configurations) {
      const configuration = configurations[key];
      if (
        typeof configuration === 'object' &&
        configuration.name === 'Debug'
      ) {
        const current =
          configuration.buildSettings?.SWIFT_ACTIVE_COMPILATION_CONDITIONS ||
          '"$(inherited)"';
        if (!current.includes('DEBUG')) {
          configuration.buildSettings.SWIFT_ACTIVE_COMPILATION_CONDITIONS =
            `"${current.replace(/"/g, '').trim()} DEBUG"`;
        }
      }
    }

    return config;
  });
};
