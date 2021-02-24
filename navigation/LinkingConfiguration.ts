import * as Linking from 'expo-linking'

export default {
  prefixes: [Linking.makeUrl('/')],
  config: {
    screens: {
      Root: {
        screens: {
          TabOne: {
            screens: {
              TabOneScreen: 'sawab',
              PrayerScreen: 'prayer',
              SawabSettingsScreen: 'sawabsettings'
            }
          },
          TabTwo: {
            screens: {
              TabTwoScreen: 'progress'
            }
          },
          TabThree: {
            screens: {
              TabThreeScreen: 'jannah'
            }
          }
        }
      },
      NotFound: '*'
    }
  }
}
