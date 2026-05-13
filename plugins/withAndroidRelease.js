const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Expo config plugin to enable ProGuard/R8 code shrinking for release builds.
 * This reduces APK/AAB size and obfuscates code.
 */
const withAndroidRelease = (config) => {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Enable ProGuard/R8 for release builds
    if (buildGradle.includes('minifyEnabled false') || buildGradle.includes('shrinkResources false')) {
      buildGradle = buildGradle.replace(
        /release\s*\{[^}]*\}/s,
        (match) => {
          return match
            .replace(/minifyEnabled\s+false/, 'minifyEnabled true')
            .replace(/shrinkResources\s+false/, 'shrinkResources true');
        }
      );
    }

    // If release block exists but doesn't have minify settings, add them
    if (buildGradle.includes('buildTypes') && !buildGradle.includes('minifyEnabled')) {
      buildGradle = buildGradle.replace(
        /(release\s*\{)/,
        '$1\n            minifyEnabled true\n            shrinkResources true'
      );
    }

    config.modResults.contents = buildGradle;
    return config;
  });
};

module.exports = withAndroidRelease;
