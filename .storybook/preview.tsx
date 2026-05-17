import addonThemes, { withThemeByClassName, withThemeByDataAttribute } from "@storybook/addon-themes";
import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { definePreview } from '@storybook/nextjs-vite'

// tailwindcss有効化(https://storybook.js.org/recipes/tailwindcss/)
import '../app/globals.css';

export default definePreview({
  tags: ['autodocs'],
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
  addons: [addonDocs(), addonA11y(), addonThemes()],
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ]
})