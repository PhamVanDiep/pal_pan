/**
 * Deep Linking Configuration
 *
 * Supported deep links:
 * - pal-pan://home - Mở tab Công Việc
 * - pal-pan://calendar - Mở tab Lịch
 * - pal-pan://files - Mở tab Files
 * - pal-pan://files/pdf - Mở PDF Manager
 * - pal-pan://files/images - Mở Image Gallery
 * - pal-pan://settings - Mở Settings
 * - pal-pan://settings/profile - Mở Profile
 * - pal-pan://settings/device-info - Mở Device Info
 *
 * Universal Links (iOS) and App Links (Android):
 * - https://pal-pan-app-links-vercel.vercel.app/home
 * - https://pal-pan-app-links-vercel.vercel.app/calendar
 * - https://pal-pan-app-links-vercel.vercel.app/files
 * - https://pal-pan-app-links-vercel.vercel.app/settings
 */

import {LinkingOptions} from '@react-navigation/native';

const linking: LinkingOptions<any> = {
  prefixes: [
    'pal-pan://',
    'https://pal-pan-app-links-vercel.vercel.app',
  ],
  config: {
    screens: {
      Home: 'home',
      Calendar: 'calendar',
      Example: {
        screens: {
          PDFTab: {
            screens: {
              PDFExample: 'files/pdf',
              PDFViewer: 'files/pdf/:pdfId',
            },
          },
          ImageTab: {
            screens: {
              ImageGallery: 'files/images',
              ImageViewer: 'files/images/:imageId',
            },
          },
        },
      },
      Settings: {
        screens: {
          SettingsMain: 'settings',
          Profile: 'settings/profile',
          DeviceInfo: 'settings/device-info',
        },
      },
    },
  },
};

export default linking;
