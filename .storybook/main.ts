import { defineMain } from "@storybook/nextjs-vite/node"

// CSF Next
export default defineMain({
  "stories": [
    "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
    "@storybook/addon-a11y",
    "@storybook/addon-themes"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "../public"
  ],
  features: {
    // https://storybook.js.org/docs/api/main-config/main-config-features#experimentaltestsyntax
    changeDetection: true,
    developmentModeForBuild: true,
    experimentalCodeExamples: true,
    experimentalTestSyntax: true,
  },
  viteFinal: async (config) => {
    config.resolve = {
      ...config.resolve,
      // lucide がReactパッケージを依存関係に持っているため、StorybookのReactと重複してしまう問題への対処として必ず一つ使うようにする対応
      dedupe: [...(config.resolve?.dedupe ?? []), 'react', 'react-dom'],
    }
    return config
  },
});