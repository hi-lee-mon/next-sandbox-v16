import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { definePreview } from '@storybook/nextjs-vite'

export default definePreview({
  parameters: {
    a11y: { test: 'error' },
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  addons: [addonDocs(), addonA11y()],
})

