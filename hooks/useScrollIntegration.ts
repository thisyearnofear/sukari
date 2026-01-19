// Platform-agnostic hook index
// Metro/Webpack will automatically choose .native.ts or .web.ts based on the platform
// For ESLint type checking, we export the web version as the default

export type { } from './useScrollIntegration.web';
export { useScrollIntegration } from './useScrollIntegration.web';
