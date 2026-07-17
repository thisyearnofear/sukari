// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      'web-build/**',
      '.expo/**',
      'coverage/**',
      'node_modules/**',
      'server/**/node_modules/**',
      'server/**/.wrangler/**',
      'server/leaderboard-worker/worker-configuration.d.ts',
      'scripts/**',
    ],
  },
  {
    files: ['domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react-native',
                'react-native/*',
                'expo',
                'expo-*',
                '@expo/*',
                '@/components/*',
                '@/app/*',
              ],
              message:
                'domain/ is Adherence OS logic (no UI). Use hooks/, components/, or app/ for React Native / Expo / screens.',
            },
          ],
        },
      ],
    },
  },
]);
