import { definePreview } from '@storybook/nextjs-vite'

export default definePreview({
  parameters: {
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
  addons: [],
})

